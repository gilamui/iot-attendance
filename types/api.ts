export interface User {
  id: string
  username: string | null
  full_name: string
  role: "ADMIN" | "EMPLOYEE"
  status: "ACTIVE" | "SUSPENDED"
  fingerprint_id: number | null
  created_at: string
}

export interface CreateUserPayload {
  username?: string
  password?: string
  full_name: string
  fingerprint_id: number | null
  role: "ADMIN" | "EMPLOYEE"
  status: "ACTIVE" | "SUSPENDED"
}

export interface UpdateUserPayload {
  full_name?: string
  fingerprint_id?: number | null
  role?: "ADMIN" | "EMPLOYEE"
  status?: "ACTIVE" | "SUSPENDED"
}

export type LogType = "CHECK_IN" | "CHECK_OUT"

export interface AttendanceLog {
  id: string
  fingerprint_id: number
  device_id: string
  confidence: number
  log_type: LogType
  timestamp: string
  user?: {
    full_name: string
    role: string
    status: string
    fingerprint_id: number | null
  } | null
}
