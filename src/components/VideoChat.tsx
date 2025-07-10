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

  isRunning;
  connected;
  // Enhanced connection state management
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [systemMessage, setSystemMessage] = useState<string | null>(null)
  const [callEndedBy, setCallEndedBy] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { user } = useAuth()
  const { socket } = useSocket()

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
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: "user",
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
          remoteVideoRef.current.play().catch((e: any) => {
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
      setCallEndedBy(null)
    })

    socket.on("video-chat-start", ({ peerId }: { peerId: string }) => {
      setMatchState("chatting")
      setOtherUser(peerId)
      setIsRunning(true)
      setRetryCount(0)
      setConnectionError(null)
      setCallEndedBy(null)
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
      setCallEndedBy(null)
      if (data && data.name) {
        setSystemMessage(`${data.name} skipped the chat.`)
      } else {
        setSystemMessage("The other user skipped the chat.")
      }
      socket.emit("start-video-search")
    })

    // Enhanced call ended handler
    socket.on("video-chat-ended", (data?: { by?: string; name?: string; reason?: string }) => {
      console.log("[VideoChat] Call ended by other user:", data)
      cleanupConnection()
      setMatchState("idle")
      setMatchPeer(null)
      setOtherUser(null)
      setConnected(false)
      setIsRunning(false)
      setRetryCount(0)
      setConnectionError(null)

      if (data && data.name) {
        setCallEndedBy(data.name)
        setSystemMessage(`${data.name} ended the call.`)
      } else {
        setSystemMessage("The other user ended the call.")
      }

      // Auto-clear message after 5 seconds
      setTimeout(() => {
        setSystemMessage(null)
        setCallEndedBy(null)
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
    setCallEndedBy(null)
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

  // Enhanced stop video chat function
  const stopVideoChat = () => {
    console.log("[VideoChat] User ending call")

    // Notify other user immediately
    if (socket && otherUser && user) {
      socket.emit("video-chat-ended", {
        to: otherUser,
        name: user.name,
        reason: "user_ended",
      })
    }

    // Clean up local resources
    cleanupConnection()
    setIsRunning(false)
    setConnected(false)
    setOtherUser(null)
    setMatchState("idle")
    setMatchPeer(null)
    setRetryCount(0)
    setConnectionError(null)
    setSystemMessage("You ended the call.")
    setCallEndedBy(null)

    // Auto-clear message after 3 seconds
    setTimeout(() => {
      setSystemMessage(null)
    }, 3000)
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
    <div className="min-h-screen bg-gradient-to-br from-[#051622] via-[#0a1f2e] to-[#051622] flex flex-col overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.05" />
            </radialGradient>
            <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.03" />
            </radialGradient>
          </defs>
          <circle cx="15%" cy="25%" r="120" fill="url(#grad1)">
            <animate attributeName="cy" values="25%;80%;25%" dur="20s" repeatCount="indefinite" />
            <animate attributeName="r" values="120;180;120" dur="15s" repeatCount="indefinite" />
          </circle>
          <circle cx="85%" cy="40%" r="100" fill="url(#grad2)">
            <animate attributeName="cy" values="40%;15%;40%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="cx" values="85%;75%;85%" dur="18s" repeatCount="indefinite" />
          </circle>
          <circle cx="50%" cy="90%" r="150" fill="url(#grad1)">
            <animate attributeName="cy" values="90%;30%;90%" dur="26s" repeatCount="indefinite" />
            <animate attributeName="r" values="150;220;150" dur="20s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Enhanced Header */}

        {/* Header */}
        <div className="bg-[#051622]/90 backdrop-blur-sm px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-xl flex items-center justify-center shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#DEB992]">Video Chat</h1>
                  <p className="text-xs text-[#DEB992]/70">University Video Platform</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <button
                onClick={() => window.location.reload()}
                className="group relative p-3 rounded-xl bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 hover:bg-[#1BA098]/20 hover:border-[#1BA098]/50 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-[#1BA098]/25"
                title="Refresh Page"
              >
                <RefreshCw className="w-5 h-5 text-[#1BA098] group-hover:rotate-180 transition-transform duration-500" />
              </button>

              {/* Online Users */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/20 rounded-lg">
                <Users className="w-4 h-4 text-[#1BA098]" />
                <span className="text-sm font-medium" style={{ color: "#DEB992" }}>
                  {usersInRoom.length} online
                </span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced System Message */}
          {systemMessage && (
            <div className="p-4 text-center">
              <div
                className={`inline-flex items-center space-x-2 backdrop-blur-xl px-6 py-3 rounded-xl text-sm font-medium shadow-2xl border ${
                  connectionError
                    ? "bg-red-900/30 border-red-500/40 text-red-100"
                    : callEndedBy
                      ? "bg-blue-900/30 border-blue-500/40 text-blue-100"
                      : "bg-[#1BA098]/20 border-[#1BA098]/40 text-[#DEB992]"
                }`}
              >
                {connectionError && <AlertTriangle className="w-4 h-4" />}
                {isRetrying && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{systemMessage}</span>
              </div>
            </div>
          )}

          {/* Enhanced Connection Error Display */}
          {connectionError && (
            <div className="p-4 text-center">
              <div className="inline-block bg-red-900/30 backdrop-blur-xl border border-red-500/40 rounded-2xl p-6 max-w-md shadow-2xl">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <h3 className="text-red-100 font-semibold mb-2">Connection Error</h3>
                <p className="text-red-200/80 text-sm mb-4">{connectionError.message}</p>
                {connectionError.canRetry && !isRetrying && (
                  <button
                    onClick={handleManualRetry}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#1BA098] to-[#159084] hover:from-[#159084] hover:to-[#1BA098] text-white rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Connection</span>
                  </button>
                )}
                {isRetrying && (
                  <div className="flex items-center justify-center space-x-2 text-yellow-200">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Retrying...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Video Content */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            {/* Idle State */}
            {matchState === "idle" && (
              <div className="text-center animate-fade-in max-w-2xl mx-auto">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-[#1BA098]/20 to-[#159084]/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-[#1BA098]/30 animate-bounce-subtle shadow-2xl">
                  <Camera className="w-16 h-16 sm:w-20 sm:h-20 text-[#1BA098]" />
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-[#DEB992] leading-tight">
                  Start Video Chat
                </h2>
                <p className="text-base sm:text-lg mb-8 text-[#DEB992]/80 leading-relaxed px-4">
                  Connect with random Fast University students for face-to-face academic discussions and networking
                </p>
                <button
                  onClick={handleStartSearch}
                  className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-2xl font-bold shadow-2xl hover:shadow-[#1BA098]/25 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#1BA098]/30"
                >
                  <Search className="w-5 h-5" />
                  <span>Find Someone to Chat</span>
                </button>
              </div>
            )}

            {/* Searching State */}
            {matchState === "searching" && (
              <div className="text-center animate-fade-in max-w-xl mx-auto">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/30 animate-bounce-subtle shadow-2xl">
                  <Search className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 animate-pulse" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#DEB992]">Searching...</h2>
                <p className="text-base sm:text-lg mb-8 text-[#DEB992]/80">Looking for someone to video chat with</p>
                <div className="flex justify-center mb-8">
                  <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-3 h-3 bg-[#1BA098] rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
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
                  <div className="flex flex-col items-center space-y-6 mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-3xl">{matchPeer.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2" style={{ color: "#DEB992" }}>
                        Match Found!
                      </h3>
                      <p className="text-xl font-medium mb-2" style={{ color: "#1BA098" }}>
                        {matchPeer.name}
                      </p>
                      <p className="text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
                        Fast University Student
                      </p>
                    </div>
                  </div>
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
              <div className="text-center animate-fade-in max-w-xl mx-auto">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/30 animate-bounce-subtle shadow-2xl">
                  <Phone className="w-16 h-16 sm:w-20 sm:h-20 text-blue-400 animate-pulse" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#DEB992]">Waiting...</h2>
                <p className="text-base sm:text-lg text-[#DEB992]/80">Waiting for the other user to respond</p>
              </div>
            )}

            {/* Enhanced Chatting State */}
            {matchState === "chatting" && (
              <div className="w-full max-w-7xl mx-auto animate-fade-in">
                {/* Connection Status Indicator */}
                {connectionState === "connecting" && (
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 backdrop-blur-xl border border-yellow-500/40 text-yellow-100 rounded-xl text-sm font-medium shadow-xl">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Establishing secure connection...</span>
                    </div>
                  </div>
                )}

                {/* Enhanced Video Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
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
                      You - {user?.name || "Your Name"}
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
                      {matchPeer?.name || "Connected User"}
                    </div>
                    <div className="absolute top-4 right-4 bg-blue-500/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
                      {matchPeer?.email || "Fast University Student"}
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

          {/* Enhanced Controls */}

          {/* Controls */}
          {matchState === "chatting" && (
            <div className="border-t border-[#1BA098]/20 bg-[#051622]/90 backdrop-blur-sm p-6">
              <div className="max-w-6xl mx-auto flex items-center justify-end pr-8">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleMute}
                    className={`group relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 ${
                      isMuted
                        ? "bg-gradient-to-r from-red-500 to-red-600 focus:ring-red-300"
                        : "bg-gradient-to-r from-[#1BA098] to-[#159084] focus:ring-[#1BA098]/30"
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`group relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 ${
                      isVideoOff
                        ? "bg-gradient-to-r from-red-500 to-red-600 focus:ring-red-300"
                        : "bg-gradient-to-r from-[#1BA098] to-[#159084] focus:ring-[#1BA098]/30"
                    }`}
                  >
                    {isVideoOff ? (
                      <VideoOff className="w-5 h-5 text-white" />
                    ) : (
                      <Video className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={stopVideoChat}
                    aria-label="End Call"
                    tabIndex={0}
                    className="group relative w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-[0_0_25px_#ef4444] focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 hover:scale-110"
                  >
                    <PhoneOff className="w-6 h-6 text-white drop-shadow-lg" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
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

        /* Enhanced scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(5, 22, 34, 0.3);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(27, 160, 152, 0.6), rgba(21, 144, 132, 0.6));
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(27, 160, 152, 0.8), rgba(21, 144, 132, 0.8));
        }
      `}</style>
    </div>
  )
}

export default VideoChat
