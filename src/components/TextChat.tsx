"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import axiosInstance from "../api/axiosConfig"
import { useAuth } from "../context/AuthContext"
import Navbar from "./Navbar"
import { useSocket } from "../contexts/SocketContext"
import Picker from "@emoji-mart/react"
import data from "@emoji-mart/data"
import API_BASE_URL from "../config/apiBaseUrl"

interface Message {
  _id: string
  text: string
  sender: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  timestamp: string
}

const FILTERS = [
  { label: "Today", value: "today", icon: "📅" },
  { label: "Yesterday", value: "yesterday", icon: "📆" },
  { label: "This Week", value: "week", icon: "📊" },
  { label: "Last 7 Days", value: "last7", icon: "📈" },
  { label: "This Month", value: "month", icon: "🗓️" },
  { label: "All", value: "all", icon: "💬" },
]

function isToday(date: Date) {
  const now = new Date()
  return (
    date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  )
}

function isYesterday(date: Date) {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}

function isThisWeek(date: Date) {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
  startOfWeek.setHours(0, 0, 0, 0)
  return date >= startOfWeek && date <= now
}

function isLast7Days(date: Date) {
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 6) // includes today
  sevenDaysAgo.setHours(0, 0, 0, 0)
  return date >= sevenDaysAgo && date <= now
}

function isThisMonth(date: Date) {
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

const TextChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { socket } = useSocket()
  const { user, token } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState<string>("all")
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [onlineUsersError, setOnlineUsersError] = useState<string | null>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  // Helper function to check if input should be disabled
  const isInputDisabled = () => {
    return filter !== "today" && filter !== "all"
  }

  // Helper function to get the disabled message
  const getDisabledMessage = () => {
    if (filter === "today" || filter === "all") return ""
    return "Switch to 'Today' or 'All' to send messages"
  }

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get("/messages/all")
        setMessages(response.data.messages || [])
      } catch (err) {
        setError("Failed to load messages")
        console.error("Error fetching messages:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [])

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: Message) => {
      console.log("[Socket] Received new_message:", message)
      setMessages((prev) => [...prev, message])
    }

    socket.on("new_message", handleNewMessage)

    socket.on("connect", () => {
      // Optionally re-fetch messages or notify user
    })

    socket.on("disconnect", () => {
      // Optionally notify user of disconnect
    })

    return () => {
      socket.off("new_message", handleNewMessage)
      socket.off("connect")
      socket.off("disconnect")
    }
  }, [socket])

  // Auto-scroll to bottom when messages change, but only if user is near the bottom
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    }
  }, [messages])

  // Track if user is not at the bottom, show scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10
      setShowScrollToBottom(!isAtBottom)
    }

    container.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10
    setShowScrollToBottom(!isAtBottom)
  }, [messages])

  const handleScrollToBottom = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const messageText = newMessage
    setNewMessage("")

    inputRef.current?.focus()

    try {
      const response = await axiosInstance.post("/messages/send", { text: messageText })
      if (!response.data.success) {
        throw new Error("Failed to send message")
      }
    } catch (err) {
      setError("Failed to send message")
      setNewMessage(messageText)
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

  const filteredMessages = messages.filter((msg) => {
    const msgDate = new Date(msg.timestamp)
    if (filter === "today") return isToday(msgDate)
    if (filter === "yesterday") return isYesterday(msgDate)
    if (filter === "week") return isThisWeek(msgDate)
    if (filter === "last7") return isLast7Days(msgDate)
    if (filter === "month") return isThisMonth(msgDate)
    if (filter === "custom" && customStart && customEnd) {
      const start = new Date(customStart)
      const end = new Date(customEnd)
      end.setHours(23, 59, 59, 999)
      return msgDate >= start && msgDate <= end
    }
    return true
  })

  const fetchOnlineUsers = async () => {
    if (!token) {
      setOnlineUsersError("No auth token")
      return []
    }
    try {
      const res = await fetch(`${API_BASE_URL}/profile/online`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch online users")
      const response = await res.json()
      if (!response.success || !Array.isArray(response.users)) {
        console.error("Unexpected response format:", response)
        return []
      }
      return response.users.map((user: any) => user._id)
    } catch (err) {
      console.error("Error fetching online users:", err)
      setOnlineUsersError("Failed to load online users")
      return []
    }
  }

  useEffect(() => {
    if (!token) return
    fetchOnlineUsers().then(setOnlineUsers)
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#051622] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
            <circle cx="15%" cy="25%" r="3" fill="#2dd4bf" opacity="0.12">
              <animate attributeName="cy" values="25%;75%;25%" dur="14s" repeatCount="indefinite" />
            </circle>
            <circle cx="85%" cy="40%" r="2.5" fill="#34d399" opacity="0.18">
              <animate attributeName="cy" values="40%;15%;40%" dur="16s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
        <div className="text-center animate-fade-in relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full mb-4 animate-pulse-subtle shadow-2xl shadow-[#1BA098]/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "#DEB992" }}>
            Connecting to Chat...
          </h2>
          <p style={{ color: "#DEB992", opacity: 0.8 }}>Please wait while we connect you</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#051622] relative overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="10%" cy="18%" r="3.5" fill="#2dd4bf" opacity="0.08">
            <animate attributeName="cy" values="18%;82%;18%" dur="20s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.08;0.15;0.08" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle cx="90%" cy="30%" r="2.8" fill="#34d399" opacity="0.1">
            <animate attributeName="cy" values="30%;8%;30%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="cx" values="90%;85%;90%" dur="18s" repeatCount="indefinite" />
          </circle>
          <circle cx="40%" cy="90%" r="4.2" fill="#2dd4bf" opacity="0.06">
            <animate attributeName="cy" values="90%;25%;90%" dur="26s" repeatCount="indefinite" />
            <animate attributeName="r" values="4.2;6.8;4.2" dur="20s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Fixed Navbar */}
      <div className="flex-shrink-0 relative z-10">
        <Navbar />
      </div>

      {/* Main Chat Layout - Fixed Height */}
      <div className="flex flex-1 relative z-10 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${showSidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:relative z-30 w-80 h-full bg-[#051622]/95 backdrop-blur-sm border-r border-[#1BA098]/20 transition-transform duration-300 ease-in-out flex flex-col`}
        >
          <div className="p-6 flex-1 flex flex-col overflow-hidden">
            {/* Chat Room Header */}
            <div className="flex-shrink-0 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#DEB992" }}>
                    Fast Connect
                  </h2>
                  <p className="text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
                    Global Chat Room
                  </p>
                </div>
              </div>

              {/* Online Status */}
              <div className="flex items-center space-x-2 p-3 bg-[#1BA098]/10 backdrop-blur-sm rounded-xl border border-[#1BA098]/20">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium" style={{ color: "#DEB992" }}>
                  {onlineUsers.length} students online
                </span>
              </div>
            </div>

            {/* Message Filters - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#DEB992", opacity: 0.8 }}>
                MESSAGE FILTERS
              </h3>
              <div className="space-y-2 pb-4">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      filter === f.value
                        ? "bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] shadow-lg"
                        : "text-[#DEB992] hover:bg-[#1BA098]/10 border border-transparent hover:border-[#1BA098]/20"
                    }`}
                  >
                    <span className="text-lg">{f.icon}</span>
                    <span className="font-medium">{f.label}</span>
                    {filter === f.value && <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats - Fixed at bottom */}
            <div className="flex-shrink-0 mt-4">
              <div className="bg-[#051622]/60 backdrop-blur-sm rounded-xl p-4 border border-[#1BA098]/20">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1" style={{ color: "#1BA098" }}>
                    {filteredMessages.length}
                  </div>
                  <div className="text-xs" style={{ color: "#DEB992", opacity: 0.7 }}>
                    Messages {filter !== "all" ? `(${filter})` : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area - Fixed Height */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header - Fixed */}
          <div className="flex-shrink-0 bg-[#051622]/95 backdrop-blur-sm border-b border-[#1BA098]/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 rounded-lg bg-[#1BA098]/20 text-[#1BA098] hover:bg-[#1BA098]/30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#DEB992" }}>
                  University Chat Room
                </h1>
                <p className="text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
                  {filter === "all" ? "All messages" : `Showing ${filter} messages`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-[#1BA098]/10 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm" style={{ color: "#DEB992" }}>
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Error Message - Fixed */}
          {error && (
            <div className="flex-shrink-0 mx-6 mt-4 p-3 bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-xl animate-slide-in">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Messages Area - Scrollable with Fixed Height */}
          <div className="flex-1 overflow-hidden">
            <div ref={messagesContainerRef} className="h-full overflow-y-auto px-6 py-4 space-y-4 relative">
              {filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 bg-[#1BA098]/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1BA098]/30">
                      <svg className="w-8 h-8 text-[#1BA098]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "#DEB992" }}>
                      No messages yet
                    </h3>
                    <p className="text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
                      {filter === "all" ? "Be the first to start the conversation!" : `No messages found for ${filter}`}
                    </p>
                  </div>
                </div>
              ) : (
                filteredMessages.map((message, index) => {
                  const isOwnMessage = message.sender._id === user?._id
                  const showAvatar = index === 0 || filteredMessages[index - 1]?.sender._id !== message.sender._id

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} animate-slide-in`}
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <div
                        className={`flex items-end space-x-3 max-w-md ${
                          isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        {/* Avatar */}
                        {showAvatar && (
                          <div className="w-8 h-8 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                            <span className="text-white text-xs font-bold">{getInitials(message.sender.name)}</span>
                          </div>
                        )}
                        {!showAvatar && <div className="w-8"></div>}

                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm backdrop-blur-sm border transition-all duration-200 hover:scale-[1.02] ${
                            isOwnMessage
                              ? "bg-gradient-to-r from-[#1BA098] to-[#159084] text-white rounded-br-md border-[#1BA098]/30"
                              : "bg-[#051622]/60 border-[#1BA098]/20 text-[#DEB992] rounded-bl-md"
                          }`}
                        >
                          {/* Sender Name */}
                          {!isOwnMessage && showAvatar && (
                            <div className="text-xs font-semibold text-[#1BA098] mb-1">{message.sender.name}</div>
                          )}
                          {/* Message Text */}
                          <div className="break-words leading-relaxed text-sm">{message.text}</div>
                          {/* Timestamp */}
                          <div className={`text-xs mt-2 ${isOwnMessage ? "text-white/60" : "text-[#DEB992]/50"}`}>
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#1BA098]/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-[#1BA098]/20">
                      <span className="text-[#1BA098] text-xs font-bold">...</span>
                    </div>
                    <div className="bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/20 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#1BA098] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#1BA098] rounded-full animate-bounce animation-delay-100"></div>
                        <div className="w-2 h-2 bg-[#1BA098] rounded-full animate-bounce animation-delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />

              {/* Scroll to bottom button */}
              {showScrollToBottom && (
                <button
                  onClick={handleScrollToBottom}
                  className="absolute bottom-4 right-4 z-20 bg-gradient-to-r from-[#1BA098] to-[#159084] hover:from-[#159084] hover:to-[#1BA098] text-white rounded-full shadow-xl p-3 transition-all duration-300 flex items-center justify-center border-2 border-[#051622]/60 backdrop-blur-sm transform hover:scale-110"
                  title="Scroll to latest message"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Message Input - Fixed at Bottom */}
          <div className="flex-shrink-0 border-t border-[#1BA098]/20 bg-[#051622]/95 backdrop-blur-sm p-4">
            {isInputDisabled() && (
              <div className="mb-3 p-2 bg-amber-900/20 backdrop-blur-sm border border-amber-500/30 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-amber-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-amber-200 text-xs">{getDisabledMessage()}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              {/* Emoji button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                disabled={isInputDisabled()}
                className={`p-3 rounded-xl bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 focus:outline-none focus:ring-2 focus:ring-[#1BA098] transition-all duration-200 hover:bg-[#1BA098]/10 ${isInputDisabled() ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                aria-label="Add emoji"
              >
                <svg
                  className="w-5 h-5 text-[#1BA098]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showEmojiPicker && !isInputDisabled() && (
                <div className="absolute bottom-20 left-4 z-50">
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => {
                      setNewMessage(newMessage + emoji.native)
                      setShowEmojiPicker(false)
                    }}
                    theme="dark"
                  />
                </div>
              )}

              {/* Message input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    isInputDisabled() ? "Switch to 'Today' or 'All' to send messages..." : "Type a message..."
                  }
                  disabled={isInputDisabled()}
                  className={`w-full px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] placeholder-[#DEB992]/50 focus:outline-none focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 ${isInputDisabled() ? "opacity-50 cursor-not-allowed" : "hover:border-[#1BA098]/50"}`}
                />
              </div>

              {/* Send button */}
              <button
                type="submit"
                disabled={isInputDisabled() || !newMessage.trim()}
                className={`px-6 py-3 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200 focus:outline-none focus:ring-[#1BA098]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${!isInputDisabled() && newMessage.trim() ? "hover:scale-105" : ""}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-20" onClick={() => setShowSidebar(false)} />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
      
        .animation-delay-100 {
          animation-delay: 0.1s;
          animation-fill-mode: both;
        }
      
        .animation-delay-200 {
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }

        /* Custom scrollbar for chat messages */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
      
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(27, 160, 152, 0.1);
          border-radius: 3px;
        }
      
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(27, 160, 152, 0.3);
          border-radius: 3px;
        }
      
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(27, 160, 152, 0.5);
        }
      `}</style>
    </div>
  )
}

export default TextChat
