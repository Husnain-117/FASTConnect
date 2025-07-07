"use client"

import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import Navbar from "./Navbar"

const About = () => {
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

  const goToProfile = () => {
    if (userId && userId !== "undefined") {
      navigate("/profile")
    } else {
      navigate("/login")
    }
  }

  return (
    <div className="min-h-screen bg-[#051622] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="15%" cy="25%" r="3" fill="#2dd4bf" opacity="0.12">
            <animate attributeName="cy" values="25%;75%;25%" dur="14s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.12;0.25;0.12" dur="8s" repeatCount="indefinite" />
          </circle>
          <circle cx="85%" cy="40%" r="2.5" fill="#34d399" opacity="0.18">
            <animate attributeName="cy" values="40%;15%;40%" dur="16s" repeatCount="indefinite" />
            <animate attributeName="cx" values="85%;80%;85%" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle cx="45%" cy="85%" r="4" fill="#2dd4bf" opacity="0.08">
            <animate attributeName="cy" values="85%;35%;85%" dur="20s" repeatCount="indefinite" />
            <animate attributeName="r" values="4;6;4" dur="14s" repeatCount="indefinite" />
          </circle>
          <circle cx="75%" cy="20%" r="1.8" fill="#34d399" opacity="0.22">
            <animate attributeName="cy" values="20%;65%;20%" dur="18s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.22;0.35;0.22" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle cx="25%" cy="60%" r="3.2" fill="#1BA098" opacity="0.15">
            <animate attributeName="cx" values="25%;30%;25%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="cy" values="60%;30%;60%" dur="24s" repeatCount="indefinite" />
          </circle>
          <circle cx="60%" cy="10%" r="2.2" fill="#2dd4bf" opacity="0.2">
            <animate attributeName="cy" values="10%;50%;10%" dur="26s" repeatCount="indefinite" />
            <animate attributeName="r" values="2.2;3.5;2.2" dur="16s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-3xl mb-6 sm:mb-8 shadow-2xl shadow-[#1BA098]/25 animate-float">
            <svg
              className="w-12 h-12 text-white animate-pulse-subtle"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 animate-slide-up" style={{ color: "#DEB992" }}>
            About <span className="text-[#1BA098] animate-slide-up-delay">FASTConnect</span>
          </h1>
          <p
            className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed animate-slide-up-delay-2"
            style={{ color: "#DEB992", opacity: 0.9 }}
          >
            Empowering Fast University students to build meaningful connections, collaborate on academic projects, and
            foster a unified learning community across all campuses.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-20 animate-fade-in-delay-1">
          <div className="bg-[#051622]/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#1BA098]/20 p-4 sm:p-8 md:p-12 hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500">
            <div className="text-center mb-12 animate-slide-down">
              <h2 className="text-3xl font-bold mb-4" style={{ color: "#DEB992" }}>
                Our Mission
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-[#1BA098] to-[#159084] mx-auto rounded-full animate-expand"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group animate-slide-up-stagger-1 hover:scale-105 transition-all duration-300 p-4 rounded-xl hover:bg-[#1BA098]/10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg animate-bounce-subtle">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <h3
                  className="text-xl font-semibold mb-3 group-hover:text-[#1BA098] transition-colors duration-300"
                  style={{ color: "#DEB992" }}
                >
                  Connect Students
                </h3>
                <p style={{ color: "#DEB992", opacity: 0.8 }}>
                  Bridge the gap between students from different campuses and create lasting academic relationships.
                </p>
              </div>
              <div className="text-center group animate-slide-up-stagger-2 hover:scale-105 transition-all duration-300 p-4 rounded-xl hover:bg-[#1BA098]/10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#159084] to-[#1BA098] rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg animate-bounce-subtle-delay">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3
                  className="text-xl font-semibold mb-3 group-hover:text-[#1BA098] transition-colors duration-300"
                  style={{ color: "#DEB992" }}
                >
                  Foster Innovation
                </h3>
                <p style={{ color: "#DEB992", opacity: 0.8 }}>
                  Encourage collaborative learning and innovative thinking through seamless communication tools.
                </p>
              </div>
              <div className="text-center group animate-slide-up-stagger-3 hover:scale-105 transition-all duration-300 p-4 rounded-xl hover:bg-[#1BA098]/10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg animate-bounce-subtle-slow">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3
                  className="text-xl font-semibold mb-3 group-hover:text-[#1BA098] transition-colors duration-300"
                  style={{ color: "#DEB992" }}
                >
                  Ensure Security
                </h3>
                <p style={{ color: "#DEB992", opacity: 0.8 }}>
                  Maintain a safe and secure environment exclusively for verified Fast University students.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12 sm:mb-16 md:mb-20 animate-fade-in-delay-2">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 animate-slide-up" style={{ color: "#DEB992" }}>
              Platform Features
            </h2>
            <p className="text-xl max-w-2xl mx-auto animate-slide-up-delay" style={{ color: "#DEB992", opacity: 0.9 }}>
              Discover the powerful tools designed to enhance your university experience and academic collaboration.
            </p>
          </div>
          <div className="grid gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-8 animate-slide-in-left">
              <div className="flex items-start space-x-4 group hover:scale-105 transition-all duration-300 p-4 rounded-xl hover:bg-[#1BA098]/10 animate-slide-in-left-stagger-1">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    className="text-xl font-semibold mb-2 group-hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992" }}
                  >
                    HD Video Conferencing
                  </h3>
                  <p style={{ color: "#DEB992", opacity: 0.8 }}>
                    Crystal clear video calls with advanced features for group discussions, presentations, and virtual
                    study sessions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4 group hover:scale-105 transition-all duration-300 p-4 rounded-xl hover:bg-[#1BA098]/10 animate-slide-in-left-stagger-2">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#159084] to-[#1BA098] rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    className="text-xl font-semibold mb-2 group-hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992" }}
                  >
                    Voice Communication
                  </h3>
                  <p style={{ color: "#DEB992", opacity: 0.8 }}>
                    High-quality voice calls for quick consultations, study group coordination, and instant academic
                    support.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4 group hover:scale-105 transition-all duration-300 p-4 rounded-xl hover:bg-[#1BA098]/10 animate-slide-in-left-stagger-3">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    className="text-xl font-semibold mb-2 group-hover:text-[#1BA098] transition-colors duration-300"
                    style={{ color: "#DEB992" }}
                  >
                    Campus Integration
                  </h3>
                  <p style={{ color: "#DEB992", opacity: 0.8 }}>
                    Seamlessly connect with students from all Fast University campuses across Pakistan.
                  </p>
                </div>
              </div>
            </div>
            {/* Feature Visual */}
            <div className="bg-gradient-to-br from-[#1BA098]/20 to-[#159084]/20 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-12 text-center border border-[#1BA098]/20 hover:border-[#1BA098]/40 transition-all duration-500 hover:scale-105 animate-slide-in-right">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-[#051622]/80 backdrop-blur-sm rounded-full shadow-2xl shadow-[#1BA098]/25 mb-6 sm:mb-8 animate-float">
                <svg
                  className="w-16 h-16 text-[#1BA098] animate-pulse-subtle"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4" style={{ color: "#DEB992" }}>
                Nationwide Network
              </h3>
              <p className="text-base sm:text-lg" style={{ color: "#DEB992", opacity: 0.8 }}>
                Connect with over 50,000+ Fast University students across 7 major campuses in Pakistan.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="mb-12 sm:mb-16 md:mb-20 animate-fade-in-delay-3">
          <div className="bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-3xl p-6 sm:p-8 md:p-12 text-white shadow-2xl shadow-[#1BA098]/25 hover:shadow-[#1BA098]/35 transition-all duration-500 hover:scale-105">
            <div className="text-center mb-12 animate-slide-down">
              <h2 className="text-3xl font-bold mb-4">Platform Impact</h2>
              <p className="text-[#DEB992]/80 text-lg">Making a difference in the Fast University community</p>
            </div>
            <div className="grid gap-6 sm:gap-8 md:grid-cols-4 text-center">
              <div className="animate-slide-up-stagger-1 hover:scale-110 transition-all duration-300">
                <div className="text-4xl font-bold mb-2 animate-counter">50,000+</div>
                <div className="text-[#DEB992]/80">Active Students</div>
              </div>
              <div className="animate-slide-up-stagger-2 hover:scale-110 transition-all duration-300">
                <div className="text-4xl font-bold mb-2 animate-counter-delay">7</div>
                <div className="text-[#DEB992]/80">Campuses Connected</div>
              </div>
              <div className="animate-slide-up-stagger-3 hover:scale-110 transition-all duration-300">
                <div className="text-4xl font-bold mb-2 animate-counter-slow">100,000+</div>
                <div className="text-[#DEB992]/80">Successful Connections</div>
              </div>
              <div className="animate-slide-up-stagger-4 hover:scale-110 transition-all duration-300">
                <div className="text-4xl font-bold mb-2 animate-counter-fast">99.9%</div>
                <div className="text-[#DEB992]/80">Uptime Reliability</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20 animate-fade-in-delay-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 animate-slide-up" style={{ color: "#DEB992" }}>
              Our Commitment
            </h2>
            <p className="text-xl max-w-3xl mx-auto animate-slide-up-delay" style={{ color: "#DEB992", opacity: 0.9 }}>
              FASTConnect is developed and maintained by a dedicated team committed to enhancing the educational
              experience of Fast University students.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#051622]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#1BA098]/20 p-8 text-center hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-[#1BA098]/40 group animate-slide-up-stagger-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg animate-bounce-subtle">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-semibold mb-3 group-hover:text-[#1BA098] transition-colors duration-300"
                style={{ color: "#DEB992" }}
              >
                24/7 Support
              </h3>
              <p style={{ color: "#DEB992", opacity: 0.8 }}>
                Round-the-clock technical support to ensure uninterrupted communication for all students.
              </p>
            </div>
            <div className="bg-[#051622]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#1BA098]/20 p-8 text-center hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-[#1BA098]/40 group animate-slide-up-stagger-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#159084] to-[#1BA098] rounded-full mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg animate-bounce-subtle-delay">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-semibold mb-3 group-hover:text-[#1BA098] transition-colors duration-300"
                style={{ color: "#DEB992" }}
              >
                Student-Centric
              </h3>
              <p style={{ color: "#DEB992", opacity: 0.8 }}>
                Every feature is designed with student needs in mind, prioritizing academic success and collaboration.
              </p>
            </div>
            <div className="bg-[#051622]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#1BA098]/20 p-8 text-center hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-[#1BA098]/40 group animate-slide-up-stagger-3">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg animate-bounce-subtle-slow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3
                className="text-xl font-semibold mb-3 group-hover:text-[#1BA098] transition-colors duration-300"
                style={{ color: "#DEB992" }}
              >
                Continuous Innovation
              </h3>
              <p style={{ color: "#DEB992", opacity: 0.8 }}>
                Regular updates and new features based on student feedback and emerging educational technologies.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center animate-fade-in-delay-5">
          <div className="bg-[#051622]/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#1BA098]/20 p-12 hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <h2 className="text-3xl font-bold mb-4 animate-slide-up" style={{ color: "#DEB992" }}>
              Ready to Connect?
            </h2>
            <p
              className="text-xl mb-8 max-w-2xl mx-auto animate-slide-up-delay"
              style={{ color: "#DEB992", opacity: 0.9 }}
            >
              Join thousands of Fast University students who are already using FASTConnect to enhance their academic
              journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up-delay-2">
              <a
                href="/videochat"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-bold hover:from-[#159084] hover:to-[#1BA098] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:ring-offset-2 focus:ring-offset-[#051622] transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#1BA098]/25 active:scale-95"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Start Video Chat
              </a>
              <a
                href="/voice-chat"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#159084] to-[#1BA098] text-[#051622] rounded-xl font-bold hover:from-[#1BA098] hover:to-[#159084] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:ring-offset-2 focus:ring-offset-[#051622] transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#1BA098]/25 active:scale-95"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                Start Voice Call
              </a>
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

      <style>{`
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
        
        @keyframes expand {
          from { width: 0; }
          to { width: 6rem; }
        }
        
        @keyframes counter {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out; }
        .animate-slide-down { animation: slide-down 0.8s ease-out; }
        .animate-slide-in-left { animation: slide-in-left 0.8s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.8s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        .animate-bounce-subtle-delay { animation: bounce-subtle 2s ease-in-out infinite 0.5s; }
        .animate-bounce-subtle-slow { animation: bounce-subtle 3s ease-in-out infinite; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        .animate-expand { animation: expand 1s ease-out 0.5s both; }
        .animate-counter { animation: counter 0.8s ease-out 1.2s both; }
        .animate-counter-delay { animation: counter 0.8s ease-out 1.4s both; }
        .animate-counter-slow { animation: counter 0.8s ease-out 1.6s both; }
        .animate-counter-fast { animation: counter 0.8s ease-out 1.8s both; }
        
        .animate-fade-in-delay-1 { animation: fade-in 0.8s ease-out 0.2s both; }
        .animate-fade-in-delay-2 { animation: fade-in 0.8s ease-out 0.4s both; }
        .animate-fade-in-delay-3 { animation: fade-in 0.8s ease-out 0.6s both; }
        .animate-fade-in-delay-4 { animation: fade-in 0.8s ease-out 0.8s both; }
        .animate-fade-in-delay-5 { animation: fade-in 0.8s ease-out 1s both; }
        .animate-fade-in-delay-6 { animation: fade-in 0.8s ease-out 1.2s both; }
        
        .animate-slide-up-delay { animation: slide-up 0.8s ease-out 0.3s both; }
        .animate-slide-up-delay-2 { animation: slide-up 0.8s ease-out 0.5s both; }
        .animate-slide-up-stagger-1 { animation: slide-up 0.8s ease-out 0.7s both; }
        .animate-slide-up-stagger-2 { animation: slide-up 0.8s ease-out 0.9s both; }
        .animate-slide-up-stagger-3 { animation: slide-up 0.8s ease-out 1.1s both; }
        .animate-slide-up-stagger-4 { animation: slide-up 0.8s ease-out 1.3s both; }
        
        .animate-slide-in-left-stagger-1 { animation: slide-in-left 0.8s ease-out 0.8s both; }
        .animate-slide-in-left-stagger-2 { animation: slide-in-left 0.8s ease-out 1s both; }
        .animate-slide-in-left-stagger-3 { animation: slide-in-left 0.8s ease-out 1.2s both; }
        
        .animate-slide-in-right-stagger-1 { animation: slide-in-right 0.8s ease-out 1.4s both; }
        .animate-slide-in-right-stagger-2 { animation: slide-in-right 0.8s ease-out 1.6s both; }
      `}</style>
    </div>
  )
}

export default About
