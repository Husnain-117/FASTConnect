"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import axiosInstance from "../api/axiosConfig"

import { Send, Smile, Paperclip, Mic, X, Check, CheckCheck } from "lucide-react"
import EmojiPicker, { Theme } from "emoji-picker-react"

interface DirectMessageSenderProps {
  recipientId: string
  recipientName?: string
  recipientAvatar?: string
  onSent?: () => void
  onClose?: () => void
}

const DirectMessageSender: React.FC<DirectMessageSenderProps> = ({
  recipientId,
  recipientName = "User",
  recipientAvatar,
  onSent,
  onClose,
}) => {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [messageStatus, setMessageStatus] = useState<"sending" | "sent" | "delivered" | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)


  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  // Typing indicator simulation
  useEffect(() => {
    if (text.trim()) {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 1000)
      return () => clearTimeout(timer)
    } else {
      setIsTyping(false)
    }
  }, [text])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!text.trim()) {
      setError("Message cannot be empty.")
      return
    }

    setLoading(true)
    setMessageStatus("sending")

    try {
      await axiosInstance.post(
        "https://vercel-backend-production-e3cb.up.railway.app/api/messages/send-to-user",
        { text, receiverId: recipientId },
      )

      setMessageStatus("sent")
      setTimeout(() => setMessageStatus("delivered"), 1000)
      setSuccess("Message sent!")
      setText("")
      setShowEmojiPicker(false)

      // Auto-clear success message
      setTimeout(() => {
        setSuccess("")
        setMessageStatus(null)
      }, 3000)

      if (onSent) onSent()
    } catch (err: any) {
      console.error('Send message error:', err)
      
      // Handle different types of errors
      if (err.code === 'ERR_NETWORK' || err.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        setError("Network error: Please check your connection or disable ad blockers for this site.")
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.")
      } else if (err.response?.status === 404) {
        setError("Server endpoint not found. Please check server configuration.")
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Failed to send message. Please try again.")
      }
      
      setMessageStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as any)
    }
  }

  const handleEmojiClick = (emojiData: any) => {
    setText((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="w-full max-w-md mx-4 bg-gradient-to-br from-[#051622]/95 to-[#0a1f2e]/95 backdrop-blur-xl rounded-2xl border border-[#1BA098]/30 shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1BA098]/20 bg-[#051622]/60 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center shadow-lg">
                {recipientAvatar ? (
                  <img
                    src={recipientAvatar || "/placeholder.svg"}
                    alt={recipientName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-bold">{getInitials(recipientName)}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#051622]"></div>
            </div>
            <div>
              <h3 className="font-semibold text-[#DEB992]">{recipientName}</h3>
              <p className="text-xs text-[#1BA098]">{isTyping ? "typing..." : "online"}</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/20 flex items-center justify-center hover:bg-[#1BA098]/20 hover:border-[#1BA098]/40 transition-all duration-200 group"
            >
              <X className="w-4 h-4 text-[#DEB992]/70 group-hover:text-[#1BA098]" />
            </button>
          )}
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-900/20 backdrop-blur-sm border border-green-500/30 rounded-xl animate-slide-in">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {messageStatus === "sending" && (
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                )}
                {messageStatus === "sent" && <Check className="w-4 h-4 text-green-400" />}
                {messageStatus === "delivered" && <CheckCheck className="w-4 h-4 text-green-400" />}
              </div>
              <span className="text-green-200 text-sm font-medium">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-xl animate-slide-in">
            <div className="flex items-center space-x-2">
              <X className="w-4 h-4 text-red-400" />
              <span className="text-red-200 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Message Input Area */}
        <div className="p-4">
          <form onSubmit={handleSend} className="space-y-4">
            {/* Text Input */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                className="w-full px-4 py-3 pr-12 bg-[#051622]/40 backdrop-blur-sm border border-[#1BA098]/30 rounded-2xl text-[#DEB992] placeholder-[#DEB992]/50 focus:outline-none focus:ring-2 focus:ring-[#1BA098]/50 focus:border-transparent transition-all duration-200 resize-none min-h-[50px] max-h-[120px] hover:border-[#1BA098]/50"
                placeholder={`Message ${recipientName}...`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                rows={1}
              />

              {/* Character count */}
              {text.length > 0 && (
                <div className="absolute bottom-2 right-3 text-xs text-[#DEB992]/50">{text.length}/1000</div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between space-x-3">
              {/* Left side buttons */}
              <div className="flex items-center space-x-2">
                {/* Emoji Button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={loading}
                  className="w-10 h-10 rounded-full bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 flex items-center justify-center hover:bg-[#1BA098]/20 hover:border-[#1BA098]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Smile className="w-5 h-5 text-[#1BA098] group-hover:scale-110 transition-transform" />
                </button>

                {/* Attachment Button */}
                <button
                  type="button"
                  disabled={loading}
                  className="w-10 h-10 rounded-full bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 flex items-center justify-center hover:bg-[#1BA098]/20 hover:border-[#1BA098]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Paperclip className="w-5 h-5 text-[#1BA098] group-hover:scale-110 transition-transform" />
                </button>

                {/* Voice Message Button */}
                <button
                  type="button"
                  disabled={loading}
                  className="w-10 h-10 rounded-full bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 flex items-center justify-center hover:bg-[#1BA098]/20 hover:border-[#1BA098]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Mic className="w-5 h-5 text-[#1BA098] group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-2xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1BA098]/50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#051622] border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 z-60 animate-slide-up">
              <div className="relative">
                <EmojiPicker theme={Theme.DARK} onEmojiClick={handleEmojiClick} width={300} height={400} />
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center space-x-2 text-xs text-[#DEB992]/60">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes slide-in {
          from { 
            opacity: 0; 
            transform: translateX(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        .animate-fade-in { 
          animation: fade-in 0.3s ease-out; 
        }
        
        .animate-slide-up { 
          animation: slide-up 0.3s ease-out; 
        }
        
        .animate-slide-in { 
          animation: slide-in 0.3s ease-out; 
        }

        /* Custom scrollbar for emoji picker */
        .EmojiPickerReact {
          --epr-bg-color: rgba(5, 22, 34, 0.95) !important;
          --epr-category-label-bg-color: rgba(27, 160, 152, 0.1) !important;
          --epr-search-input-bg-color: rgba(5, 22, 34, 0.8) !important;
          --epr-hover-bg-color: rgba(27, 160, 152, 0.2) !important;
          border: 1px solid rgba(27, 160, 152, 0.3) !important;
          border-radius: 16px !important;
          backdrop-filter: blur(12px) !important;
        }
      `}</style>
    </div>
  )
}

export default DirectMessageSender
