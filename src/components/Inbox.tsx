"use client"
import type React from "react"
import { useState, useEffect } from "react"
import axiosInstance from "../api/axiosConfig"
import { useAuth } from "../context/AuthContext"
import Navbar from "./Navbar"
import { useSocket } from "../contexts/SocketContext"


interface Message {
  _id: string
  text: string
  sender: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  receiver: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  timestamp: string
}

interface Conversation {
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  messages: Message[]
}

const Inbox: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const { user } = useAuth()
  const { socket } = useSocket()

  // Fetch inbox data
  useEffect(() => {
    const fetchInbox = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get("/messages/inbox")
        if (response.data.success) {
          setConversations(response.data.conversations || [])
        } else {
          setError("Failed to load inbox")
        }
      } catch (err) {
        console.error("Error fetching inbox:", err)
        setError("Failed to load inbox")
      } finally {
        setLoading(false)
      }
    }

    fetchInbox()
  }, [])

  // Socket event listeners for real-time messages
  useEffect(() => {
    if (!socket) return

    const handleNewDirectMessage = (message: Message) => {
      console.log("[Socket] Received new_direct_message:", message)
      
      // Update conversations with new message
      setConversations(prev => {
        const updated = [...prev]
        const conversationIndex = updated.findIndex(conv => 
          conv.user._id === message.sender._id || conv.user._id === message.receiver._id
        )
        
        if (conversationIndex !== -1) {
          // Add message to existing conversation
          updated[conversationIndex].messages.push(message)
        } else {
          // Create new conversation
          const otherUser = message.sender._id === user?._id ? message.receiver : message.sender
          updated.unshift({
            user: otherUser,
            messages: [message]
          })
        }
        
        return updated
      })

      // Update selected conversation if it's the same user
      if (selectedConversation && 
          (selectedConversation.user._id === message.sender._id || 
           selectedConversation.user._id === message.receiver._id)) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, message]
        } : null)
      }
    }

    socket.on("new_direct_message", handleNewDirectMessage)

    return () => {
      socket.off("new_direct_message", handleNewDirectMessage)
    }
  }, [socket, selectedConversation, user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    const messageText = newMessage
    setNewMessage("")

    try {
      const response = await axiosInstance.post("/messages/send-to-user", {
        text: messageText,
        receiverId: selectedConversation.user._id
      })
      
      if (!response.data.success) {
        throw new Error("Failed to send message")
      }
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Failed to send message")
      setNewMessage(messageText) // Restore message text
    }
  }

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U"
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const getLatestMessage = (messages: Message[]) => {
    if (messages.length === 0) return "No messages yet"
    const latest = messages[messages.length - 1]
    return latest.text.length > 50 ? latest.text.substring(0, 50) + "..." : latest.text
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#051622] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "#DEB992" }}>
            Loading Inbox...
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#051622] flex flex-col">
      {/* Navbar */}
      <div className="flex-shrink-0">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-[#051622]/95 border-r border-[#1BA098]/20 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[#1BA098]/20">
            <h1 className="text-2xl font-bold" style={{ color: "#DEB992" }}>
              Inbox
            </h1>
            <p className="text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-[#1BA098]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#1BA098]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#DEB992" }}>
                  No conversations yet
                </h3>
                <p className="text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
                  Start messaging other users to see conversations here
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const isSelected = selectedConversation?.user._id === conversation.user._id
                const latestMessage = getLatestMessage(conversation.messages)
                const latestTime = conversation.messages.length > 0 
                  ? formatTime(conversation.messages[conversation.messages.length - 1].timestamp)
                  : ""

                return (
                  <button
                    key={conversation.user._id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-4 text-left hover:bg-[#1BA098]/10 transition-colors ${
                      isSelected ? "bg-[#1BA098]/20 border-r-2 border-[#1BA098]" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">
                          {getInitials(conversation.user.name)}
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate" style={{ color: "#DEB992" }}>
                            {conversation.user.name}
                          </h3>
                          {latestTime && (
                            <span className="text-xs" style={{ color: "#DEB992", opacity: 0.6 }}>
                              {latestTime}
                            </span>
                          )}
                        </div>
                        <p className="text-sm truncate" style={{ color: "#DEB992", opacity: 0.7 }}>
                          {latestMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex-shrink-0 p-4 border-b border-[#1BA098]/20 bg-[#051622]/95">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {getInitials(selectedConversation.user.name)}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold" style={{ color: "#DEB992" }}>
                      {selectedConversation.user.name}
                    </h2>
                    <p className="text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
                      {selectedConversation.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message) => {
                  const isOwnMessage = message.sender._id === user?._id
                  
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? "bg-gradient-to-r from-[#1BA098] to-[#159084] text-white"
                            : "bg-[#051622]/80 border border-[#1BA098]/20 text-[#DEB992]"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? "text-white/70" : "text-[#DEB992]/50"}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Message Input */}
              <div className="flex-shrink-0 p-4 border-t border-[#1BA098]/20">
                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-[#051622]/60 border border-[#1BA098]/30 rounded-xl text-[#DEB992] placeholder-[#DEB992]/50 focus:outline-none focus:ring-2 focus:ring-[#1BA098]"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-[#1BA098] to-[#159084] text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1BA098]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#1BA098]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#DEB992" }}>
                  Select a conversation
                </h3>
                <p className="text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
                  Choose a conversation from the inbox to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Inbox 