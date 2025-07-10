"use client"
import Navbar from "./Navbar"
import { useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Users,
  Search,
  SkipForward,
  Volume2,
  X,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
}

type MatchState = "idle" | "searching" | "matched" | "waiting" | "chatting"
type ConnectionState = "connecting" | "connected" | "failed" | "disconnected"
type ErrorType = "media" | "connection" | "peer" | "ice" | "general"

interface ConnectionError {
  type: ErrorType
  message: string
  canRetry: boolean
}

const VoiceChat = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [matchState, setMatchState] = useState<MatchState>("idle")
  const [matchPeer, setMatchPeer] = useState<any>(null)
  const [usersInRoom, setUsersInRoom] = useState<{ id: string; name: string; email: string }[]>([])
  const [isMuted, setIsMuted] = useState(false)

  // Enhanced connection state management
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [systemMessage, setSystemMessage] = useState<string | null>(null)
  const [callEndedBy, setCallEndedBy] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  isRunning;
  connected;
  const { user } = useAuth()
  const { socket } = useSocket()

  const MAX_RETRY_ATTEMPTS = 3
  const RETRY_DELAYS = [2000, 5000, 10000] // Progressive delays

  // Enhanced cleanup function
  const cleanupConnection = useCallback(() => {
    console.log("[VoiceChat] Cleaning up connection...")

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
        console.log(`[VoiceChat] Stopped ${track.kind} track`)
      })
      localStreamRef.current = null
    }

    // Clean up audio element
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
      remoteAudioRef.current.pause()
    }

    setConnectionState("disconnected")
  }, [])

  // Enhanced error handling
  const handleConnectionError = useCallback(
    (error: ConnectionError) => {
      console.error(`[VoiceChat] ${error.type} error:`, error.message)
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

    console.log(`[VoiceChat] Retrying connection (attempt ${retryCount + 1})`)
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
            sampleRate: 44100,
          },
          video: false,
        })
        localStreamRef.current = localStream
        console.debug("[VoiceChat] Got local audio stream:", localStream)
      } catch (mediaError: any) {
        let errorMessage = "Failed to access microphone. "
        if (mediaError.name === "NotReadableError") {
          errorMessage += "Microphone is already in use by another application."
        } else if (mediaError.name === "NotAllowedError") {
          errorMessage += "Permission denied. Please allow microphone access."
        } else if (mediaError.name === "NotFoundError") {
          errorMessage += "No microphone found."
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
      console.debug("[VoiceChat] Added local tracks to RTCPeerConnection")

      // Enhanced peer connection event handlers
      peer.onicecandidate = (event) => {
        if (event.candidate && otherUser) {
          console.debug("[VoiceChat] Sending ICE candidate to", otherUser, event.candidate)
          socket.emit("ice-candidate", { candidate: event.candidate, to: otherUser })
        }
      }

      peer.ontrack = (event) => {
        const [remoteStream] = event.streams
        console.debug("[VoiceChat] Received remote track:", remoteStream)
        if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream
          remoteAudioRef.current.play().catch((e) => {
            if (e.name !== "AbortError") {
              console.error("[VoiceChat] Error playing audio:", e)
            }
          })
        }
      }

      peer.onconnectionstatechange = () => {
        console.debug("[VoiceChat] Peer connection state:", peer.connectionState)

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
        console.debug("[VoiceChat] ICE gathering state:", peer.iceGatheringState)
      }

      peer.onsignalingstatechange = () => {
        console.debug("[VoiceChat] Signaling state:", peer.signalingState)
      }

      // Handle offer/answer exchange
      if (isInitiator) {
        try {
          const offer = await peer.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
          })
          await peer.setLocalDescription(offer)
          console.debug("[VoiceChat] Created and set local offer, sending to", otherUser, offer)
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

  // Socket event handlers for voice chat
  useEffect(() => {
    if (!socket || !user) return

    const userInfo = { id: user._id, name: user.name, email: user.email }
    socket.emit("join-voice-chat", userInfo)

    const handleVoiceChatUsers = (users: any) => {
      setUsersInRoom(users)
    }

    socket.on("voice-chat-users", handleVoiceChatUsers)

    return () => {
      socket.emit("leave-voice-chat")
      socket.off("voice-chat-users", handleVoiceChatUsers)
    }
  }, [socket, user])

  // Enhanced socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleOffer = async ({ offer, from }: { offer: any; from: string }) => {
      console.debug("[VoiceChat] Received offer from", from, offer)
      if (!peerRef.current) return
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerRef.current.createAnswer()
        await peerRef.current.setLocalDescription(answer)
        console.debug("[VoiceChat] Created and set local answer, sending to", from, answer)
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
      console.debug("[VoiceChat] Received answer", answer)
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
      console.debug("[VoiceChat] Received ICE candidate", candidate)
      if (!peerRef.current) return
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (error: any) {
        console.warn("[VoiceChat] Failed to add ICE candidate:", error)
      }
    }

    socket.on("match-found", ({ peerId, peerInfo }: { peerId: string; peerInfo: any }) => {
      setMatchState("matched")
      setMatchPeer({ peerId, ...peerInfo })
      setRetryCount(0)
      setConnectionError(null)
      setCallEndedBy(null)
    })

    socket.on("chat-start", ({ peerId }: { peerId: string }) => {
      setMatchState("chatting")
      setOtherUser(peerId)
      setIsRunning(true)
      setRetryCount(0)
      setConnectionError(null)
      setCallEndedBy(null)
    })

    socket.on("chat-skip", (data?: { by?: string; name?: string }) => {
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
      socket.emit("start-search")
    })

    // Enhanced call ended handler
    socket.on("chat-ended", (data?: { by?: string; name?: string; reason?: string }) => {
      console.log("[VoiceChat] Call ended by other user:", data)
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

    socket.on("waiting-peer-response", () => {
      setMatchState("waiting")
    })

    socket.on("offer", handleOffer)
    socket.on("answer", handleAnswer)
    socket.on("ice-candidate", handleIceCandidate)

    return () => {
      socket.off("match-found")
      socket.off("chat-start")
      socket.off("chat-skip")
      socket.off("waiting-peer-response")
      socket.off("chat-ended")
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
    socket.emit("start-search")
  }

  const handleStopSearch = () => {
    if (!socket || matchState !== "searching") return
    setMatchState("idle")
    setMatchPeer(null)
    setOtherUser(null)
    setConnected(false)
    setIsRunning(false)
    cleanupConnection()
    socket.emit("stop-search")
  }

  const handleUserResponse = (response: "connect" | "skip") => {
    if (!socket) return
    socket.emit("user-response", { response })
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

  // Enhanced stop voice chat function
  const stopVoiceChat = (endedByOtherUser = false, otherUserName?: string) => {
    if (matchState === "idle") return // Prevent duplicate cleanup

    console.log("[VoiceChat] User ending call")

    // Notify other user immediately if not ended by them
    if (!endedByOtherUser && socket && otherUser && user) {
      socket.emit("chat-ended", {
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

    if (!endedByOtherUser) {
      setSystemMessage("You ended the chat.")
      setCallEndedBy(null)
      // Auto-clear message after 3 seconds
      setTimeout(() => {
        setSystemMessage(null)
      }, 3000)
    }

    if (endedByOtherUser) {
      setCallEndedBy(otherUserName || "Unknown user")
      setSystemMessage(otherUserName ? `${otherUserName} ended the chat.` : "The other user ended the chat.")
    }
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

  return (
    <div className="h-screen bg-[#051622] flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="12%" cy="20%" r="3.8" fill="#2dd4bf" opacity="0.12">
            <animate attributeName="cy" values="20%;85%;20%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.12;0.3;0.12" dur="14s" repeatCount="indefinite" />
          </circle>
          <circle cx="88%" cy="35%" r="3.2" fill="#34d399" opacity="0.15">
            <animate attributeName="cy" values="35%;10%;35%" dur="24s" repeatCount="indefinite" />
            <animate attributeName="cx" values="88%;83%;88%" dur="20s" repeatCount="indefinite" />
          </circle>
          <circle cx="45%" cy="92%" r="4.5" fill="#2dd4bf" opacity="0.08">
            <animate attributeName="cy" values="92%;28%;92%" dur="28s" repeatCount="indefinite" />
            <animate attributeName="r" values="4.5;7.2;4.5" dur="22s" repeatCount="indefinite" />
          </circle>
          <circle cx="75%" cy="15%" r="2.5" fill="#34d399" opacity="0.2">
            <animate attributeName="cy" values="15%;78%;15%" dur="26s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.42;0.2" dur="18s" repeatCount="indefinite" />
          </circle>
          <circle cx="25%" cy="68%" r="4.2" fill="#1BA098" opacity="0.1">
            <animate attributeName="cx" values="25%;32%;25%" dur="30s" repeatCount="indefinite" />
            <animate attributeName="cy" values="68%;22%;68%" dur="32s" repeatCount="indefinite" />
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

        {/* Chat Area */}
        <div className="flex-1 flex">
          {/* Main Chat */}
          <div className="flex-1 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Enhanced Connection Error Display */}
                {connectionError && (
                  <div className="text-center animate-slide-in">
                    <div className="inline-block bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4 max-w-md">
                      <div className="flex items-center justify-center mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                        <span className="text-red-200 font-medium">Connection Error</span>
                      </div>
                      <p className="text-red-200 text-sm mb-3">{connectionError.message}</p>
                      {connectionError.canRetry && !isRetrying && (
                        <button
                          onClick={handleManualRetry}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1BA098] hover:bg-[#159084] text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Retry Connection</span>
                        </button>
                      )}
                      {isRetrying && (
                        <div className="flex items-center justify-center space-x-2 text-yellow-200">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Retrying...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* System Message */}
                {systemMessage && (
                  <div className="text-center animate-slide-in">
                    <div
                      className={`inline-block backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
                        connectionError
                          ? "bg-red-900/20 border border-red-500/30 text-red-200"
                          : callEndedBy
                            ? "bg-blue-900/20 border border-blue-500/30 text-blue-200"
                            : "bg-[#1BA098]/20 border border-[#1BA098]/30 text-[#1BA098]"
                      }`}
                    >
                      {isRetrying && <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />}
                      {systemMessage}
                    </div>
                  </div>
                )}

                {/* Chat States */}
                {matchState === "idle" && (
                  <div className="text-center py-16 animate-fade-in">
                    <div className="w-32 h-32 bg-[#1BA098]/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-[#1BA098]/20 animate-bounce-subtle shadow-2xl shadow-[#1BA098]/10">
                      <Mic className="w-16 h-16 text-[#1BA098]" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: "#DEB992" }}>
                      Start Voice Chat
                    </h2>
                    <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: "#DEB992", opacity: 0.8 }}>
                      Connect with random Fast University students for academic discussions
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

                {matchState === "searching" && (
                  <div className="text-center py-16 animate-fade-in">
                    <div className="w-32 h-32 bg-amber-500/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20 animate-bounce-subtle shadow-2xl shadow-amber-500/10">
                      <Search className="w-16 h-16 text-amber-400 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: "#DEB992" }}>
                      Searching...
                    </h2>
                    <p className="text-lg mb-8" style={{ color: "#DEB992", opacity: 0.8 }}>
                      Looking for someone to chat with
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

                {matchState === "matched" && matchPeer && (
                  <div className="space-y-6 animate-slide-up">
                    <div className="text-center">
                      <div className="inline-block bg-[#1BA098]/20 backdrop-blur-sm border border-[#1BA098]/30 text-[#1BA098] px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                        Match found! You've been connected with {matchPeer.name}
                      </div>
                    </div>
                    <div className="bg-[#051622]/60 backdrop-blur-sm rounded-2xl p-8 border border-[#1BA098]/20 shadow-xl">
                      <div className="flex items-center space-x-6 mb-8">
                        <div className="w-20 h-20 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-2xl">
                            {matchPeer.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-2xl" style={{ color: "#DEB992" }}>
                            {matchPeer.name}
                          </p>
                          <p className="text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
                            {matchPeer.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleUserResponse("connect")}
                          className="group relative flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                        >
                          <Phone className="w-5 h-5" />
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

                {matchState === "waiting" && (
                  <div className="text-center py-16 animate-fade-in">
                    <div className="w-32 h-32 bg-blue-500/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/20 animate-bounce-subtle shadow-2xl shadow-blue-500/10">
                      <Phone className="w-16 h-16 text-blue-400 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: "#DEB992" }}>
                      Waiting...
                    </h2>
                    <p className="text-lg" style={{ color: "#DEB992", opacity: 0.8 }}>
                      Waiting for the other user to respond
                    </p>
                  </div>
                )}

                {matchState === "chatting" && (
                  <div className="space-y-6 animate-slide-up">
                    {/* Connection Status Indicator */}
                    {connectionState === "connecting" && (
                      <div className="text-center">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 text-yellow-200 rounded-lg text-sm">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Establishing connection...</span>
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <div
                        className={`inline-block backdrop-blur-sm border px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
                          connectionState === "connected"
                            ? "bg-[#1BA098]/20 border-[#1BA098]/30 text-[#1BA098]"
                            : "bg-yellow-900/20 border-yellow-500/30 text-yellow-200"
                        }`}
                      >
                        {connectionState === "connected"
                          ? "Voice chat connected! You can now talk."
                          : "Connecting to voice chat..."}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#051622]/60 backdrop-blur-sm rounded-2xl p-6 border border-[#1BA098]/20 shadow-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center relative shadow-lg">
                            {isMuted ? (
                              <MicOff className="w-8 h-8 text-white" />
                            ) : (
                              <Mic className="w-8 h-8 text-white" />
                            )}
                            <div
                              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#051622] ${
                                connectionState === "connected"
                                  ? isMuted
                                    ? "bg-red-500"
                                    : "bg-[#1BA098] animate-pulse"
                                  : "bg-yellow-400 animate-pulse"
                              }`}
                            ></div>
                          </div>
                          <div>
                            <p className="font-bold text-lg" style={{ color: "#DEB992" }}>
                              You
                            </p>
                            <p
                              className={`text-sm ${
                                connectionState === "connected"
                                  ? isMuted
                                    ? "text-red-400"
                                    : "text-[#1BA098]"
                                  : "text-yellow-400"
                              }`}
                            >
                              {connectionState === "connected" ? (isMuted ? "Muted" : "Speaking") : "Connecting..."}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#051622]/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center relative shadow-lg">
                            <Volume2 className="w-8 h-8 text-white" />
                            <div
                              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#051622] ${
                                connectionState === "connected"
                                  ? "bg-blue-500 animate-pulse"
                                  : "bg-yellow-400 animate-pulse"
                              }`}
                            ></div>
                          </div>
                          <div>
                            <p className="font-bold text-lg" style={{ color: "#DEB992" }}>
                              Connected User
                            </p>
                            <p
                              className={`text-sm ${
                                connectionState === "connected" ? "text-blue-400" : "text-yellow-400"
                              }`}
                            >
                              {connectionState === "connected" ? "Listening" : "Connecting..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            {matchState === "chatting" && (
              <div className="border-t border-[#1BA098]/20 bg-[#051622]/90 backdrop-blur-sm p-6">
                <div className="max-w-4xl mx-auto flex items-center justify-end pr-8">
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
                      onClick={() => stopVoiceChat()}
                      className="group relative w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300"
                    >
                      <PhoneOff className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio Debug (hidden) */}
      <audio ref={remoteAudioRef} autoPlay className="hidden" />

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
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out; }
        .animate-slide-in { animation: slide-in 0.5s ease-out; }
        .animate-bounce-subtle { animation: bounce-subtle 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default VoiceChat
