"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { Link, useNavigate } from "react-router-dom"

const Register = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [campus, setCampus] = useState("")
  const [batch, setBatch] = useState("")
  const [otp, setOTP] = useState("")
  const [otpSent, setOTPSent] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSendingOTP, setIsSendingOTP] = useState(false) // New state for OTP sending
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  })
  const [showRequirements, setShowRequirements] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    otp: "",
    name: "",
    campus: "",
    batch: "",
    password: "",
  })

  const { sendOTP, verifyAndRegister } = useAuth()
  const navigate = useNavigate()

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
    setPasswordRequirements(requirements)
    return Object.values(requirements).every((req) => req)
  }

  const validateEmail = (email: string) => {
    if (!email.trim()) return "Email is required"
    if (!email.endsWith("@nu.edu.pk") && !email.endsWith("@isb.nu.edu.pk")) {
      return "Only @nu.edu.pk or @isb.nu.edu.pk email addresses are allowed"
    }
    return ""
  }

  const validateOTP = (otp: string) => {
    if (!otp.trim()) return "Verification code is required"
    if (otp.length !== 6) return "Verification code must be 6 digits"
    if (!/^\d{6}$/.test(otp)) return "Verification code must contain only numbers"
    return ""
  }

  const validateName = (name: string) => {
    if (!name.trim()) return "Full name is required"
    if (name.trim().length < 2) return "Name must be at least 2 characters"
    return ""
  }

  const validateCampus = (campus: string) => {
    if (!campus.trim()) return "Please select your campus"
    const validCampuses = ["Islamabad", "Karachi", "Lahore", "Peshawar", "Multan", "Faisalabad"]
    if (!validCampuses.includes(campus)) return "Please select a valid campus"
    return ""
  }

  const validateBatch = (batch: string) => {
    if (!batch.trim()) return "Batch year is required"
    if (!/^\d{4}$/.test(batch)) return "Please enter a valid 4-digit year"
    return ""
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpSent, resendTimer])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Client-side validation
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }

    if (!email.endsWith("@nu.edu.pk") && !email.endsWith("@isb.nu.edu.pk")) {
      setError("Only @nu.edu.pk or @isb.nu.edu.pk email addresses are allowed.")
      return
    }

    setIsSendingOTP(true)

    try {
      await sendOTP(email)
      setOTPSent(true)
      setSuccess("Verification code sent to your email!")
      setResendTimer(60) // Changed back to 60 seconds
      setCanResend(false)
      setTimeout(() => setSuccess(""), 2000)
    } catch (err: any) {
      // Handle specific error cases
      const errorMessage = err.response?.data?.message || err.message || "An error occurred"

      if (errorMessage.toLowerCase().includes("already exists")) {
        setError("This email is already registered. Please try logging in instead.")
      } else if (errorMessage.toLowerCase().includes("invalid email")) {
        setError("Please enter a valid university email address.")
      } else if (errorMessage.toLowerCase().includes("network")) {
        setError("Network error. Please check your connection and try again.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsSendingOTP(false)
    }
  }

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Client-side validation
    if (!email.trim()) {
      setError("Email is required.")
      return
    }

    if (!otp.trim()) {
      setError("Please enter the verification code.")
      return
    }

    if (otp.length !== 6) {
      setError("Verification code must be 6 digits.")
      return
    }

    if (!name.trim()) {
      setError("Please enter your full name.")
      return
    }

    if (!campus.trim()) {
      setError("Please enter your campus.")
      return
    }

    if (!batch.trim()) {
      setError("Please enter your batch year.")
      return
    }

    if (!password.trim()) {
      setError("Please enter a password.")
      return
    }

    // Password validation
    if (!Object.values(passwordRequirements).every((req) => req)) {
      const missingRequirements = []
      if (!passwordRequirements.length) missingRequirements.push("at least 8 characters")
      if (!passwordRequirements.uppercase) missingRequirements.push("one uppercase letter")
      if (!passwordRequirements.number) missingRequirements.push("one number")
      if (!passwordRequirements.special) missingRequirements.push("one special character")

      setError(`Password must contain ${missingRequirements.join(", ")}.`)
      return
    }

    if (!email.endsWith("@isb.nu.edu.pk") && !email.endsWith("@nu.edu.pk")) {
      setError("Only @isb.nu.edu.pk or @nu.edu.pk email addresses are allowed.")
      return
    }

    setIsRegistering(true)

    try {
      await verifyAndRegister(email, otp, password, name, campus, batch)
      setSuccess("Registration successful! Redirecting to login...")
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (err: any) {
      // Handle specific error cases
      const errorMessage = err.response?.data?.message || err.message || "An error occurred"

      if (errorMessage.toLowerCase().includes("invalid") && errorMessage.toLowerCase().includes("otp")) {
        setError("Invalid verification code. Please check and try again.")
      } else if (errorMessage.toLowerCase().includes("expired") && errorMessage.toLowerCase().includes("otp")) {
        setError("Verification code has expired. Please request a new one.")
      } else if (errorMessage.toLowerCase().includes("already exists")) {
        setError("This email is already registered. Please try logging in instead.")
      } else if (errorMessage.toLowerCase().includes("password")) {
        setError("Password does not meet security requirements.")
      } else if (errorMessage.toLowerCase().includes("network")) {
        setError("Network error. Please check your connection and try again.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsRegistering(false)
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)
    setError("")
    setSuccess("")

    try {
      await sendOTP(email)
      setResendTimer(60) // Changed back to 60 seconds
      setCanResend(false)
      setSuccess("Verification code resent successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to resend OTP"

      if (errorMessage.toLowerCase().includes("rate limit")) {
        setError("Too many requests. Please wait before requesting another code.")
      } else if (errorMessage.toLowerCase().includes("network")) {
        setError("Network error. Please check your connection and try again.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#051622] overflow-hidden px-4 py-8">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="10%" cy="20%" r="2" fill="#2dd4bf" opacity="0.3">
            <animate attributeName="cy" values="20%;80%;20%" dur="8s" repeatCount="indefinite" />
          </circle>
          <circle cx="80%" cy="60%" r="1.5" fill="#34d399" opacity="0.25">
            <animate attributeName="cy" values="60%;10%;60%" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle cx="50%" cy="90%" r="2.5" fill="#2dd4bf" opacity="0.18">
            <animate attributeName="cy" values="90%;30%;90%" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle cx="70%" cy="30%" r="1.2" fill="#34d399" opacity="0.30">
            <animate attributeName="cy" values="30%;70%;30%" dur="9s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-xl px-2 sm:px-4 flex flex-col items-center animate-fade-in">
        {/* Header Section */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1BA098] rounded-full mb-4 shadow-lg animate-pulse-subtle">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "#DEB992" }}>
            Join FASTConnect
          </h1>
          <p className="text-xs" style={{ color: "#DEB992" }}>
            {otpSent ? "Complete your registration" : "Connect with your fellow Fast University students"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6 animate-fade-in-delay-1">
          <div className="flex items-center space-x-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                !otpSent ? "bg-[#1BA098] text-[#051622] scale-110" : "bg-[#1BA098]/30 text-[#DEB992]"
              }`}
            >
              1
            </div>
            <div className={`w-12 h-0.5 transition-all duration-500 ${otpSent ? "bg-[#1BA098]" : "bg-gray-600"}`}></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                otpSent ? "bg-[#1BA098] text-[#051622] scale-110" : "bg-gray-600 text-gray-400"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Loading Bar for OTP Sending */}
        {isSendingOTP && (
          <div className="mb-6 w-full animate-slide-in">
            <div className="bg-[#1BA098]/20 backdrop-blur-sm rounded-xl p-4 border border-[#1BA098]/30">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="animate-spin h-5 w-5 text-[#1BA098]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[#1BA098] text-sm font-medium">Sending verification code...</p>
                  <div className="w-full bg-[#051622]/40 rounded-full h-2 mt-2">
                    <div className="bg-gradient-to-r from-[#1BA098] to-[#159084] h-2 rounded-full animate-pulse-width"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-900/20 rounded-xl w-full animate-slide-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-emerald-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-emerald-200 text-sm font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 rounded-xl w-full animate-slide-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-200 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="w-full animate-slide-up">
          <form className="space-y-6">
            {!otpSent ? (
              /* Step 1: Email Verification */
              <>
                <div className="text-center mb-6 animate-fade-in-delay-2">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: "#DEB992" }}>
                    Get Started
                  </h2>
                  <p className="text-sm" style={{ color: "#DEB992", opacity: 0.8 }}>
                    Enter your university email to receive verification code
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="animate-fade-in-delay-3">
                    <label
                      className="block text-lg font-medium mb-2 transition-all duration-300"
                      style={{ color: "#DEB992" }}
                    >
                      University Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] pr-10"
                        placeholder="your.email@nu.edu.pk"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSendingOTP}
                        onBlur={(e) => {
                          const emailError = validateEmail(e.target.value)
                          setFieldErrors((prev) => ({ ...prev, email: emailError }))
                        }}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                    </div>
                    {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
                  </div>
                  <button
                    type="submit"
                    onClick={handleSendOTP}
                    disabled={isSendingOTP}
                    className="w-full bg-[#1BA098] text-[#051622] py-3 px-6 rounded-xl font-bold text-lg mt-2 hover:bg-[#159084] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg animate-fade-in-delay-4"
                  >
                    {isSendingOTP ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#051622]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending Code...
                      </div>
                    ) : (
                      "Send Verification Code"
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Complete Registration */
              <>
                <div className="text-center mb-6 animate-fade-in-delay-2">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: "#DEB992" }}>
                    Complete Registration
                  </h2>
                  <p className="text-sm" style={{ color: "#DEB992", opacity: 0.8 }}>
                    Check your email and enter the verification code
                  </p>
                </div>
                <div className="space-y-4">
                  {/* Email Field (Disabled) */}
                  <div className="animate-fade-in-delay-3">
                    <label
                      className="block text-lg font-medium mb-2 transition-all duration-300"
                      style={{ color: "#DEB992" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      disabled
                      className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-gray-200 border border-gray-300 rounded-xl text-gray-600 cursor-not-allowed text-xs sm:text-sm"
                      value={email}
                    />
                  </div>
                  {/* OTP Field */}
                  <div className="animate-fade-in-delay-4">
                    <label
                      className="block text-lg font-medium mb-2 transition-all duration-300"
                      style={{ color: "#DEB992" }}
                    >
                      Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOTP(e.target.value)}
                      className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] text-center text-lg font-mono tracking-widest"
                      maxLength={6}
                      onBlur={(e) => {
                        const otpError = validateOTP(e.target.value)
                        setFieldErrors((prev) => ({ ...prev, otp: otpError }))
                      }}
                    />
                    {fieldErrors.otp && <p className="mt-1 text-xs text-red-400">{fieldErrors.otp}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm" style={{ color: "#DEB992", opacity: 0.8 }}>
                        Didn't receive the code?
                      </div>
                      <div className="text-sm">
                        {canResend ? (
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={isResending}
                            className="font-medium text-[#1BA098] hover:text-[#159084] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                          >
                            {isResending ? (
                              <div className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-1 h-3 w-3"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Sending...
                              </div>
                            ) : (
                              "Resend Code"
                            )}
                          </button>
                        ) : (
                          <span style={{ color: "#DEB992", opacity: 0.6 }}>Resend in {resendTimer}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Name and Campus Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-delay-5">
                    <div>
                      <label
                        className="block text-lg font-medium mb-2 transition-all duration-300"
                        style={{ color: "#DEB992" }}
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02]"
                        onBlur={(e) => {
                          const nameError = validateName(e.target.value)
                          setFieldErrors((prev) => ({ ...prev, name: nameError }))
                        }}
                      />
                      {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
                    </div>
                    <div>
                      <label
                        className="block text-lg font-medium mb-2 transition-all duration-300"
                        style={{ color: "#DEB992" }}
                      >
                        Campus
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={campus}
                          onChange={(e) => setCampus(e.target.value)}
                          className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] appearance-none pr-10"
                          onBlur={(e) => {
                            const campusError = validateCampus(e.target.value)
                            setFieldErrors((prev) => ({ ...prev, campus: campusError }))
                          }}
                        >
                          <option value="" disabled className="text-gray-500">
                            Select your campus
                          </option>
                          <option value="Islamabad" className="text-gray-900">
                            Islamabad
                          </option>
                          <option value="Karachi" className="text-gray-900">
                            Karachi
                          </option>
                          <option value="Lahore" className="text-gray-900">
                            Lahore
                          </option>
                          <option value="Peshawar" className="text-gray-900">
                            Peshawar
                          </option>
                          <option value="Multan" className="text-gray-900">
                            Multan
                          </option>
                          <option value="Faisalabad" className="text-gray-900">
                            Faisalabad
                          </option>
                        </select>
                        {/* Custom dropdown arrow */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {fieldErrors.campus && <p className="mt-1 text-xs text-red-400">{fieldErrors.campus}</p>}
                    </div>
                  </div>
                  {/* Batch and Password Row */}
                  <div className="space-y-4 animate-fade-in-delay-6">
                    <div>
                      <label
                        className="block text-lg font-medium mb-2 transition-all duration-300"
                        style={{ color: "#DEB992" }}
                      >
                        Batch
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="2024"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02]"
                        onBlur={(e) => {
                          const batchError = validateBatch(e.target.value)
                          setFieldErrors((prev) => ({ ...prev, batch: batchError }))
                        }}
                      />
                      {fieldErrors.batch && <p className="mt-1 text-xs text-red-400">{fieldErrors.batch}</p>}
                    </div>
                    <div>
                      <label
                        className="block text-lg font-medium mb-2 transition-all duration-300"
                        style={{ color: "#DEB992" }}
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            validatePassword(e.target.value)
                          }}
                          onFocus={() => setShowRequirements(true)}
                          onBlur={() => {
                            setShowRequirements(false)
                            setFieldErrors((prev) => ({ ...prev, password: "" }))
                          }}
                          className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base sm:text-lg transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1BA098] transition-all duration-300 focus:outline-none focus:text-[#1BA098] hover:scale-110"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      {/* Password Requirements Display */}
                      {showRequirements && (
                        <div className="mt-2 p-3 bg-[#051622]/40 backdrop-blur-sm rounded-lg border border-[#1BA098]/20 animate-slide-in">
                          <p className="text-xs font-medium text-[#DEB992] mb-2">Password must contain:</p>
                          <div className="space-y-1">
                            <div
                              className={`flex items-center space-x-2 text-xs ${passwordRequirements.length ? "text-green-400" : "text-[#DEB992]/60"}`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${passwordRequirements.length ? "bg-green-400" : "bg-gray-500"}`}
                              ></div>
                              <span>At least 8 characters</span>
                            </div>
                            <div
                              className={`flex items-center space-x-2 text-xs ${passwordRequirements.uppercase ? "text-green-400" : "text-[#DEB992]/60"}`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${passwordRequirements.uppercase ? "bg-green-400" : "bg-gray-500"}`}
                              ></div>
                              <span>One uppercase letter (A-Z)</span>
                            </div>
                            <div
                              className={`flex items-center space-x-2 text-xs ${passwordRequirements.number ? "text-green-400" : "text-[#DEB992]/60"}`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${passwordRequirements.number ? "bg-green-400" : "bg-gray-500"}`}
                              ></div>
                              <span>One number (0-9)</span>
                            </div>
                            <div
                              className={`flex items-center space-x-2 text-xs ${passwordRequirements.special ? "text-green-400" : "text-[#DEB992]/60"}`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${passwordRequirements.special ? "bg-green-400" : "bg-gray-500"}`}
                              ></div>
                              <span>One special character (!@#$%^&*)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    onClick={handleVerifyAndRegister}
                    disabled={isRegistering || !Object.values(passwordRequirements).every((req) => req)}
                    className="w-full bg-[#1BA098] text-[#051622] py-3 px-6 rounded-xl font-bold text-lg mt-2 hover:bg-[#159084] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg animate-fade-in-delay-7"
                  >
                    {isRegistering ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-6 w-6 text-[#051622]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
          {/* Footer */}
          <div className="text-center mt-6 animate-fade-in-delay-8">
            <p className="text-sm" style={{ color: "#DEB992" }}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-[#1BA098] hover:text-[#159084] transition-all duration-300 hover:scale-105 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
          {/* Bottom Text */}
          <div className="text-center mt-4 animate-fade-in-delay-9">
            <p className="text-xs transition-all duration-300" style={{ color: "#DEB992", opacity: 0.8 }}>
              By registering, you agree to connect only with verified Fast University students
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes pulse-width {
          0%, 100% { width: 20%; }
          50% { width: 80%; }
        }
        
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-down { animation: slide-down 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-slide-in { animation: slide-in 0.5s ease-out; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        .animate-pulse-width { animation: pulse-width 2s ease-in-out infinite; }
        .animate-fade-in-delay-1 { animation: fade-in 0.6s ease-out 0.1s both; }
        .animate-fade-in-delay-2 { animation: fade-in 0.6s ease-out 0.2s both; }
        .animate-fade-in-delay-3 { animation: fade-in 0.6s ease-out 0.3s both; }
        .animate-fade-in-delay-4 { animation: fade-in 0.6s ease-out 0.4s both; }
        .animate-fade-in-delay-5 { animation: fade-in 0.6s ease-out 0.5s both; }
        .animate-fade-in-delay-6 { animation: fade-in 0.6s ease-out 0.6s both; }
        .animate-fade-in-delay-7 { animation: fade-in 0.6s ease-out 0.7s both; }
        .animate-fade-in-delay-8 { animation: fade-in 0.6s ease-out 0.8s both; }
        .animate-fade-in-delay-9 { animation: fade-in 0.6s ease-out 0.9s both; }
      `}</style>
    </div>
  )
}

export default Register
