export interface User {
  id: string
  username: string | null
  fullName: string
  role: "ADMIN" | "EMPLOYEE"
  status: "ACTIVE" | "SUSPENDED"
  fingerprintId: number | null
  createdAt: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: {
    id: string
    fullName: string
    role: string
    username?: string
    fingerprintId?: number | null
  }
}

export interface RegisterPayload {
  username: string
  password: string
  fullName: string
  role: "ADMIN" | "EMPLOYEE"
  fingerprintId?: number
}

export interface CreateUserPayload {
  fingerprint_id: number
  full_name: string
  role: "ADMIN" | "EMPLOYEE"
  status: "ACTIVE" | "SUSPENDED"
}

export interface UpdateUserPayload {
  fingerprint_id?: number
  full_name?: string
  role?: "ADMIN" | "EMPLOYEE"
  status?: "ACTIVE" | "SUSPENDED"
}

export type LogType = "CHECK_IN" | "CHECK_OUT"

export interface AttendanceLog {
  id: string
  user: {
    fullName: string
    role: string
    status: string
    fingerprintId: number | null
  } | null
  fingerprintId: number
  deviceId: string
  confidence: number
  logType: LogType
  timestamp: string
}

export interface DoorUnlockPayload {
  duration: number
}

export interface MockScanPayload {
  device_id: string
  fingerprint_id: number
  confidence: number
  log_type: LogType
}
