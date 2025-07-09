"use client"

import React from "react"
import { X, Mail, User, Clock } from "lucide-react"
// import DirectMessageSender from "./DirectMessageSender"

interface UserProfilePopupProps {
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  onClose: () => void
  anchorPosition?: { x: number; y: number }
}

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ user, onClose, anchorPosition }) => {
  const [showDM, setShowDM] = React.useState(false)
  const handleSendMessage = () => setShowDM(true)
  // const handleCloseDM = () => setShowDM(false)

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

  return (
    <>
      {/* Backdrop */}
      {!showDM && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />}

      {/* Popup */}
      {!showDM && (
        <div
          className="fixed z-50 bg-gradient-to-br from-[#051622]/95 to-[#0a1f2e]/95 backdrop-blur-xl border border-[#1BA098]/30 shadow-2xl rounded-2xl p-6 min-w-[280px] max-w-[320px] max-h-[90vh] overflow-auto relative"
          style={
            anchorPosition
              ? {
                  left: Math.min(anchorPosition.x, window.innerWidth - 320),
                  top: Math.min(anchorPosition.y, window.innerHeight - 200),
                  position: "fixed"
                }
              : { left: "50%", top: "50%", transform: "translate(-50%, -50%)", position: "fixed" }
          }
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/20 flex items-center justify-center hover:bg-[#1BA098]/20 hover:border-[#1BA098]/40 transition-all duration-200 group"
          >
            <X className="w-4 h-4 text-[#DEB992]/70 group-hover:text-[#1BA098]" />
          </button>

          {/* Profile Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center shadow-lg border-2 border-[#1BA098]/20 overflow-hidden">
                {user.avatar && user.avatar.trim() !== "" ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#1BA098]/30 shadow-md"
                    onError={e => {
                      const parent = (e.target as HTMLImageElement).parentNode as HTMLElement;
                      if (parent) {
                        parent.innerHTML = `<span class='text-white text-lg font-bold flex items-center justify-center w-16 h-16'>${getInitials(user.name)}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="text-white text-lg font-bold flex items-center justify-center w-16 h-16">{getInitials(user.name)}</span>
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-[#051622] animate-pulse"></div>
            </div>

            <div className="flex-1">
              {/* Name removed as per previous request */}
              <p className="text-sm text-[#1BA098] font-medium">Fast University Student</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center space-x-3 p-3 bg-[#051622]/40 backdrop-blur-sm rounded-xl border border-[#1BA098]/10">
              <div className="w-8 h-8 bg-[#1BA098]/20 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-[#1BA098]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#DEB992]/60 uppercase tracking-wide font-medium">Email</p>
                <p className="text-sm text-[#DEB992] font-medium">{user.email}</p>
              </div>
            </div>

            {/* User ID */}
            <div className="flex items-center space-x-3 p-3 bg-[#051622]/40 backdrop-blur-sm rounded-xl border border-[#1BA098]/10">
              <div className="w-8 h-8 bg-[#1BA098]/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-[#1BA098]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#DEB992]/60 uppercase tracking-wide font-medium">User ID</p>
                <p className="text-sm text-[#DEB992] font-mono">{user._id.slice(-8)}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-3 p-3 bg-[#051622]/40 backdrop-blur-sm rounded-xl border border-[#1BA098]/10">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#DEB992]/60 uppercase tracking-wide font-medium">Status</p>
                <p className="text-sm text-green-400 font-medium">Online Now</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1BA098]/50"
              onClick={handleSendMessage}
            >
              Send Message
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#DEB992]/30 text-[#DEB992] rounded-xl font-semibold hover:bg-[#DEB992]/10 hover:border-[#DEB992]/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#DEB992]/50"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* {showDM && (
        // <DirectMessageSender
        //   recipientId={user._id}
        //   recipientName={user.name}
        //   recipientAvatar={user.avatar}
        //   onClose={handleCloseDM}
        // />
      )} */}
      <style>{``}</style>
    </>
  )
}

export default UserProfilePopup
