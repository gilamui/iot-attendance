import axios from "axios"
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
  CreateUserPayload,
  UpdateUserPayload,
  AttendanceLog,
  MockScanPayload,
} from "@/types/api"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearAuth()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

function setCookie(name: string, value: string, days: number = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function setAuthToken(token: string) {
  localStorage.setItem("access_token", token)
  setCookie("access_token", token)
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token")
  }
  return null
}

export function clearAuth() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("user")
  removeCookie("access_token")
}

export function setStoredUser(user: any) {
  localStorage.setItem("user", JSON.stringify(user))
}

export function getStoredUser(): any | null {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("user")
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    }
  }
  return null
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload)
  setAuthToken(data.access_token)
  setStoredUser(data.user)
  return data
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/register", payload)
  return data
}

export async function getUsers(): Promise<User[]> {
  const res = await api.get("/users")
  return res.data.data
}

export async function getUser(id: string): Promise<User> {
  const res = await api.get(`/users/${id}`)
  return res.data.data
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await api.post("/users", payload)
  return res.data.data
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const res = await api.patch(`/users/${id}`, payload)
  return res.data.data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}

export async function getAttendance(): Promise<AttendanceLog[]> {
  const { data } = await api.get<AttendanceLog[]>("/attendance")
  return data
}

export async function unlockDoor(deviceId: string): Promise<void> {
  await api.post(`/attendance/door/unlock/${deviceId}`)
}

export async function mockScan(payload: MockScanPayload): Promise<AttendanceLog> {
  const { data } = await api.post<AttendanceLog>("/attendance/mock-scan", payload)
  return data
}
