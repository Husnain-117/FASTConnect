"use client"

import Navbar from "./Navbar"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import { Mic, MicOff, Phone, PhoneOff, Users, Search, SkipForward, Volume2, X } from "lucide-react"

const ROOM_ID = "demo-room"
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }

type MatchState = "idle" | "searching" | "matched" | "waiting" | "chatting"

const VoiceChat = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [matchState, setMatchState] = useState<MatchState>("idle")
  const [matchPeer, setMatchPeer] = useState<any>(null)
  const [usersInRoom, setUsersInRoom] = useState<{ id: string; name: string; email: string }[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const { user } = useAuth()
  const { socket } = useSocket()
  const [systemMessage, setSystemMessage] = useState<string | null>(null)

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

  useEffect(() => {
    if (!socket) return

    socket.on("match-found", ({ peerId, peerInfo }: { peerId: string; peerInfo: any }) => {
      setMatchState("matched")
      setMatchPeer({ peerId, ...peerInfo })
    })

    socket.on("chat-start", ({ peerId, peerInfo }: { peerId: string; peerInfo: any }) => {
      setMatchState("chatting")
      setOtherUser(peerId)
      setConnected(true)
      setIsRunning(true)
    })

    socket.on("chat-skip", (data?: { by?: string; name?: string }) => {
      setMatchState("searching")
      setMatchPeer(null)
      setOtherUser(null)
      setConnected(false)
      setIsRunning(false)
      if (data && data.name) {
        setSystemMessage(`${data.name} skipped the chat.`)
      } else {
        setSystemMessage("The other user skipped the chat.")
      }
      socket.emit("start-search")
    })

    socket.on("chat-ended", (data?: { by?: string; name?: string }) => {
      stopVoiceChat(true, data?.name);
    })

    socket.on("waiting-peer-response", () => {
      setMatchState("waiting")
    })

    return () => {
      socket.off("match-found")
      socket.off("chat-start")
      socket.off("chat-skip")
      socket.off("waiting-peer-response")
      socket.off("chat-ended")
    }
  }, [socket])

  // WebRTC setup for random matching
  useEffect(() => {
    if (!socket || !user) return
    if (matchState !== "chatting" || !otherUser) return

    let isInitiator = false
    if (socket.id && otherUser) {
      isInitiator = socket.id < otherUser
    }

    console.debug(
      "[VoiceChat] WebRTC setup: matchState=chatting, my socket.id:",
      socket.id,
      "otherUser:",
      otherUser,
      "isInitiator:",
      isInitiator,
    )

    let peer: RTCPeerConnection
    let localStream: MediaStream
    let cleanup = false

    const setupConnection = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        localStreamRef.current = localStream
        console.debug("[VoiceChat] Got local audio stream:", localStream)

        peer = new RTCPeerConnection(ICE_SERVERS)
        peerRef.current = peer

        localStream.getTracks().forEach((track) => peer.addTrack(track, localStream))
        console.debug("[VoiceChat] Added local tracks to RTCPeerConnection")

        peer.onicecandidate = (event) => {
          if (event.candidate && otherUser) {
            console.debug("[VoiceChat] Sending ICE candidate to", otherUser, event.candidate)
            socket.emit("ice-candidate", { candidate: event.candidate, to: otherUser })
          }
        }

        peer.ontrack = (event) => {
          const [remoteStream] = event.streams
          console.debug("[VoiceChat] Received remote track:", remoteStream)
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream
            remoteAudioRef.current.play().catch((e) => console.error("[VoiceChat] Error playing audio:", e))
          }
        }

        peer.onconnectionstatechange = () => {
          console.debug("[VoiceChat] Peer connection state:", peer.connectionState)
          if (
            peer.connectionState === "disconnected" ||
            peer.connectionState === "failed" ||
            peer.connectionState === "closed"
          ) {
            stopVoiceChat()
          }
        }

        if (isInitiator) {
          const offer = await peer.createOffer()
          await peer.setLocalDescription(offer)
          console.debug("[VoiceChat] Created and set local offer, sending to", otherUser, offer)
          socket.emit("offer", { offer, to: otherUser })
        }
      } catch (err) {
        console.error("[VoiceChat] Error setting up WebRTC:", err)
      }
    }

    const handleOffer = async ({ offer, from }: { offer: any; from: string }) => {
      console.debug("[VoiceChat] Received offer from", from, offer)
      if (!peerRef.current) return
      await peerRef.current.setRemoteDescription(new window.RTCSessionDescription(offer))
      const answer = await peerRef.current.createAnswer()
      await peerRef.current.setLocalDescription(answer)
      console.debug("[VoiceChat] Created and set local answer, sending to", from, answer)
      socket.emit("answer", { answer, to: from })
    }

    const handleAnswer = async ({ answer }: { answer: any }) => {
      console.debug("[VoiceChat] Received answer", answer)
      if (!peerRef.current) return
      await peerRef.current.setRemoteDescription(new window.RTCSessionDescription(answer))
    }

    const handleIceCandidate = async ({ candidate }: { candidate: any }) => {
      console.debug("[VoiceChat] Received ICE candidate", candidate)
      if (!peerRef.current) return
      try {
        await peerRef.current.addIceCandidate(new window.RTCIceCandidate(candidate))
      } catch (err) {
        console.error("[VoiceChat] Failed to add ICE candidate:", err)
      }
    }

    socket.on("offer", handleOffer)
    socket.on("answer", handleAnswer)
    socket.on("ice-candidate", handleIceCandidate)

    setupConnection()

    return () => {
      cleanup = true
      socket.off("offer", handleOffer)
      socket.off("answer", handleAnswer)
      socket.off("ice-candidate", handleIceCandidate)

      if (peerRef.current) {
        peerRef.current.close()
        peerRef.current = null
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
      }

      console.debug("[VoiceChat] Cleaned up WebRTC connection")
    }
  }, [matchState, otherUser])

  const handleStartSearch = () => {
    if (!socket || matchState === "searching" || matchState === "chatting") return
    setMatchState("searching")
    setMatchPeer(null)
    setOtherUser(null)
    setConnected(false)
    setIsRunning(false)
    setSystemMessage(null)
    socket.emit("start-search")
  }

  const handleStopSearch = () => {
    if (!socket || matchState !== "searching") return
    setMatchState("idle")
    setMatchPeer(null)
    setOtherUser(null)
    setConnected(false)
    setIsRunning(false)
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
    } else {
      setMatchState("waiting")
    }
  }

  const stopVoiceChat = (endedByOtherUser = false, otherUserName?: string) => {
  if (matchState === "idle") return; // Prevent duplicate cleanup
  setIsRunning(false)
  setConnected(false)
  setOtherUser(null)
  setMatchState("idle")
  setMatchPeer(null)

  if (peerRef.current) {
    peerRef.current.close()
    peerRef.current = null
  }

  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
  }

  if (remoteAudioRef.current) {
    remoteAudioRef.current.srcObject = null
  }

  if (!endedByOtherUser && socket && otherUser) {
    socket.emit("chat-ended", { to: otherUser, name: user?.name })
    setSystemMessage("You ended the chat.");
  }
  if (endedByOtherUser) {
    setSystemMessage(otherUserName ? `${otherUserName} ended the chat.` : "The other user ended the chat.");
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

  const getStatusText = () => {
    switch (matchState) {
      case "searching":
        return "Searching for someone to chat with..."
      case "matched":
        return "Match found! Accept or skip to continue"
      case "chatting":
        return "Connected - You can now talk!"
      case "waiting":
        return "Waiting for the other user to respond..."
      default:
        return "Ready to start a voice chat"
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
                {/* System Message */}
                {systemMessage && (
                  <div className="text-center animate-slide-in">
                    <div className="inline-block bg-red-900/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
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
                    <div className="text-center">
                      <div className="inline-block bg-[#1BA098]/20 backdrop-blur-sm border border-[#1BA098]/30 text-[#1BA098] px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                        Voice chat connected! You can now talk.
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
                              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#051622] ${isMuted ? "bg-red-500" : "bg-[#1BA098] animate-pulse"}`}
                            ></div>
                          </div>
                          <div>
                            <p className="font-bold text-lg" style={{ color: "#DEB992" }}>
                              You
                            </p>
                            <p className={`text-sm ${isMuted ? "text-red-400" : "text-[#1BA098]"}`}>
                              {isMuted ? "Muted" : "Speaking"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#051622]/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center relative shadow-lg">
                            <Volume2 className="w-8 h-8 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse border-2 border-[#051622]"></div>
                          </div>
                          <div>
                            <p className="font-bold text-lg" style={{ color: "#DEB992" }}>
                              Connected User
                            </p>
                            <p className="text-sm text-blue-400">Listening</p>
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
                    onClick={() => stopVoiceChat()}
                    className="group relative w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300"
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </button>
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
