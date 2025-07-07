export interface User {
  _id: string
  name: string
  email: string
  campus: string
  batch: {
    year: string
  }
  department: {
    name: string
  }
  isVerified: boolean
  lastActive: string | null
  lastSeen?: string | null  // Added optional lastSeen field
  isOnline: boolean
  avatar?: string
}
