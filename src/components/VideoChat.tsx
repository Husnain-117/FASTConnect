"use client"
import Navbar from "./Navbar"
import { useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Users,
  Search,
  SkipForward,
  Camera,
  X,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  ],
}

type MatchState = "idle" | "searching" | "matched" | "waiting" | "chatting"
type ConnectionState = "connecting" | "connected" | "failed" | "disconnected"
type ErrorType = "media" | "connection" | "peer" | "ice" | "general"

interface ConnectionError {
  type: ErrorType
  message: string
  canRetry: boolean
}

const VideoChat = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [matchState, setMatchState] = useState<MatchState>("idle")
  const [matchPeer, setMatchPeer] = useState<any>(null)
  const [usersInRoom, setUsersInRoom] = useState<{ id: string; name: string; email: string }[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  // Enhanced connection state management
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [systemMessage, setSystemMessage] = useState<string | null>(null)
  // Removed unused showEndedPopup and callEndedBy

  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { user } = useAuth()
  const { socket } = useSocket()

  isRunning;
  connected;
  const MAX_RETRY_ATTEMPTS = 3
  const RETRY_DELAYS = [2000, 5000, 10000] // Progressive delays

  // Enhanced cleanup function
  const cleanupConnection = useCallback(() => {
    console.log("[VideoChat] Cleaning up connection...")

    // Clear timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }

    // Close peer connection
    if (peerRef.current) {
      peerRef.current.onicecandidate = null
      peerRef.current.ontrack = null
      peerRef.current.onconnectionstatechange = null
      peerRef.current.onicegatheringstatechange = null
      peerRef.current.onsignalingstatechange = null
      peerRef.current.close()
      peerRef.current = null
    }

    // Stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log(`[VideoChat] Stopped ${track.kind} track`)
      })
      localStreamRef.current = null
    }

    // Clean up video elements
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
      remoteVideoRef.current.pause()
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
      localVideoRef.current.pause()
    }

    setConnectionState("disconnected")
  }, [])

  // Enhanced error handling
  const handleConnectionError = useCallback(
    (error: ConnectionError) => {
      console.error(`[VideoChat] ${error.type} error:`, error.message)
      setConnectionError(error)
      setConnectionState("failed")

      if (error.canRetry && retryCount < MAX_RETRY_ATTEMPTS) {
        setIsRetrying(true)
        const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]

        setSystemMessage(
          `Connection failed. Retrying in ${delay / 1000} seconds... (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`,
        )

        retryTimeoutRef.current = setTimeout(() => {
          retryConnection()
        }, delay)
      } else {
        setSystemMessage(error.message + (error.canRetry ? " Please try again manually." : ""))
        setIsRetrying(false)
      }
    },
    [retryCount],
  )

  // Retry connection logic
  const retryConnection = useCallback(async () => {
    if (matchState !== "chatting" || !otherUser) {
      setIsRetrying(false)
      return
    }

    console.log(`[VideoChat] Retrying connection (attempt ${retryCount + 1})`)
    setRetryCount((prev) => prev + 1)
    setConnectionError(null)
    setSystemMessage("Reconnecting...")

    // Clean up previous connection
    cleanupConnection()

    // Small delay before retry
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Restart connection setup
    setupWebRTCConnection()
  }, [matchState, otherUser, retryCount, cleanupConnection])

  // Manual retry function
  const handleManualRetry = useCallback(() => {
    setRetryCount(0)
    setConnectionError(null)
    setIsRetrying(false)
    retryConnection()
  }, [retryConnection])

  // Enhanced WebRTC setup
  const setupWebRTCConnection = useCallback(async () => {
    if (!socket || !user || matchState !== "chatting" || !otherUser) return

    try {
      setConnectionState("connecting")
      setSystemMessage("Connecting...")

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        handleConnectionError({
          type: "connection",
          message: "Connection timeout. The connection took too long to establish.",
          canRetry: true,
        })
      }, 30000) // 30 second timeout

      const isInitiator = socket.id && otherUser && socket.id < otherUser

      // Get user media with enhanced error handling
      let localStream: MediaStream
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        })
        localStreamRef.current = localStream

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
      } catch (mediaError: any) {
        let errorMessage = "Failed to access camera/microphone. "
        if (mediaError.name === "NotReadableError") {
          errorMessage += "Device is already in use by another application."
        } else if (mediaError.name === "NotAllowedError") {
          errorMessage += "Permission denied. Please allow camera and microphone access."
        } else if (mediaError.name === "NotFoundError") {
          errorMessage += "No camera or microphone found."
        } else {
          errorMessage += mediaError.message || "Unknown media error."
        }

        handleConnectionError({
          type: "media",
          message: errorMessage,
          canRetry: mediaError.name !== "NotAllowedError",
        })
        return
      }

      // Create peer connection with enhanced configuration
      const peer = new RTCPeerConnection({
        ...ICE_SERVERS,
        iceCandidatePoolSize: 10,
      })
      peerRef.current = peer

      // Add local stream tracks
      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream)
      })

      // Enhanced peer connection event handlers
      peer.onicecandidate = (event) => {
        if (event.candidate && otherUser) {
          socket.emit("ice-candidate", { candidate: event.candidate, to: otherUser })
        }
      }

      peer.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream
          remoteVideoRef.current.play().catch((e) => {
            if (e.name !== "AbortError") {
              console.error("[VideoChat] Error playing remote video:", e)
            }
          })
        }
      }

      peer.onconnectionstatechange = () => {
        console.log(`[VideoChat] Connection state: ${peer.connectionState}`)

        switch (peer.connectionState) {
          case "connected":
            setConnectionState("connected")
            setConnected(true)
            setRetryCount(0)
            setConnectionError(null)
            setIsRetrying(false)
            setSystemMessage(null)
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current)
              connectionTimeoutRef.current = null
            }
            break
          case "connecting":
            setConnectionState("connecting")
            break
          case "disconnected":
          case "failed":
          case "closed":
            if (matchState === "chatting") {
              handleConnectionError({
                type: "connection",
                message: "Connection lost. Attempting to reconnect...",
                canRetry: true,
              })
            }
            break
        }
      }

      peer.onicegatheringstatechange = () => {
        console.log(`[VideoChat] ICE gathering state: ${peer.iceGatheringState}`)
      }

      peer.onsignalingstatechange = () => {
        console.log(`[VideoChat] Signaling state: ${peer.signalingState}`)
      }

      // Handle offer/answer exchange
      if (isInitiator) {
        try {
          const offer = await peer.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          })
          await peer.setLocalDescription(offer)
          socket.emit("offer", { offer, to: otherUser })
        } catch (error: any) {
          handleConnectionError({
            type: "peer",
            message: "Failed to create offer: " + error.message,
            canRetry: true,
          })
        }
      }
    } catch (error: any) {
      handleConnectionError({
        type: "general",
        message: "Failed to setup connection: " + error.message,
        canRetry: true,
      })
    }
  }, [socket, user, matchState, otherUser, handleConnectionError])

  // Socket event handlers for video chat
  useEffect(() => {
    if (!socket || !user) return

    const userInfo = { id: user._id, name: user.name, email: user.email }
    socket.emit("join-video-chat", userInfo)

    const handleVideoChatUsers = (users: any) => {
      setUsersInRoom(users)
    }

    socket.on("video-chat-users", handleVideoChatUsers)

    return () => {
      socket.emit("leave-video-chat")
      socket.off("video-chat-users", handleVideoChatUsers)
    }
  }, [socket, user])

  // Enhanced socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleOffer = async ({ offer, from }: { offer: any; from: string }) => {
      if (!peerRef.current) return
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerRef.current.createAnswer()
        await peerRef.current.setLocalDescription(answer)
        socket.emit("answer", { answer, to: from })
      } catch (error: any) {
        handleConnectionError({
          type: "peer",
          message: "Failed to handle offer: " + error.message,
          canRetry: true,
        })
      }
    }

    const handleAnswer = async ({ answer }: { answer: any }) => {
      if (!peerRef.current) return
      try {
        if (peerRef.current.signalingState !== "stable") {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer))
        }
      } catch (error: any) {
        if (error.name !== "InvalidStateError") {
          handleConnectionError({
            type: "peer",
            message: "Failed to handle answer: " + error.message,
            canRetry: true,
          })
        }
      }
    }

    const handleIceCandidate = async ({ candidate }: { candidate: any }) => {
      if (!peerRef.current) return
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (error: any) {
        console.warn("[VideoChat] Failed to add ICE candidate:", error)
      }
    }

    socket.on("video-match-found", ({ peerId, peerInfo }: { peerId: string; peerInfo: any }) => {
      setMatchState("matched")
      setMatchPeer({ peerId, ...peerInfo })
      setRetryCount(0)
      setConnectionError(null)
    })

    socket.on("video-chat-start", ({ peerId }: { peerId: string }) => {
      setMatchState("chatting")
      setOtherUser(peerId)
      setIsRunning(true)
      setRetryCount(0)
      setConnectionError(null)
    })

    socket.on("video-chat-skip", (data?: { by?: string; name?: string }) => {
      cleanupConnection()
      setMatchState("searching")
      setMatchPeer(null)
      setOtherUser(null)
      setConnected(false)
      setIsRunning(false)
      setRetryCount(0)
      setConnectionError(null)
      if (data && data.name) {
        setSystemMessage(`${data.name} skipped the chat.`)
      } else {
        setSystemMessage("The other user skipped the chat.")
      }
      socket.emit("start-video-search")
    })

    // Unified call ended handler
    socket.on("chat-ended", (data?: { by?: string; name?: string; reason?: string }) => {
      console.log("[VideoChat] Call ended by:", data)
      cleanupConnection()
      setMatchState("idle")
      setMatchPeer(null)
      setOtherUser(null)
      setConnected(false)
      setIsRunning(false)
      setRetryCount(0)
      setConnectionError(null)

      if (data && data.name) {
        setSystemMessage(`${data.name} ended the call.`)
      } else {
        setSystemMessage("The other user ended the call.")
      }

      // Auto-clear message after 5 seconds
      setTimeout(() => {
        setSystemMessage(null)
      }, 5000)
    })

    socket.on("video-waiting-peer-response", () => {
      setMatchState("waiting")
    })

    socket.on("offer", handleOffer)
    socket.on("answer", handleAnswer)
    socket.on("ice-candidate", handleIceCandidate)

    return () => {
      socket.off("video-match-found")
      socket.off("video-chat-start")
      socket.off("video-chat-skip")
      socket.off("video-waiting-peer-response")
      socket.off("video-chat-ended")
      socket.off("offer", handleOffer)
      socket.off("answer", handleAnswer)
      socket.off("ice-candidate", handleIceCandidate)
    }
  }, [socket, handleConnectionError, cleanupConnection])

  // Setup WebRTC when chatting starts
  useEffect(() => {
    if (matchState === "chatting" && otherUser) {
      setupWebRTCConnection()
    }
    return () => {
      if (matchState !== "chatting") {
        cleanupConnection()
      }
    }
  }, [matchState, otherUser, setupWebRTCConnection, cleanupConnection])

  const handleStartSearch = () => {
    if (!socket || matchState === "searching" || matchState === "chatting") return
    setMatchState("searching")
    setMatchPeer(null)
    setOtherUser(null)
    setConnected(false)
    setIsRunning(false)
    setSystemMessage(null)
    setRetryCount(0)
    setConnectionError(null)
    cleanupConnection()
    socket.emit("start-video-search")
  }

  const handleStopSearch = () => {
    if (!socket || matchState !== "searching") return
    setMatchState("idle")
    setMatchPeer(null)
    setOtherUser(null)
    setConnected(false)
    setIsRunning(false)
    cleanupConnection()
    socket.emit("stop-video-search")
  }

  const handleUserResponse = (response: "connect" | "skip") => {
    if (!socket) return
    socket.emit("video-user-response", { response })
    if (response === "skip") {
      setMatchState("searching")
      setMatchPeer(null)
      setOtherUser(null)
      setConnected(false)
      setIsRunning(false)
      cleanupConnection()
    } else {
      setMatchState("waiting")
    }
  }

  const stopVideoChat = () => {
    if (matchState === "idle") return;
    if (socket && otherUser && user) {
      socket.emit("chat-ended", { to: otherUser, name: user.name, reason: "user_ended" });
    }
    cleanupConnection();
    setIsRunning(false);
    setConnected(false);
    setOtherUser(null);
    setMatchState("idle");
    setMatchPeer(null);
    setRetryCount(0);
    setConnectionError(null);
    setSystemMessage("You ended the chat.");
    setTimeout(() => {
      setSystemMessage(null);
    }, 3000);
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#051622] flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="15%" cy="25%" r="4.2" fill="#2dd4bf" opacity="0.1">
            <animate attributeName="cy" values="25%;80%;25%" dur="20s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0.25;0.1" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle cx="85%" cy="40%" r="3.5" fill="#34d399" opacity="0.12">
            <animate attributeName="cy" values="40%;15%;40%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="cx" values="85%;80%;85%" dur="18s" repeatCount="indefinite" />
          </circle>
          <circle cx="50%" cy="90%" r="5.0" fill="#2dd4bf" opacity="0.08">
            <animate attributeName="cy" values="90%;30%;90%" dur="26s" repeatCount="indefinite" />
            <animate attributeName="r" values="5.0;8.0;5.0" dur="20s" repeatCount="indefinite" />
          </circle>
          <circle cx="30%" cy="65%" r="4.8" fill="#1BA098" opacity="0.09">
            <animate attributeName="cx" values="30%;35%;30%" dur="28s" repeatCount="indefinite" />
            <animate attributeName="cy" values="65%;25%;65%" dur="30s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header - Only Online Users */}
        <div className="bg-[#051622]/90 backdrop-blur-sm px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-end">
            <div className="flex items-center space-x-2 px-3 py-2 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/20 rounded-lg">
              <Users className="w-4 h-4 text-[#1BA098]" />
              <span className="text-sm font-medium" style={{ color: "#DEB992" }}>
                {usersInRoom.length} online
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          {/* System Message */}
          {systemMessage && (
            <div className="p-4 text-center">
              <div
                className={`inline-block backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
                  connectionError
                    ? "bg-red-900/20 border border-red-500/30 text-red-200"
                    : "bg-blue-900/20 border border-blue-500/30 text-blue-200"
                }`}
              >
                {systemMessage}
              </div>
            </div>
          )}

          {/* Connection Error Display */}
          {connectionError && (
  <div className="flex justify-center mt-0 mb-10">
    <div className="flex items-center bg-red-900/80 text-red-100 px-3 py-2 rounded shadow space-x-2 text-xs max-w-xs">
      <AlertTriangle className="w-4 h-4 text-red-300" />
      <span>
        {connectionError.message || "Camera/mic in use. Close other apps and retry."}
      </span>
      {connectionError.canRetry && !isRetrying && (
        <button
          onClick={handleManualRetry}
          className="ml-2 px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs"
        >
          Retry
        </button>
      )}
      {isRetrying && (
        <RefreshCw className="w-4 h-4 animate-spin text-yellow-200 ml-2" />
      )}
    </div>
  </div>
)}

          {/* Main Video Content */}
          <div className="flex-1 flex items-center justify-center p-6">
            {/* Idle State */}
            {matchState === "idle" && (
              <div className="text-center animate-fade-in">
                <div className="w-40 h-40 bg-[#1BA098]/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-[#1BA098]/20 animate-bounce-subtle shadow-2xl shadow-[#1BA098]/10">
                  <Camera className="w-20 h-20 text-[#1BA098]" />
                </div>
                <h2 className="text-4xl font-bold mb-4" style={{ color: "#DEB992" }}>
                  Start Video Chat
                </h2>
                <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: "#DEB992", opacity: 0.8 }}>
                  Connect with random Fast University students for face-to-face academic discussions
                </p>
                <button
                  onClick={handleStartSearch}
                  className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#1BA098]/30"
                >
                  <Search className="w-5 h-5" />
                  <span>Find Someone to Chat</span>
                </button>
              </div>
            )}

            {/* Searching State */}
            {matchState === "searching" && (
              <div className="text-center animate-fade-in">
                <div className="w-40 h-40 bg-amber-500/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20 animate-bounce-subtle shadow-2xl shadow-amber-500/10">
                  <Search className="w-20 h-20 text-amber-400 animate-pulse" />
                </div>
                <h2 className="text-4xl font-bold mb-4" style={{ color: "#DEB992" }}>
                  Searching...
                </h2>
                <p className="text-lg mb-8" style={{ color: "#DEB992", opacity: 0.8 }}>
                  Looking for someone to video chat with
                </p>
                <div className="flex justify-center mb-8">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-[#1BA098] rounded-full animate-bounce"></div>
                    <div
                      className="w-3 h-3 bg-[#1BA098] rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-3 h-3 bg-[#1BA098] rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
                <button
                  onClick={handleStopSearch}
                  className="group relative inline-flex items-center space-x-3 px-6 py-3 bg-[#051622]/80 backdrop-blur-sm border border-red-500/30 text-red-400 rounded-xl font-bold hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  <X className="w-5 h-5" />
                  <span>Stop Search</span>
                </button>
              </div>
            )}

            {/* Matched State */}
            {matchState === "matched" && matchPeer && (
              <div className="text-center animate-slide-up">
                <div className="bg-[#051622]/60 backdrop-blur-sm rounded-2xl p-8 border border-[#1BA098]/20 shadow-xl max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-white font-bold text-2xl">{matchPeer.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: "#DEB992" }}>
                    Match Found!
                  </h3>
                  <p className="text-xl font-medium mb-2" style={{ color: "#1BA098" }}>
                    {matchPeer.name}
                  </p>
                  <p className="text-sm mb-8" style={{ color: "#DEB992", opacity: 0.7 }}>
                    {matchPeer.email}
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleUserResponse("connect")}
                      className="group relative flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                    >
                      <Video className="w-5 h-5" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() => handleUserResponse("skip")}
                      className="group relative flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-[#051622]/80 backdrop-blur-sm border border-[#DEB992]/30 text-[#DEB992] rounded-xl font-bold hover:bg-[#DEB992]/10 hover:border-[#DEB992]/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                    >
                      <SkipForward className="w-5 h-5" />
                      <span>Skip</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Waiting State */}
            {matchState === "waiting" && (
              <div className="text-center animate-fade-in">
                <div className="w-40 h-40 bg-blue-500/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/20 animate-bounce-subtle shadow-2xl shadow-blue-500/10">
                  <Phone className="w-20 h-20 text-blue-400 animate-pulse" />
                </div>
                <h2 className="text-4xl font-bold mb-4" style={{ color: "#DEB992" }}>
                  Waiting...
                </h2>
                <p className="text-lg" style={{ color: "#DEB992", opacity: 0.8 }}>
                  Waiting for the other user to respond
                </p>
              </div>
            )}

            {/* Chatting State */}
            {matchState === "chatting" && (
              <div className="w-full max-w-6xl mx-auto animate-fade-in">
                {/* Connection Status Indicator */}
                {connectionState === "connecting" && (
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 text-yellow-200 rounded-lg text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Establishing connection...</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Local Video */}
                  <div className="relative group">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-80 bg-[#051622] rounded-2xl border-2 border-[#1BA098]/30 shadow-xl object-cover transform transition-all duration-300 group-hover:scale-105 group-hover:border-[#1BA098]/50"
                    />
                    <div className="absolute top-4 left-4 bg-[#1BA098]/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
                      You
                    </div>
                    <div
                      className={`absolute bottom-4 right-4 w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                        connectionState === "connected"
                          ? "bg-green-400 animate-pulse"
                          : connectionState === "connecting"
                            ? "bg-yellow-400 animate-pulse"
                            : "bg-red-500"
                      }`}
                    ></div>
                    {isVideoOff && (
                      <div className="absolute inset-0 bg-[#051622]/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <VideoOff className="w-16 h-16 text-[#DEB992]" />
                      </div>
                    )}
                  </div>

                  {/* Remote Video */}
                  <div className="relative group">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-80 bg-[#051622] rounded-2xl border-2 border-blue-500/30 shadow-xl object-cover transform transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/50"
                    />
                    <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
                      Connected User
                    </div>
                    <div
                      className={`absolute bottom-4 right-4 w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                        connectionState === "connected"
                          ? "bg-blue-400 animate-pulse"
                          : connectionState === "connecting"
                            ? "bg-yellow-400 animate-pulse"
                            : "bg-red-500"
                      }`}
                    ></div>
                    {connectionState !== "connected" && (
                      <div className="absolute inset-0 bg-[#051622]/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <div className="text-center">
                          <RefreshCw className="w-16 h-16 text-[#DEB992] animate-spin mx-auto mb-2" />
                          <p className="text-[#DEB992] text-sm">Connecting...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {matchState === "chatting" && (
            <div className="border-t border-[#1BA098]/20 bg-[#051622]/90 backdrop-blur-sm p-6">
              <div className="max-w-2xl mx-auto flex items-center justify-center space-x-6">
                <button
                  onClick={toggleMute}
                  className={`group relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 ${
                    isMuted
                      ? "bg-gradient-to-r from-red-500 to-red-600 focus:ring-red-300"
                      : "bg-gradient-to-r from-[#1BA098] to-[#159084] focus:ring-[#1BA098]/30"
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`group relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 ${
                    isVideoOff
                      ? "bg-gradient-to-r from-red-500 to-red-600 focus:ring-red-300"
                      : "bg-gradient-to-r from-[#1BA098] to-[#159084] focus:ring-[#1BA098]/30"
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </button>

                <button
                  onClick={stopVideoChat}
                  aria-label="End Call"
                  tabIndex={0}
                  className="group relative w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex flex-col items-center justify-center shadow-2xl hover:shadow-[0_0_25px_#ef4444] focus:outline-none focus:ring-4 focus:ring-red-300 ring-offset-2 ring-2 ring-red-400 border-4 border-white/10 transition-all duration-300 hover:scale-110"
                >
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 hidden md:block bg-black/90 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">End Call</span>
                  <PhoneOff className="w-9 h-9 text-white drop-shadow-lg" aria-hidden="true" />
                  <span className="mt-2 text-xs font-bold tracking-wide text-red-100 hidden md:block">End Call</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(5, 22, 34, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(27, 160, 152, 0.5);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(27, 160, 152, 0.7);
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out; }
        .animate-bounce-subtle { animation: bounce-subtle 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default VideoChat