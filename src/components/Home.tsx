"use client"

import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import Navbar from "./Navbar"

const Home = () => {
  const { user, logout, userId } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleVideoCall = () => {
    navigate("/videochat")
  }

  const handleVoiceCall = () => {
    navigate("/voice-chat")
  }

  const goToProfile = () => {
    if (userId && userId !== "undefined") {
      navigate("/profile")
    } else {
      navigate("/login")
    }
  }

  const handleAbout = () => {
    navigate("/about")
  }

  const handleSearch = () => {
    navigate("/search")
  }

  const handleGuidelines = () => {
    navigate("/guidelines")
  }

  return (
    <div className="min-h-screen bg-[#051622] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="10%" cy="20%" r="3" fill="#2dd4bf" opacity="0.15">
            <animate attributeName="cy" values="20%;80%;20%" dur="12s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0.3;0.15" dur="8s" repeatCount="indefinite" />
          </circle>
          <circle cx="80%" cy="60%" r="2" fill="#34d399" opacity="0.2">
            <animate attributeName="cy" values="60%;10%;60%" dur="15s" repeatCount="indefinite" />
            <animate attributeName="cx" values="80%;85%;80%" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle cx="50%" cy="90%" r="4" fill="#2dd4bf" opacity="0.1">
            <animate attributeName="cy" values="90%;30%;90%" dur="18s" repeatCount="indefinite" />
            <animate attributeName="r" values="4;6;4" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle cx="70%" cy="30%" r="1.5" fill="#34d399" opacity="0.25">
            <animate attributeName="cy" values="30%;70%;30%" dur="14s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.4;0.25" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="20%" cy="70%" r="2.5" fill="#1BA098" opacity="0.12">
            <animate attributeName="cx" values="20%;25%;20%" dur="16s" repeatCount="indefinite" />
            <animate attributeName="cy" values="70%;40%;70%" dur="20s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <Navbar />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-2xl mb-6 sm:mb-8 shadow-2xl shadow-[#1BA098]/25 animate-float">
            <svg
              className="w-10 h-10 text-white animate-pulse-subtle"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 animate-slide-up" style={{ color: "#DEB992" }}>
            FASTConnect — Secure and Professional
            <span className="block text-[#1BA098] animate-slide-up-delay">University Communication Platform</span>
          </h1>
        </div>

        {/* Description Section */}
        <div className="prose prose-lg mx-auto leading-relaxed animate-fade-in-delay-1">
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-center animate-slide-up-delay-2" style={{ color: "#DEB992", opacity: 0.9 }}>
            FASTConnect provides a secure video and voice communication platform exclusively designed for Fast
            University students to connect, collaborate, and build meaningful relationships across all campuses
            nationwide.
          </p>
          <div className="space-y-4 sm:space-y-6 text-base sm:text-lg animate-fade-in-delay-2">
            <p className="animate-slide-in-left" style={{ color: "#DEB992", opacity: 0.8 }}>
              Our platform bridges the gap between students from different campuses including Islamabad, Lahore,
              Karachi, Peshawar, Multan and Chiniot-Faisalabad, fostering a unified university community where knowledge
              sharing and academic collaboration thrive.
            </p>
            <p className="animate-slide-in-right" style={{ color: "#DEB992", opacity: 0.8 }}>
              To ensure a safe, respectful, and productive environment for all Fast University students, we have
              established comprehensive guidelines and security measures. Our dedicated moderation team monitors
              platform usage to maintain academic integrity and professional standards.
            </p>
            <p className="animate-slide-in-left" style={{ color: "#DEB992", opacity: 0.8 }}>
              By using FASTConnect, you agree to uphold the values of Fast University and contribute to a positive
              learning environment. If you cannot comply with our community standards, we kindly ask you to refrain from
              using the platform.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-10 sm:mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 animate-fade-in-delay-3">
          {/* Video Chat Card */}
          <div className="bg-[#051622]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#1BA098]/20 p-4 sm:p-6 md:p-8 hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-[#1BA098]/40 group animate-slide-up-stagger-1">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full mb-4 sm:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 animate-bounce-subtle">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-semibold mb-4 group-hover:scale-105 transition-all duration-300"
                style={{ color: "#DEB992" }}
              >
                HD Video Communication
              </h3>
              <p
                className="mb-6 group-hover:scale-105 transition-all duration-300"
                style={{ color: "#DEB992", opacity: 0.8 }}
              >
                Connect face-to-face with fellow students for study groups, project discussions, and academic
                collaboration.
              </p>
              <button
                onClick={handleVideoCall}
                className="w-full bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base md:text-lg hover:from-[#159084] hover:to-[#1BA098] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:ring-offset-2 focus:ring-offset-[#051622] transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#1BA098]/25 active:scale-95"
              >
                Start Video Chat
              </button>
            </div>
          </div>

          {/* Voice Chat Card */}
          <div className="bg-[#051622]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#1BA098]/20 p-4 sm:p-6 md:p-8 hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-[#1BA098]/40 group animate-slide-up-stagger-2">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#159084] to-[#1BA098] rounded-full mb-4 sm:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 animate-bounce-subtle-delay">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-semibold mb-4 group-hover:scale-105 transition-all duration-300"
                style={{ color: "#DEB992" }}
              >
                Crystal Clear Voice Calls
              </h3>
              <p
                className="mb-6 group-hover:scale-105 transition-all duration-300"
                style={{ color: "#DEB992", opacity: 0.8 }}
              >
                Quick voice conversations for instant help, study sessions, and maintaining connections with your
                university network.
              </p>
              <button
                onClick={handleVoiceCall}
                className="w-full bg-gradient-to-r from-[#159084] to-[#1BA098] text-[#051622] py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base md:text-lg hover:from-[#1BA098] hover:to-[#159084] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:ring-offset-2 focus:ring-offset-[#051622] transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#1BA098]/25 active:scale-95"
              >
                Start Voice Call
              </button>
            </div>
          </div>
        </div>

        {/* Guidelines Preview */}
        <div className="mt-16 bg-[#051622]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#1BA098]/20 p-8 hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500 animate-fade-in-delay-4">
          <h2 className="text-2xl font-bold mb-6 text-center animate-slide-down" style={{ color: "#DEB992" }}>
            Community Guidelines
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 animate-slide-in-left-stagger-1 hover:scale-105 transition-all duration-300 p-2 rounded-lg hover:bg-[#1BA098]/10">
              <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center mt-0.5 animate-pulse-subtle">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p style={{ color: "#DEB992", opacity: 0.9 }}>
                <strong className="text-[#1BA098]">Maintain Academic Integrity:</strong> Use the platform for
                educational purposes and professional networking.
              </p>
            </div>
            <div className="flex items-start space-x-3 animate-slide-in-left-stagger-2 hover:scale-105 transition-all duration-300 p-2 rounded-lg hover:bg-[#1BA098]/10">
              <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center mt-0.5 animate-pulse-subtle-delay">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p style={{ color: "#DEB992", opacity: 0.9 }}>
                <strong className="text-[#1BA098]">Respect University Values:</strong> Uphold the principles and code of
                conduct of Fast University.
              </p>
            </div>
            <div className="flex items-start space-x-3 animate-slide-in-left-stagger-3 hover:scale-105 transition-all duration-300 p-2 rounded-lg hover:bg-[#1BA098]/10">
              <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center mt-0.5 animate-pulse-subtle-slow">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p style={{ color: "#DEB992", opacity: 0.9 }}>
                <strong className="text-[#1BA098]">Professional Communication:</strong> Maintain respectful and
                constructive dialogue at all times.
              </p>
            </div>
          </div>
        </div>
      </main>

 
      {/* Footer */}
      <footer className="bg-[#051622]/90 backdrop-blur-sm border-t border-[#1BA098]/20 mt-16 animate-fade-in-delay-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 animate-slide-in-left">
              <div className="flex items-center space-x-3 mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-lg shadow-lg animate-pulse-subtle">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ color: "#DEB992" }}>
                  FASTConnect
                </h3>
              </div>
              <p className="mb-4" style={{ color: "#DEB992", opacity: 0.8 }}>
                Connecting Fast University students across Pakistan through secure and professional communication tools.
              </p>
              <p className="text-sm" style={{ color: "#DEB992", opacity: 0.6 }}>
                &copy; 2024 FASTConnect. Exclusively for Fast University Students. All rights reserved.
              </p>
            </div>
            <div className="animate-slide-in-right-stagger-1">
              <h4 className="text-lg font-semibold mb-4" style={{ color: "#DEB992" }}>
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href=""
                    className="hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992", opacity: 0.8 }}
                  >
                    Profile
                  </a>
                </li>
                <li>
                  <a
                    href="/videochat"
                    className="hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992", opacity: 0.8 }}
                  >
                    Video Chat
                  </a>
                </li>
                <li>
                  <a
                    href="/voice-chat"
                    className="hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992", opacity: 0.8 }}
                  >
                    Voice Chat
                  </a>
                </li>
                <li>
                  <a
                    href=""
                    className="hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992", opacity: 0.8 }}
                  >
                    Guidelines
                  </a>
                </li>
              </ul>
            </div>
            <div className="animate-slide-in-right-stagger-2">
              <h4 className="text-lg font-semibold mb-4" style={{ color: "#DEB992" }}>
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href=""
                    className="hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992", opacity: 0.8 }}
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href=""
                    className="hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992", opacity: 0.8 }}
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href=""
                    className="hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992", opacity: 0.8 }}
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href=""
                    className="hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992", opacity: 0.8 }}
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <style >{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out; }
        .animate-slide-down { animation: slide-down 0.8s ease-out; }
        .animate-slide-in-left { animation: slide-in-left 0.8s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.8s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        .animate-bounce-subtle-delay { animation: bounce-subtle 2s ease-in-out infinite 0.5s; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        .animate-pulse-subtle-delay { animation: pulse-subtle 3s ease-in-out infinite 1s; }
        .animate-pulse-subtle-slow { animation: pulse-subtle 4s ease-in-out infinite; }
        
        .animate-fade-in-delay-1 { animation: fade-in 0.8s ease-out 0.2s both; }
        .animate-fade-in-delay-2 { animation: fade-in 0.8s ease-out 0.4s both; }
        .animate-fade-in-delay-3 { animation: fade-in 0.8s ease-out 0.6s both; }
        .animate-fade-in-delay-4 { animation: fade-in 0.8s ease-out 0.8s both; }
        .animate-fade-in-delay-5 { animation: fade-in 0.8s ease-out 1s both; }
        
        .animate-slide-up-delay { animation: slide-up 0.8s ease-out 0.3s both; }
        .animate-slide-up-delay-2 { animation: slide-up 0.8s ease-out 0.5s both; }
        .animate-slide-up-stagger-1 { animation: slide-up 0.8s ease-out 0.7s both; }
        .animate-slide-up-stagger-2 { animation: slide-up 0.8s ease-out 0.9s both; }
        
        .animate-slide-in-left-stagger-1 { animation: slide-in-left 0.8s ease-out 1.1s both; }
        .animate-slide-in-left-stagger-2 { animation: slide-in-left 0.8s ease-out 1.3s both; }
        .animate-slide-in-left-stagger-3 { animation: slide-in-left 0.8s ease-out 1.5s both; }
      `}</style>
    </div>
  )
}

export default Home
