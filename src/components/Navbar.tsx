"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { UserIcon, Menu, X } from "lucide-react"
import { useAuth } from "../context/AuthContext"

const Navbar = () => {
  const { user, logout, userId, loading } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const goToProfile = () => {
    if (userId && userId !== "undefined") {
      navigate(`/profile/${userId}`)
    } else {
      navigate("/login")
    }
    setIsMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const navigationLinks = [
    { href: "/videochat", label: "Video Chat" },
    { href: "/voice-chat", label: "Voice Chat" },
    { href: "/text-chat", label: "Text Chat" },
    { href: "/search", label: "Search" },
    { href: "/about", label: "About" },
  ]

  if (loading) {
    return (
      <header className="bg-[#051622] shadow-lg border-b border-[#1BA098]/20 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#1BA098]/20 rounded-lg animate-pulse"></div>
              <div className="h-4 w-32 bg-[#1BA098]/20 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-[#1BA098]/20 rounded-full animate-pulse"></div>
              <div className="h-8 w-20 bg-[#1BA098]/20 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="bg-[#051622] shadow-lg border-b border-[#1BA098]/20 backdrop-blur-sm animate-slide-down relative z-50">
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-2 left-10 w-1 h-1 bg-[#1BA098] rounded-full animate-twinkle"></div>
          <div className="absolute top-4 right-20 w-1 h-1 bg-[#DEB992] rounded-full animate-twinkle-delay"></div>
          <div className="absolute bottom-3 left-1/3 w-1 h-1 bg-[#1BA098] rounded-full animate-twinkle-slow"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16">
            {/* Brand / Logo */}
            <Link to="/home" className="flex items-center space-x-3 cursor-pointer group animate-fade-in-delay-1">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-[#1BA098] rounded-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-[#1BA098]/25 group-hover:shadow-lg animate-pulse-subtle">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1
                className="text-xl font-bold group-hover:scale-105 transition-all duration-300"
                style={{ color: "#DEB992" }}
              >
                FASTConnect
              </h1>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 animate-fade-in-delay-2">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="group relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105"
                  style={{ color: "#DEB992" }}
                >
                  <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                    {link.label}
                  </span>
                  <div className="absolute inset-0 bg-[#1BA098] rounded-lg scale-0 group-hover:scale-100 transition-all duration-300 ease-out shadow-lg" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-lg scale-0 group-hover:scale-100 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100" />
                </Link>
              ))}
            </nav>

            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center space-x-4 animate-fade-in-delay-3">
              {/* Profile Avatar Button */}
              <div
                className="flex items-center space-x-3 group cursor-pointer hover:scale-105 transition-all duration-300"
                onClick={goToProfile}
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-[#1BA098]/50">
                    {user?.name ? (
                      <span className="text-white text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                    ) : (
                      <UserIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#051622] animate-pulse"></div>
                </div>
                <span
                  className="hidden sm:block text-sm font-medium group-hover:scale-105 transition-all duration-300"
                  style={{ color: "#DEB992" }}
                >
                  {user?.name || "Profile"}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="group relative inline-flex items-center px-4 py-2 border border-[#1BA098]/30 rounded-lg shadow-sm text-sm font-medium bg-[#051622] hover:bg-[#1BA098] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1BA098] transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-[#1BA098]/25 overflow-hidden"
                style={{ color: "#DEB992" }}
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1BA098] to-[#159084] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                <svg
                  className="w-4 h-4 mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
              {/* Mobile Profile Avatar */}
              <div
                className="flex items-center group cursor-pointer hover:scale-105 transition-all duration-300"
                onClick={goToProfile}
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                    {user?.name ? (
                      <span className="text-white text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                    ) : (
                      <UserIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#051622] animate-pulse"></div>
                </div>
              </div>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-[#1BA098]/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1BA098] transition-all duration-300"
                style={{ color: "#DEB992" }}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6 transform rotate-90 transition-transform duration-300" />
                ) : (
                  <Menu className="block h-6 w-6 transform rotate-0 transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-96 opacity-100 visible" : "max-h-0 opacity-0 invisible overflow-hidden"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-[#051622]/95 backdrop-blur-sm border-t border-[#1BA098]/20">
            {navigationLinks.map((link, index) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={closeMobileMenu}
                className={`group block px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 hover:bg-[#1BA098]/20 hover:scale-105 animate-slide-in-mobile`}
                style={{
                  color: "#DEB992",
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <span className="group-hover:text-white transition-colors duration-300">{link.label}</span>
              </Link>
            ))}

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="group w-full text-left px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 hover:bg-[#1BA098]/20 hover:scale-105 animate-slide-in-mobile"
              style={{
                color: "#DEB992",
                animationDelay: `${navigationLinks.length * 0.1}s`,
              }}
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3 group-hover:rotate-12 transition-all duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="group-hover:text-white transition-colors duration-300">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-mobile {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes twinkle-delay {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        
        @keyframes twinkle-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-down { animation: slide-down 0.8s ease-out; }
        .animate-slide-in-mobile { animation: slide-in-mobile 0.4s ease-out both; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        .animate-fade-in-delay-1 { animation: fade-in 0.6s ease-out 0.1s both; }
        .animate-fade-in-delay-2 { animation: fade-in 0.6s ease-out 0.2s both; }
        .animate-fade-in-delay-3 { animation: fade-in 0.6s ease-out 0.3s both; }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        .animate-twinkle-delay { animation: twinkle-delay 2.5s ease-in-out infinite; }
        .animate-twinkle-slow { animation: twinkle-slow 3s ease-in-out infinite; }
      `}</style>
    </>
  )
}

export default Navbar
