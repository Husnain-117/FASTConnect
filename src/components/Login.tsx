"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Link, useNavigate } from "react-router-dom"
// MUI imports
import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import IconButton from "@mui/material/IconButton"
import EmailIcon from "@mui/icons-material/Email"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [campus, setCampus] = useState("")
  const { login, userId, user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!email.endsWith("@nu.edu.pk") && !email.endsWith("@isb.nu.edu.pk")) {
      setError("Only @nu.edu.pk or @isb.nu.edu.pk email addresses are allowed.");
      return;
    }
    setIsLoading(true)
    try {
      await login(email, password)
      setSuccess("Login successful! Redirecting to Home...")
      setTimeout(() => {
        navigate("/home")
      }, 1000)
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred")
    } finally {
      setIsLoading(false)
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
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md px-2 sm:px-0 flex flex-col items-center animate-fade-in">
        {/* Header Section */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1BA098] rounded-full mb-4 shadow-lg animate-pulse-subtle">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "#DEB992" }}>
            FASTConnect
          </h1>
          <p className="text-xs" style={{ color: "#DEB992" }}>
            Sign in to FASTConnect
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-900/20 rounded-xl animate-slide-in">
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
          <div className="mb-6 p-4 bg-red-900/20 rounded-xl animate-slide-in">
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

        <form onSubmit={handleSubmit} className="space-y-6 w-full animate-slide-up">
          <div className="space-y-4">
            {/* Email Field with Fixed Label Position */}
            <div className="animate-fade-in-delay-1">
              <label
                className="block text-lg font-medium mb-2 transition-all duration-300"
                style={{ color: "#DEB992" }}
              >
                University Email
              </label>
              <TextField
                variant="outlined"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@nu.edu.pk"
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <EmailIcon sx={{ color: "#1BA098", transition: "all 0.3s ease" }} />
                    </InputAdornment>
                  ),
                  style: {
                    background: "#f9fafb",
                    borderRadius: 12,
                    transition: "all 0.3s ease",
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#374151",
                      transition: "all 0.3s ease",
                    },
                    "&:hover fieldset": {
                      borderColor: "#1BA098",
                      transform: "scale(1.02)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#1BA098",
                      borderWidth: "2px",
                      transform: "scale(1.02)",
                    },
                  },
                }}
              />
            </div>

            {/* Password Field with Fixed Label Position */}
            <div className="animate-fade-in-delay-2">
              <label
                className="block text-lg font-medium mb-2 transition-all duration-300"
                style={{ color: "#DEB992" }}
              >
                Password
              </label>
              <TextField
                variant="outlined"
                fullWidth
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
                        sx={{
                          color: "#1BA098",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "rgba(27, 160, 152, 0.1)",
                            transform: "scale(1.1)",
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  style: {
                    background: "#f9fafb",
                    borderRadius: 12,
                    transition: "all 0.3s ease",
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#374151",
                      transition: "all 0.3s ease",
                    },
                    "&:hover fieldset": {
                      borderColor: "#1BA098",
                      transform: "scale(1.02)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#1BA098",
                      borderWidth: "2px",
                      transform: "scale(1.02)",
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between py-3 animate-fade-in-delay-3">
            <div className="flex items-center space-x-3">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="h-5 w-5 text-[#1BA098] focus:ring-[#1BA098] border-gray-300 rounded disabled:opacity-50 transition-all duration-300 hover:scale-110"
              />
              <label
                htmlFor="remember-me"
                className="text-base font-medium transition-all duration-300 hover:text-[#1BA098] cursor-pointer"
                style={{ color: "#DEB992" }}
              >
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-base font-semibold transition-all duration-300 hover:scale-105 hover:underline"
              style={{ color: "#1BA098" }}
            >
              Forgot Password
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1BA098] text-[#051622] py-3 px-6 rounded-xl font-bold text-lg mt-2 hover:bg-[#159084] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg animate-fade-in-delay-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-6 w-6 text-[#051622]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-4 w-full animate-fade-in-delay-5">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#051622] text-gray-400 transition-all duration-300">New to Fast Connect?</span>
            </div>
          </div>
        </div>

        {/* Register Link */}
        <div className="mt-3 w-full animate-fade-in-delay-6">
          <Link
            to="/register"
            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{ color: "#051622", backgroundColor: "#1BA098" }}
          >
            Create your account
          </Link>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-3 animate-fade-in-delay-7">
          <p className="text-xs transition-all duration-300" style={{ color: "#DEB992" }}>
            Secure login for Fast University students only
          </p>
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
        .animate-fade-in-delay-6 { animation: fade-in 0.6s ease-out 0.6s both; }
        .animate-fade-in-delay-7 { animation: fade-in 0.6s ease-out 0.7s both; }
      `}</style>
    </div>
  )
}

export default Login
