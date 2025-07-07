"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Cropper from "react-easy-crop"
// @ts-ignore
import getCroppedImg from "../utils/cropImage"
import Navbar from "./Navbar"
import API_BASE_URL from "../config/apiBaseUrl"

interface ProfileProps {
  user: { _id: string; name: string; email: string /* ...other fields */ }
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const { userId } = useParams<{ userId: string }>()
  const { logout, userId: authUserId } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    campus: "",
    batch: "",
    gender: "",
    age: "",
    aboutMe: "",
    nickname: "",
    profilePhoto: "",
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileExists, setProfileExists] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [showCropper, setShowCropper] = useState<boolean>(false)
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined)

  const fetchProfile = async () => {
    if (!userId) return
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (res.status === 404) {
        setProfileExists(false)
        setShowForm(false)
        return
      }
      const data = await res.json()
      if (res.ok) {
        if (data.message === "Profile not set yet") {
          setProfileExists(false)
          setShowForm(false)
          setError("")
          return
        }
        setForm({
          name: data.name || "",
          campus: data.campus || "",
          batch: data.batch || "",
          gender: data.gender || "",
          age: data.age ? String(data.age) : "",
          aboutMe: data.aboutMe || "",
          nickname: data.nickname || "",
          profilePhoto: data.profilePhoto || "",
        })
        if (data.profilePhoto) setPhotoPreview(data.profilePhoto)
        setProfileExists(true)
        setShowForm(false)
      }
    } catch (err) {
      setError("Failed to load profile data")
      setProfileExists(false)
      setShowForm(false)
    }
  }

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile()
  }, [userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
        setForm({ ...form, profilePhoto: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")
    setLoading(true)
    try {
      const method = profileExists ? "PUT" : "POST"
      const res = await fetch(`${API_BASE_URL}/profile/${userId}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...form,
          age: form.age ? Number(form.age) : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(profileExists ? "Profile updated successfully!" : "Profile created successfully!")
        setIsEditing(false)
        setProfileExists(true)
        setShowForm(false)
        // Re-fetch profile after creation
        if (!profileExists) {
          await fetchProfile()
        }
        // Show the message on the profile card after closing the form
        setTimeout(() => setMessage(""), 3000)
      } else {
        setError(data.message || (profileExists ? "Error updating profile" : "Error creating profile"))
      }
    } catch (err) {
      setError(profileExists ? "Error updating profile" : "Error creating profile")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Handler for deleting profile
  const handleDelete = async () => {
    if (!userId) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        navigate("/login")
      } else {
        setError(data.message || "Error deleting profile")
      }
    } catch (err) {
      setError("Error deleting profile")
    } finally {
      setLoading(false)
    }
  }

  // Handler for showing the create profile form
  const handleShowCreate = () => {
    setShowForm(true)
    setError("")
    setMessage("")
    setIsEditing(true)
  }

  // Add this handler for uploading a profile photo
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(URL.createObjectURL(file))
      setShowCropper(true)
    }
  }

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const onCropAndUpload = async () => {
    if (!selectedImage || !croppedAreaPixels || !userId) return
    const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels)
    const formData = new FormData()
    formData.append("profilePhoto", croppedBlob, "cropped.jpg")
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${userId}/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setPhotoPreview(data.profilePhoto)
        setForm((prev) => ({ ...prev, profilePhoto: data.profilePhoto }))
        setMessage("Profile photo updated!")
        // Immediately re-fetch the profile to reflect changes
        await fetchProfile()
      } else {
        setError(data.message || "Error uploading photo")
      }
    } catch (err) {
      setError("Error uploading photo")
    }
    setShowCropper(false)
    setSelectedImage(undefined)
  }

  return (
    <div className="min-h-screen bg-[#051622] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="12%" cy="18%" r="3.5" fill="#2dd4bf" opacity="0.12">
            <animate attributeName="cy" values="18%;78%;18%" dur="16s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.12;0.28;0.12" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle cx="88%" cy="35%" r="2.8" fill="#34d399" opacity="0.15">
            <animate attributeName="cy" values="35%;12%;35%" dur="18s" repeatCount="indefinite" />
            <animate attributeName="cx" values="88%;82%;88%" dur="14s" repeatCount="indefinite" />
          </circle>
          <circle cx="42%" cy="88%" r="4.2" fill="#2dd4bf" opacity="0.08">
            <animate attributeName="cy" values="88%;32%;88%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="r" values="4.2;6.5;4.2" dur="16s" repeatCount="indefinite" />
          </circle>
          <circle cx="78%" cy="15%" r="2.2" fill="#34d399" opacity="0.2">
            <animate attributeName="cy" values="15%;68%;15%" dur="20s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.38;0.2" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle cx="22%" cy="65%" r="3.8" fill="#1BA098" opacity="0.1">
            <animate attributeName="cx" values="22%;28%;22%" dur="24s" repeatCount="indefinite" />
            <animate attributeName="cy" values="65%;25%;65%" dur="26s" repeatCount="indefinite" />
          </circle>
          <circle cx="65%" cy="8%" r="2.5" fill="#2dd4bf" opacity="0.18">
            <animate attributeName="cy" values="8%;55%;8%" dur="28s" repeatCount="indefinite" />
            <animate attributeName="r" values="2.5;4;2.5" dur="18s" repeatCount="indefinite" />
          </circle>
          <circle cx="35%" cy="45%" r="1.8" fill="#34d399" opacity="0.25">
            <animate attributeName="cx" values="35%;40%;35%" dur="30s" repeatCount="indefinite" />
            <animate attributeName="cy" values="45%;75%;45%" dur="32s" repeatCount="indefinite" />
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 animate-slide-up" style={{ color: "#DEB992" }}>
            My <span className="text-[#1BA098] animate-slide-up-delay">Profile</span>
          </h1>
          <p
            className="text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed animate-slide-up-delay-2"
            style={{ color: "#DEB992", opacity: 0.9 }}
          >
            Manage your profile information and connect with fellow Fast University students. Keep your details updated
            to help others find and connect with you.
          </p>
        </div>

        {/* Show message or profile */}
        {!profileExists && !showForm && (
          <div className="text-center mb-8 animate-fade-in-delay-1">
            <div className="bg-[#051622]/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#1BA098]/20 p-6 sm:p-8 md:p-12 mb-6 sm:mb-8 hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full mb-6 shadow-lg animate-bounce-subtle">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: "#DEB992" }}>
                  Complete Your Profile
                </h3>
                <p className="mb-8 max-w-md mx-auto" style={{ color: "#DEB992", opacity: 0.8 }}>
                  Set up your profile to connect with fellow Fast University students and make meaningful academic
                  connections.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success message on profile card */}
        {message && !showForm && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-r from-[#1BA098]/20 to-[#159084]/20 backdrop-blur-sm border-2 border-[#1BA098]/30 rounded-2xl text-center transform transition-all duration-500 animate-slide-in shadow-lg hover:shadow-[#1BA098]/25">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-[#1BA098] rounded-full flex items-center justify-center animate-pulse-subtle">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-[#1BA098] font-bold text-xl">{message}</p>
          </div>
        )}

        {profileExists && !showForm && (
          <div className="bg-[#051622]/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#1BA098]/20 overflow-hidden mb-6 sm:mb-8 transform transition-all duration-500 hover:shadow-[#1BA098]/25 hover:shadow-2xl animate-fade-in-delay-1 hover:scale-105">
            <div className="bg-gradient-to-r from-[#1BA098] to-[#159084] px-8 py-12">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-2xl shadow-[#1BA098]/25 overflow-hidden bg-white mb-3 sm:mb-4 transform transition-all duration-300 group-hover:scale-105 animate-float">
                    {photoPreview || form.profilePhoto ? (
                      <img
                        src={
                          form.profilePhoto
                            ? form.profilePhoto.startsWith("http")
                              ? form.profilePhoto
                              : `${API_BASE_URL.replace(/\/api$/, "")}${form.profilePhoto}`
                            : "/placeholder.svg"
                        }
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#1BA098] to-[#159084] flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">{getInitials(form.name || "")}</span>
                      </div>
                    )}
                    {/* Enhanced pencil icon for changing photo */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 group border-2 border-[#1BA098]/20 hover:border-[#1BA098]/40"
                      title="Change Photo"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5 text-[#1BA098] group-hover:text-[#159084] transition-colors duration-300"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 13.362-13.303z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-center text-white space-y-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 animate-slide-up">{form.name || "Your Name"}</h2>
                  {form.nickname && (
                    <p className="text-[#DEB992]/80 text-lg mb-1 animate-slide-up-delay-1">"{form.nickname}"</p>
                  )}
                  <p className="text-[#DEB992]/80 mb-4 animate-slide-up-delay-2">{user?.email}</p>
                  <div className="flex flex-wrap justify-center gap-3 text-sm animate-slide-up-delay-3">
                    {form.campus && (
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/10">
                        <span>📍</span>
                        <span>{form.campus}</span>
                      </span>
                    )}
                    {form.batch && (
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/10">
                        <span>🎓</span>
                        <span>Batch {form.batch}</span>
                      </span>
                    )}
                    {form.age && (
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/10">
                        <span>🎂</span>
                        <span>{form.age} years</span>
                      </span>
                    )}
                    {form.gender && (
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/10">
                        <span>{form.gender === "male" ? "👨" : form.gender === "female" ? "👩" : "👤"}</span>
                        <span className="capitalize">{form.gender}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* About Me Section */}
            {form.aboutMe && (
              <div className="px-8 py-6 bg-[#1BA098]/10 backdrop-blur-sm border-t border-[#1BA098]/20">
                <h3 className="text-lg font-semibold mb-3 flex items-center" style={{ color: "#DEB992" }}>
                  <svg className="w-5 h-5 mr-2 text-[#1BA098]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  About Me
                </h3>
                <p className="leading-relaxed" style={{ color: "#DEB992", opacity: 0.9 }}>
                  {form.aboutMe}
                </p>
              </div>
            )}
          </div>
        )}

        {profileExists && !showForm && (
          <div className="flex justify-center gap-4 mb-8 animate-fade-in-delay-2">
            <button
              onClick={() => {
                setShowForm(true)
                setIsEditing(true)
              }}
              className="group relative px-8 py-3 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#1BA098]/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#159084] to-[#1BA098] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5 transform group-hover:rotate-12 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit Profile</span>
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1BA098]/40 to-[#159084]/40 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="group relative px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>{loading ? "Deleting..." : "Delete Profile"}</span>
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-red-400 to-red-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </button>
          </div>
        )}

        {/* Show form if creating or editing */}
        {showForm && (
          <div className="bg-[#051622]/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#1BA098]/20 overflow-hidden mb-8 animate-slide-up hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500">
            {/* Enhanced Form Header */}
            <div className="bg-gradient-to-r from-[#1BA098] to-[#159084] px-8 py-12">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-2 animate-slide-down">
                  {profileExists ? "Edit Profile" : "Create Profile"}
                </h2>
                <p className="text-[#DEB992]/80 text-lg animate-slide-down-delay">
                  {profileExists ? "Update your information" : "Complete your profile setup"}
                </p>
              </div>
            </div>
            <div className="p-8">
              {/* Success/Error Messages */}
              {message && (
                <div className="mb-6 p-4 bg-[#1BA098]/20 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl animate-slide-in">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#1BA098] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-[#1BA098] text-sm font-medium">{message}</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-xl animate-slide-in">
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
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="animate-slide-up-stagger-1">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-[#1BA098]/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 border border-[#1BA098]/30">
                      <svg className="w-5 h-5 text-[#1BA098]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold" style={{ color: "#DEB992" }}>
                      Basic Information
                    </h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: "#DEB992" }}>
                        Campus
                      </label>
                      <select
                        name="campus"
                        value={form.campus}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#1BA098]/50"
                      >
                        <option value="">Select Campus</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Peshawar">Peshawar</option>
                        <option value="Multan">Multan</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Chiniot-Faisalabad">Chiniot-Faisalabad</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: "#DEB992" }}>
                        Batch
                      </label>
                      <select
                        name="batch"
                        value={form.batch}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#1BA098]/50"
                      >
                        <option value="">Select Batch</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                        <option value="2019">2019</option>
                        <option value="2018">2018</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: "#DEB992" }}>
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#1BA098]/50"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: "#DEB992" }}>
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={handleChange}
                        disabled={!isEditing}
                        min="16"
                        max="100"
                        className="w-full px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] placeholder-[#DEB992]/50 focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#1BA098]/50"
                        placeholder="Enter your age"
                      />
                    </div>
                  </div>
                </div>
                {/* Personal Information */}
                <div className="animate-slide-up-stagger-2">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-[#159084]/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 border border-[#159084]/30">
                      <svg className="w-5 h-5 text-[#159084]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold" style={{ color: "#DEB992" }}>
                      Personal Information
                    </h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: "#DEB992" }}>
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] placeholder-[#DEB992]/50 focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#1BA098]/50"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: "#DEB992" }}>
                        Nickname
                      </label>
                      <input
                        type="text"
                        name="nickname"
                        value={form.nickname}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] placeholder-[#DEB992]/50 focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#1BA098]/50"
                        placeholder="What do your friends call you?"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: "#DEB992" }}>
                        About Me
                      </label>
                      <textarea
                        name="aboutMe"
                        value={form.aboutMe}
                        onChange={handleChange}
                        disabled={!isEditing}
                        rows={4}
                        className="w-full px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] placeholder-[#DEB992]/50 focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none hover:border-[#1BA098]/50"
                        placeholder="Tell others about yourself, your interests, and what you're studying..."
                      />
                    </div>
                  </div>
                </div>
                {/* Enhanced Submit Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 border-t border-[#1BA098]/20 animate-slide-up-stagger-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="group relative px-8 py-3 border-2 border-[#DEB992]/30 rounded-xl text-sm font-semibold bg-[#051622]/60 backdrop-blur-sm hover:bg-[#051622]/80 hover:border-[#DEB992]/50 focus:outline-none focus:ring-4 focus:ring-[#DEB992]/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                    style={{ color: "#DEB992" }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel</span>
                    </div>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative px-8 py-3 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#1BA098]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#159084] to-[#1BA098] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
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
                          <span>{profileExists ? "Updating..." : "Creating..."}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{profileExists ? "Update Profile" : "Create Profile"}</span>
                        </>
                      )}
                    </div>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1BA098]/40 to-[#159084]/40 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Always show Create and Delete buttons */}
        <div className="flex justify-center gap-4 mt-8">
          {!profileExists && !showForm && (
            <button
              onClick={handleShowCreate}
              className="group relative px-10 py-4 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-[#1BA098]/30 overflow-hidden animate-bounce-subtle"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#159084] to-[#1BA098] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <svg
                  className="w-6 h-6 transform group-hover:rotate-12 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Profile</span>
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1BA098]/40 to-[#159084]/40 blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
            </button>
          )}
        </div>

        {/* Add this input for uploading a profile photo */}
        <input type="file" accept="image/*" ref={fileInputRef} onChange={onSelectFile} className="hidden" />

        {/* Enhanced modal for cropping */}
        {showCropper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#051622]/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl relative w-[95vw] max-w-lg h-[500px] flex flex-col overflow-visible animate-slide-up border border-[#1BA098]/30">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2" style={{ color: "#DEB992" }}>
                  Crop Your Photo
                </h3>
                <p className="text-sm" style={{ color: "#DEB992", opacity: 0.8 }}>
                  Adjust your profile photo to fit perfectly
                </p>
              </div>
              <div className="relative flex-1 min-h-[300px] bg-[#051622]/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#1BA098]/20">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowCropper(false)
                    setSelectedImage(undefined)
                  }}
                  className="px-6 py-3 border-2 border-[#DEB992]/30 rounded-xl text-sm font-semibold bg-[#051622]/60 backdrop-blur-sm hover:bg-[#051622]/80 hover:border-[#DEB992]/50 focus:outline-none focus:ring-4 focus:ring-[#DEB992]/20 transition-all duration-300 transform hover:scale-105"
                  style={{ color: "#DEB992" }}
                >
                  Cancel
                </button>
                <button
                  onClick={onCropAndUpload}
                  className="px-6 py-3 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#1BA098]/30"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#051622]/90 backdrop-blur-sm border-t border-[#1BA098]/20 mt-16 animate-fade-in-delay-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm" style={{ color: "#DEB992", opacity: 0.7 }}>
            <p>&copy; 2024 FASTConnect. Exclusively for Fast University Students. All rights reserved.</p>
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
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out; }
        .animate-slide-down { animation: slide-down 0.8s ease-out; }
        .animate-slide-in { animation: slide-in 0.5s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 2.5s ease-in-out infinite; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        
        .animate-fade-in-delay-1 { animation: fade-in 0.8s ease-out 0.2s both; }
        .animate-fade-in-delay-2 { animation: fade-in 0.8s ease-out 0.4s both; }
        .animate-fade-in-delay-3 { animation: fade-in 0.8s ease-out 0.6s both; }
        
        .animate-slide-up-delay { animation: slide-up 0.8s ease-out 0.3s both; }
        .animate-slide-up-delay-2 { animation: slide-up 0.8s ease-out 0.5s both; }
        .animate-slide-up-delay-3 { animation: slide-up 0.8s ease-out 0.7s both; }
        
        .animate-slide-down-delay { animation: slide-down 0.8s ease-out 0.3s both; }
        
        .animate-slide-up-stagger-1 { animation: slide-up 0.8s ease-out 0.4s both; }
        .animate-slide-up-stagger-2 { animation: slide-up 0.8s ease-out 0.6s both; }
        .animate-slide-up-stagger-3 { animation: slide-up 0.8s ease-out 0.8s both; }
      `}</style>
    </div>
  )
}

export default Profile
