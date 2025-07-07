"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [otp, setOTP] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isRequestingOTP, setIsRequestingOTP] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [otpSent, setOTPSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const { forgotPassword, resetPassword } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Frontend validation for NU email
    if (!email || !email.trim().toLowerCase().endsWith('@nu.edu.pk')) {
      setError('Please enter a valid NU email address (e.g., yourname@nu.edu.pk)');
      return;
    }
    console.log('Submitting email:', email);

    setIsRequestingOTP(true)
    try {
      await forgotPassword(email)
      setOTPSent(true)
      setSuccess("OTP has been sent to your email. Please check your inbox.")
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred")
    } finally {
      setIsRequestingOTP(false)
    }
  }

  const handleResendOTP = async () => {
    setError("")
    setSuccess("")
    setIsRequestingOTP(true)
    try {
      await forgotPassword(email)
      setSuccess("OTP has been resent to your email.")
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred while resending OTP")
    } finally {
      setIsRequestingOTP(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Frontend validation for NU email
    if (!email || !email.trim().toLowerCase().endsWith('@nu.edu.pk')) {
      setError('Please enter a valid NU email address (e.g., yourname@nu.edu.pk)');
      return;
    }
    // OTP validation
    if (!otp || otp.length < 4) {
      setError('Please enter the OTP sent to your email.');
      return;
    }
    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.');
      return;
    }
    console.log('Reset payload:', { email, otp, newPassword });

    setIsResettingPassword(true)
    try {
      await resetPassword(email, otp, newPassword)
      setSuccess("Password has been successfully changed. Please login with your new password.")
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (err: any) {
      // Robust error handling for OTP and password reuse
      const rawMsg = err.response?.data?.message || "";
      const msg = rawMsg.toLowerCase();
      if (msg.includes("otp") || msg.includes("expired") || msg.includes("invalid")) {
        setError("The OTP you entered is incorrect or expired. Please try again or resend the OTP.");
      } else if (msg.includes("same as previous")) {
        setError("New password cannot be the same as your previous password.");
      } else if (rawMsg) {
        setError(rawMsg);
      } else {
        setError(err.response?.data?.message || "An error occurred");
      }
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#051622] overflow-hidden">
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
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-2 sm:px-4 md:px-6 flex flex-col items-center animate-fade-in">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-[#1BA098] rounded-full mb-3 sm:mb-4 shadow-lg animate-pulse-subtle">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2" style={{ color: "#DEB992" }}>
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: "#DEB992" }}>
            {otpSent ? "Enter OTP and set your new password" : "Enter your email to receive an OTP"}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-900/20 rounded-xl w-full animate-slide-in">
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
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/20 rounded-xl w-full animate-slide-in">
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
          {otpSent ? (
            /* Reset Password Form */
            <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6 w-full">
              <div className="space-y-4">
                {/* OTP Field */}
                <div className="animate-fade-in-delay-1">
                  <label
                    className="block text-lg font-medium mb-2 transition-all duration-300"
                    style={{ color: "#DEB992" }}
                  >
                    Verification Code (OTP)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOTP(e.target.value)}
                      className="w-full px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-3 lg:px-5 lg:py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm md:text-base lg:text-lg transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] pr-8 sm:pr-10 md:pr-12 lg:pr-14"
                      disabled={isResettingPassword}
                      maxLength={6}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* Resend OTP Link with Countdown */}
                  <div className="flex items-center mt-1">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isRequestingOTP}
                      onClick={handleResendOTP}
                      className="text-xs text-[#1BA098] font-semibold hover:underline disabled:opacity-50 bg-transparent border-none p-0 m-0"
                      style={{ cursor: resendCooldown > 0 ? "not-allowed" : "pointer" }}
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div className="animate-fade-in-delay-2">
                  <label
                    className="block text-lg font-medium mb-2 transition-all duration-300"
                    style={{ color: "#DEB992" }}
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-3 lg:px-5 lg:py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base md:text-lg lg:text-xl transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] pr-8 sm:pr-10 md:pr-12 lg:pr-14"
                      disabled={isResettingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isResettingPassword}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1BA098] transition-all duration-300 focus:outline-none focus:text-[#1BA098] disabled:opacity-50 hover:scale-110"
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
                </div>
              </div>

              <button
                type="submit"
                disabled={isResettingPassword}
                className="w-full bg-[#1BA098] text-[#051622] py-3 px-6 rounded-xl font-bold text-lg mt-2 hover:bg-[#159084] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg animate-fade-in-delay-3"
              >
                {isResettingPassword ? (
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
                    Resetting Password...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          ) : (
            /* Request OTP Form */
            <form onSubmit={handleRequestOTP} className="space-y-6 w-full">
              <div className="space-y-4">
                {/* Email Field */}
                <div className="animate-fade-in-delay-1">
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
                      placeholder="your.email@nu.edu.pk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] pr-10"
                      disabled={isRequestingOTP}
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
                </div>
              </div>

              <button
                type="submit"
                disabled={isRequestingOTP}
                className="w-full bg-[#1BA098] text-[#051622] py-3 px-6 rounded-xl font-bold text-lg mt-2 hover:bg-[#159084] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg animate-fade-in-delay-2"
              >
                {isRequestingOTP ? (
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
                    Sending OTP...
                  </div>
                ) : (
                  "Send OTP"
                )}
              </button>
             
            </form>
          )}

          {/* Back to Login Link */}
          <div className="text-center mt-6 animate-fade-in-delay-4">
            <Link
              to="/login"
              className="text-base font-semibold text-[#1BA098] hover:text-[#159084] transition-all duration-300 hover:scale-105 hover:underline"
            >
              ← Back to Login
            </Link>
          </div>

          {/* Bottom Text */}
          <div className="text-center mt-4 animate-fade-in-delay-5">
            <p className="text-xs transition-all duration-300" style={{ color: "#DEB992" }}>
              {otpSent
                ? "Check your email for the verification code"
                : "Secure password reset for Fast University students"}
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
        
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-down { animation: slide-down 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-slide-in { animation: slide-in 0.5s ease-out; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        .animate-fade-in-delay-1 { animation: fade-in 0.6s ease-out 0.1s both; }
        .animate-fade-in-delay-2 { animation: fade-in 0.6s ease-out 0.2s both; }
        .animate-fade-in-delay-3 { animation: fade-in 0.6s ease-out 0.3s both; }
        .animate-fade-in-delay-4 { animation: fade-in 0.6s ease-out 0.4s both; }
        .animate-fade-in-delay-5 { animation: fade-in 0.6s ease-out 0.5s both; }
      `}</style>
    </div>
  )
}

export default ForgotPassword
