"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import type { User } from "../types/User"
import Navbar from "./Navbar"
import API_BASE_URL from "../config/apiBaseUrl"

const Search = () => {
  const { token, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("none")
  const [profiles, setProfiles] = useState<User[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoriteProfiles, setFavoriteProfiles] = useState<User[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [loading, setLoading] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [showFavoritesLoading, setShowFavoritesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.scrollBehavior = "smooth"
    return () => {
      document.body.style.scrollBehavior = ""
    }
  }, [])

  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U"

  const isFavorited = (id: string) => favorites.includes(id)

  const toast = (msg: string, type: 'error' | 'success' = 'error') => {
    if (type === 'success') {
      setSuccess(msg)
      setError(null)
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setError(msg)
      setSuccess(null)
      const timer = setTimeout(() => {
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }

  // Load online users
  const fetchOnlineUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile/online`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to fetch online users")

      const response = await res.json()

      // Check if the response has the expected structure
      if (!response.success || !Array.isArray(response.users)) {
        console.error("Unexpected response format:", response)
        return []
      }

      // Extract just the IDs of online users
      return response.users.map((user: any) => user._id)
    } catch (err) {
      console.error("Error fetching online users:", err)
      toast("Failed to load online users")
      return []
    }
  }

  // Load profiles
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: "1",
      limit: "20",
    })

    try {
      // Get current user ID from token
      const currentUserId = user?._id
      const query = searchQuery

      // If online filter is selected, fetch online users first
      if (filterType === "online") {
        const res = await fetch(`${API_BASE_URL}/profile/online`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) throw new Error("Failed to fetch online users")
        const response = await res.json()
        if (!response.success || !Array.isArray(response.users)) {
          setProfiles([])
          setLoading(false)
          return
        }
        setProfiles(response.users)
        setLoading(false)
        return
      } else if (filterType === "name" && query) {
        params.append("name", query)
        params.append("searchType", "name")
      } else if (filterType === "campus" && query) {
        params.append("campus", query)
        params.append("searchType", "campus")
      }

      // Log the URL for debugging
      const url = `${API_BASE_URL}/auth/search-users?${params.toString()}`
      console.log("Fetching URL:", url)

      console.log("Filter type:", filterType)
      console.log("Query params:", Object.fromEntries(params.entries()))

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch profiles")
      const data = await res.json()
      console.log("API Response:", JSON.stringify(data, null, 2))

      // Process users and ensure isOnline is set correctly
      const processedUsers = (data.users || []).map((user: any) => {
        // Check both lastActive and lastSeen fields
        const lastActiveTime = user.lastActive || user.lastSeen
        const lastActive = lastActiveTime ? new Date(lastActiveTime).getTime() : 0
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        const isUserOnline = user.isOnline === true || lastActive > fiveMinutesAgo

        console.log("Processing user:", user._id, "isOnline:", isUserOnline, "lastActive:", lastActiveTime)

        return {
          ...user,
          isOnline: isUserOnline,
          lastActive: lastActiveTime || null,
          lastSeen: user.lastSeen || null,
        } as User
      })

      // Filter out the current user from the results
      const filteredUsers = processedUsers.filter((user: User) => {
        console.log("Processing user:", user._id, "isOnline:", user.isOnline, "Current user ID:", currentUserId)
        return user._id !== currentUserId
      })

      console.log("Filtered users:", filteredUsers)
      setProfiles(filteredUsers)
    } catch (err) {
      console.error(err)
      toast("Could not load profiles")
    } finally {
      setLoading(false)
    }
  }

  // Load favorites
  const fetchFavorites = async () => {
    if (!token) {
      setError("Please login to view favorites")
      return
    }
    setShowFavoritesLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch favorites")
      const data = await res.json()
      // Filter out the current user from favorites
      const currentUserId = user?._id
      const filteredFavorites = data.favorites.filter((favUser: User) => favUser._id !== currentUserId)
      setFavorites(filteredFavorites.map((u: User) => u._id))
      setFavoriteProfiles(filteredFavorites)
    } catch (err) {
      console.error(err)
      toast("Failed to fetch favorites")
    } finally {
      setShowFavoritesLoading(false)
    }
  }

  // Toggle favorites UI
  const toggleShowFavorites = () => {
    if (!showFavorites) fetchFavorites()
    setShowFavorites((prev) => !prev)
    setFilterType("none")
    setSearchQuery("")
  }

  // Handle filter type change
  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilterType = e.target.value
    setFilterType(newFilterType)
    setSearchQuery("")

    // If online filter is selected, we'll handle it in the fetchUsers function
    if (newFilterType === "online") {
      fetchUsers()
    }
  }

  // Toggle favorite status
  const toggleFavorite = async (id: string) => {
    if (!token) return toast("Login first")
    setFavoritesLoading(true)
    try {
      const method = isFavorited(id) ? "DELETE" : "POST"
      const url = `${API_BASE_URL}/auth/favorites/${isFavorited(id) ? "remove" : "add"}/${id}`
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to update favorite")
      if (isFavorited(id)) {
        setFavorites((prev) => prev.filter((x) => x !== id))
        setFavoriteProfiles((prev) => prev.filter((p) => p._id !== id))
        toast("Removed from favorites", "success")
      } else {
        const prof = profiles.find((p) => p._id === id)
        if (prof) setFavoriteProfiles((prev) => [...prev, prof])
        setFavorites((prev) => [...prev, id])
        toast("Added to favorites", "success")
      }
    } catch (err) {
      console.error(err)
      toast("Error updating favorite")
    } finally {
      setFavoritesLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setFilterType("none")
    fetchUsers()
  }

  // Load list when token changes
  useEffect(() => {
    fetchUsers()
    if (token) fetchFavorites()
  }, [token])

  // Debounce search/filter
  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery, filterType])

  // Filter profiles based on search query and type
  const filteredProfiles = (showFavorites ? favoriteProfiles : profiles).filter((profile) => {
    // For online filter, we trust the backend to return only online users
    if (filterType === "online") {
      // Just log that we're showing this user as they came from the online users endpoint
      console.log("Showing online user:", profile._id, "name:", profile.name)
      return true
    }

    // For other filter types, apply the search query if any
    if (searchQuery === "") return true

    const query = searchQuery.toLowerCase()
    const profileName = typeof profile.name === "string" ? profile.name.toLowerCase() : ""
    const profileCampus = typeof profile.campus === "string" ? profile.campus.toLowerCase() : ""
    const profileDept =
      typeof profile.department === "object" && profile.department?.name ? profile.department.name.toLowerCase() : ""
    const profileBatch = typeof profile.batch === "object" && profile.batch?.year ? profile.batch.year.toString() : ""

    if (filterType === "name") {
      return profileName.includes(query)
    } else if (filterType === "campus") {
      return profileCampus.includes(query)
    } else {
      // Search in all fields
      return (
        profileName.includes(query) ||
        profileCampus.includes(query) ||
        profileDept.includes(query) ||
        profileBatch.includes(query)
      )
    }
  })

  // Determine the display text based on the current filter
  const getDisplayText = () => {
    if (showFavorites) return `${favoriteProfiles.length} Favorites`
    if (filterType === "online") return `${filteredProfiles.length} Online Students`
    return `${filteredProfiles.length} Students Found`
  }

  useEffect(() => {
    if (filterType === "online") {
      const interval = setInterval(() => {
        fetchUsers()
      }, 10000) // 10 seconds
      return () => clearInterval(interval)
    }
  }, [filterType])

  return (
    <div className="min-h-screen bg-[#051622] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="8%" cy="15%" r="3.2" fill="#2dd4bf" opacity="0.1">
            <animate attributeName="cy" values="15%;85%;15%" dur="18s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0.25;0.1" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle cx="92%" cy="25%" r="2.5" fill="#34d399" opacity="0.15">
            <animate attributeName="cy" values="25%;8%;25%" dur="20s" repeatCount="indefinite" />
            <animate attributeName="cx" values="92%;87%;92%" dur="16s" repeatCount="indefinite" />
          </circle>
          <circle cx="45%" cy="92%" r="4.5" fill="#2dd4bf" opacity="0.08">
            <animate attributeName="cy" values="92%;28%;92%" dur="24s" repeatCount="indefinite" />
            <animate attributeName="r" values="4.5;7;4.5" dur="18s" repeatCount="indefinite" />
          </circle>
          <circle cx="75%" cy="12%" r="2.8" fill="#34d399" opacity="0.18">
            <animate attributeName="cy" values="12%;72%;12%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.18;0.35;0.18" dur="14s" repeatCount="indefinite" />
          </circle>
          <circle cx="18%" cy="68%" r="3.5" fill="#1BA098" opacity="0.12">
            <animate attributeName="cx" values="18%;25%;18%" dur="26s" repeatCount="indefinite" />
            <animate attributeName="cy" values="68%;22%;68%" dur="28s" repeatCount="indefinite" />
          </circle>
          <circle cx="68%" cy="5%" r="2.2" fill="#2dd4bf" opacity="0.2">
            <animate attributeName="cy" values="5%;58%;5%" dur="30s" repeatCount="indefinite" />
            <animate attributeName="r" values="2.2;4.2;2.2" dur="20s" repeatCount="indefinite" />
          </circle>
          <circle cx="32%" cy="38%" r="1.8" fill="#34d399" opacity="0.22">
            <animate attributeName="cx" values="32%;38%;32%" dur="32s" repeatCount="indefinite" />
            <animate attributeName="cy" values="38%;78%;38%" dur="34s" repeatCount="indefinite" />
          </circle>
          <circle cx="85%" cy="65%" r="3.8" fill="#1BA098" opacity="0.09">
            <animate attributeName="cx" values="85%;78%;85%" dur="36s" repeatCount="indefinite" />
            <animate attributeName="cy" values="65%;35%;65%" dur="38s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-2xl mb-8 shadow-2xl shadow-[#1BA098]/25 animate-float">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-slide-up" style={{ color: "#DEB992" }}>
            {showFavorites ? (
              <>
                My <span className="text-[#1BA098] animate-slide-up-delay">Favorites</span>
              </>
            ) : (
              <>
                Find <span className="text-[#1BA098] animate-slide-up-delay">Students</span>
              </>
            )}
          </h1>
          <p
            className="text-xl max-w-3xl mx-auto leading-relaxed animate-slide-up-delay-2"
            style={{ color: "#DEB992", opacity: 0.9 }}
          >
            {showFavorites
              ? "Your saved connections and favorite Fast University students"
              : "Connect with fellow Fast University students across all campuses. Search by name or filter by campus to find study partners and collaborators."}
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 animate-slide-up-stagger-1">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold" style={{ color: "#DEB992" }}>
              {getDisplayText()}
            </h2>
            <p className="mt-1" style={{ color: "#DEB992", opacity: 0.8 }}>
              {showFavorites
                ? "Your saved student connections"
                : filterType === "none"
                  ? "Showing all registered Fast University students"
                  : `Filtered by ${filterType}${searchQuery ? `: "${searchQuery}"` : ""}`}
            </p>
          </div>
          <button
            className="group relative px-8 py-3 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#1BA098]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            onClick={toggleShowFavorites}
            disabled={showFavoritesLoading}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#159084] to-[#1BA098] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center space-x-2">
              {showFavoritesLoading ? (
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
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showFavorites ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    )}
                  </svg>
                  <span>{showFavorites ? "Show All Students" : "Show My Favorites"}</span>
                  {!showFavorites && favorites.length > 0 && (
                    <span className="bg-white/20 text-[#051622] text-xs rounded-full px-2 py-1 ml-2 font-bold">
                      {favorites.length}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1BA098]/40 to-[#159084]/40 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Error Message */}
        {(error || success) && (
  <div className={`mb-8 p-4 backdrop-blur-sm border rounded-xl animate-slide-in ${
    error ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'
  }`}>
    <div className="flex items-center">
      {error ? (
        <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707a1 1 0 00-1.414-1.414L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span className={`text-sm font-medium ${error ? 'text-red-200' : 'text-green-200'}`}>{error || success}</span>
    </div>
  </div>
)}

        {/* Search Controls */}
        {!showFavorites && (
          <div className="bg-[#051622]/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#1BA098]/20 p-8 mb-12 animate-slide-up-stagger-2 hover:shadow-[#1BA098]/25 hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-[#1BA098]/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 border border-[#1BA098]/30">
                <svg className="w-5 h-5 text-[#1BA098]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0 4a2 2 0 100 4m0-4a2 2 0 110-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4a2 2 0 110-4m0 4a2 2 0 100 4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold" style={{ color: "#DEB992" }}>
                Search & Filter
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Filter Type Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: "#DEB992" }}>
                  Search Filter
                </label>
                <select
                  className="w-full px-4 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 hover:border-[#1BA098]/50"
                  value={filterType}
                  onChange={handleFilterTypeChange}
                >
                  <option value="none">Show All Students</option>
                  <option value="name">Search by Name</option>
                  <option value="campus">Filter by Campus</option>
                  <option value="online">Show Online Students</option>
                </select>
              </div>
              {/* Search Input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-3" style={{ color: "#DEB992" }}>
                  {filterType === "name" ? "Search by Name" : filterType === "campus" ? "Enter Campus Name" : "Search"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#1BA098]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    className="w-full pl-10 pr-12 py-3 bg-[#051622]/60 backdrop-blur-sm border border-[#1BA098]/30 rounded-xl text-[#DEB992] placeholder-[#DEB992]/50 focus:outline-none focus:ring-2 focus:ring-[#1BA098] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#1BA098]/50"
                    type="text"
                    value={searchQuery}
                    placeholder={
                      filterType === "name"
                        ? "Enter student name..."
                        : filterType === "campus"
                          ? "Enter campus name..."
                          : filterType === "online"
                            ? "No input needed for online filter"
                            : "Select a filter type to search..."
                    }
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={filterType === "none" || filterType === "online"}
                  />
                  {searchQuery && (
                    <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center group">
                      <div className="bg-[#1BA098]/20 hover:bg-[#1BA098]/30 backdrop-blur-sm rounded-full p-1 transition-colors duration-200 border border-[#1BA098]/30">
                        <svg
                          className="w-4 h-4 text-[#1BA098] group-hover:text-[#159084]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading and Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64 animate-fade-in">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1BA098]"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 animate-fade-in">{error}</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center animate-fade-in" style={{ color: "#DEB992", opacity: 0.8 }}>
            {filterType === "online" ? "No online students found" : "No students found"}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredProfiles.map((profile, index) => (
              <div
                key={profile._id}
                className="bg-[#051622]/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#1BA098]/20 p-6 hover:shadow-xl hover:shadow-[#1BA098]/25 transition-all duration-300 transform hover:scale-[1.02] animate-slide-up-stagger h-40 flex flex-col justify-between hover:border-[#1BA098]/40"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Profile Header */}
                <div className="flex items-center justify-between mb-4 flex-1">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-[#1BA098] to-[#159084] rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-110 shadow-lg">
                        <span className="text-white text-xl font-bold">{getInitials(profile.name)}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1BA098] rounded-full border-2 border-[#051622] animate-pulse-subtle"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate" style={{ color: "#DEB992" }}>
                        {profile.name || "Unknown"}
                      </h3>
                      <p className="text-sm truncate" style={{ color: "#DEB992", opacity: 0.8 }}>
                        Batch {profile.batch?.year || "N/A"}
                      </p>
                      <p className="text-xs flex items-center mt-1 truncate" style={{ color: "#DEB992", opacity: 0.6 }}>
                        <svg
                          className="w-3 h-3 mr-1 flex-shrink-0 text-[#1BA098]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                        <span className="truncate">{profile.campus || "Unknown Campus"}</span>
                      </p>
                    </div>
                  </div>
                  {/* Favorite Star */}
                  <button
                    onClick={() => toggleFavorite(profile._id)}
                    className="group p-2 text-[#DEB992]/40 hover:text-[#1BA098] transition-all duration-300 transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-[#1BA098]/30 rounded-full"
                    disabled={favoritesLoading}
                  >
                    <svg
                      className={`w-6 h-6 transition-all duration-300 ${
                        isFavorited(profile._id)
                          ? "text-[#1BA098] fill-current transform scale-110"
                          : "text-[#DEB992]/40 hover:text-[#1BA098] group-hover:scale-110"
                      }`}
                      fill={isFavorited(profile._id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363 1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                </div>
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] py-2 px-3 rounded-lg text-sm font-medium hover:from-[#159084] hover:to-[#1BA098] focus:outline-none focus:ring-2 focus:ring-[#1BA098]/30 focus:ring-offset-2 focus:ring-offset-[#051622] transition-all duration-200 flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-[#1BA098]/25">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Video
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-[#159084] to-[#1BA098] text-[#051622] py-2 px-3 rounded-lg text-sm font-medium hover:from-[#1BA098] hover:to-[#159084] focus:outline-none focus:ring-2 focus:ring-[#1BA098]/30 focus:ring-offset-2 focus:ring-offset-[#051622] transition-all duration-200 flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-[#1BA098]/25">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Voice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && (showFavorites ? favoriteProfiles.length === 0 : profiles.length === 0) && (
          <div className="text-center py-16 animate-fade-in-delay-1">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1BA098]/20 backdrop-blur-sm rounded-full mb-8 border border-[#1BA098]/30 animate-bounce-subtle">
              <svg className="w-10 h-10 text-[#1BA098]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showFavorites ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                )}
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: "#DEB992" }}>
              {showFavorites ? "No favorites yet" : "No students found"}
            </h3>
            <p className="mb-8 max-w-md mx-auto" style={{ color: "#DEB992", opacity: 0.8 }}>
              {showFavorites
                ? "Start adding students to your favorites by clicking the star icon on their profiles."
                : "Try adjusting your search criteria or browse all students by selecting 'Show All Students'."}
            </p>
            {!showFavorites && (
              <button
                onClick={clearSearch}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#1BA098] to-[#159084] text-[#051622] rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#1BA098]/30"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Show All Students
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#051622]/90 backdrop-blur-sm border-t border-[#1BA098]/20 mt-16 animate-fade-in-delay-2">
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
        .animate-slide-in { animation: slide-in 0.5s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 2.5s ease-in-out infinite; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        
        .animate-fade-in-delay-1 { animation: fade-in 0.8s ease-out 0.2s both; }
        .animate-fade-in-delay-2 { animation: fade-in 0.8s ease-out 0.4s both; }
        
        .animate-slide-up-delay { animation: slide-up 0.8s ease-out 0.3s both; }
        .animate-slide-up-delay-2 { animation: slide-up 0.8s ease-out 0.5s both; }
        
        .animate-slide-up-stagger-1 { animation: slide-up 0.8s ease-out 0.4s both; }
        .animate-slide-up-stagger-2 { animation: slide-up 0.8s ease-out 0.6s both; }
        .animate-slide-up-stagger { animation: slide-up 0.8s ease-out both; }
      `}</style>
    </div>
  )
}

export default Search
