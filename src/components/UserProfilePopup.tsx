"use client"

import type React from "react"
import { X, Mail, Clock, UserCheck} from "lucide-react"

interface UserProfilePopupProps {
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
    gender?: string
  }
  onClose: () => void
  anchorPosition?: { x: number; y: number } // Made optional since we're centering
}

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ user, onClose }) => {
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
      {/* Enhanced Backdrop with blur */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose} />

      {/* Centered Popup with enhanced animations */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-1">
        <div
          className="relative bg-gradient-to-br from-[#051622]/98 via-[#0a1f2e]/98 to-[#051622]/98 backdrop-blur-2xl border border-[#1BA098]/40 shadow-2xl rounded-2xl p-6 min-w-[280px] max-w-[400px] w-full animate-scale-bounce transform-gpu flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* X Button - top right, always visible, inside card */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#051622]/90 border border-[#1BA098]/50 flex items-center justify-center hover:bg-[#1BA098]/30 hover:border-[#1BA098]/80 hover:scale-110 transition-all duration-300 shadow-lg"
            style={{ zIndex: 50 }}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#DEB992]" />
          </button>

          {/* Profile Header - compact */}
          <div className="flex flex-col items-center mb-4 animate-slide-up-delay-1">
            <div className="relative mb-2">
              <div className="w-14 h-14 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center shadow-xl border-2 border-[#1BA098]/30 animate-pulse-glow">
                {user.avatar ? (
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg font-bold">{getInitials(user.name)}</span>
                )}
              </div>
              {/* Online indicator - smaller */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[#051622] animate-pulse-green shadow-md">
                <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#DEB992] mb-1 animate-slide-up-delay-2">{user.name}</h3>
              <p className="text-xs text-[#1BA098] font-semibold animate-slide-up-delay-3">Fast University Student</p>
            </div>
          </div>

          {/* Profile Details - compact */}
          <div className="space-y-2 mb-4 w-full">
            {/* Email */}
            <div className="flex items-center space-x-2 p-2 bg-[#051622]/60 backdrop-blur-sm rounded-xl border border-[#1BA098]/20 hover:border-[#1BA098]/40 transition-all duration-300 animate-slide-up-delay-4 hover:scale-[1.01]">
              <div className="w-7 h-7 bg-[#1BA098]/20 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-[#1BA098]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-[#DEB992]/60 uppercase tracking-wide font-semibold mb-0.5">Email</p>
                <p className="text-xs text-[#1BA098] font-medium break-all">{user.email}</p>
              </div>
            </div>
            {/* Gender */}
            <div className="flex items-center space-x-2 p-2 bg-[#051622]/60 backdrop-blur-sm rounded-xl border border-[#1BA098]/20 hover:border-[#1BA098]/40 transition-all duration-300 animate-slide-up-delay-5 hover:scale-[1.01]">
              <div className="w-7 h-7 bg-[#1BA098]/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-[#1BA098]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-[#DEB992]/60 uppercase tracking-wide font-semibold mb-0.5">Gender</p>
                <p className="text-xs text-[#DEB992] font-medium capitalize">{user.gender || "Not specified"}</p>
              </div>
            </div>
            {/* Status */}
            <div className="flex items-center space-x-2 p-2 bg-[#051622]/60 backdrop-blur-sm rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300 animate-slide-up-delay-6 hover:scale-[1.01]">
              <div className="w-7 h-7 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-[#DEB992]/60 uppercase tracking-wide font-semibold mb-0.5">Status</p>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-green-400 font-semibold">Online Now</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - compact */}
          <div className="flex space-x-2 animate-slide-up-delay-7 w-full">
            <button className="flex-1 px-3 py-2 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-bold shadow-md hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1BA098]/50 active:scale-95 text-sm">
              Send Message
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-[#1BA098]/80 backdrop-blur-sm border-2 border-[#DEB992]/30 text-[#DEB992] rounded-xl font-bold hover:bg-[#1BA098]/90 hover:border-[#DEB992]/60 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#DEB992]/50 active:scale-95 text-sm"
            >
              Add Friend
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }

        @keyframes scale-bounce {
          0% { 
            opacity: 0; 
            transform: scale(0.3) translateY(100px); 
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.05) translateY(-10px); 
          }
          70% { 
            opacity: 0.9; 
            transform: scale(0.95) translateY(5px); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }

        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(27, 160, 152, 0.3); 
          }
          50% { 
            box-shadow: 0 0 30px rgba(27, 160, 152, 0.6), 0 0 40px rgba(27, 160, 152, 0.3); 
          }
        }

        @keyframes pulse-green {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); 
          }
          50% { 
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); 
          }
        }
        
        .animate-fade-in { 
          animation: fade-in 0.4s ease-out; 
        }
        
        .animate-scale-bounce { 
          animation: scale-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }

        .animate-slide-up-delay-1 { 
          animation: slide-up 0.5s ease-out 0.1s both; 
        }
        .animate-slide-up-delay-2 { 
          animation: slide-up 0.5s ease-out 0.2s both; 
        }
        .animate-slide-up-delay-3 { 
          animation: slide-up 0.5s ease-out 0.3s both; 
        }
        .animate-slide-up-delay-4 { 
          animation: slide-up 0.5s ease-out 0.4s both; 
        }
        .animate-slide-up-delay-5 { 
          animation: slide-up 0.5s ease-out 0.5s both; 
        }
        .animate-slide-up-delay-6 { 
          animation: slide-up 0.5s ease-out 0.6s both; 
        }
        .animate-slide-up-delay-7 { 
          animation: slide-up 0.5s ease-out 0.7s both; 
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-pulse-green {
          animation: pulse-green 2s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}

export default UserProfilePopup
