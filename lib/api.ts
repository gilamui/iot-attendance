import { supabase } from "./supabase"
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  AttendanceLog,
} from "@/types/api"

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function login(payload: { username: string; password: string }) {
  const { data, error } = await supabase.rpc("authenticate_user", {
    p_username: payload.username,
    p_password: payload.password,
  })

  if (error) throw new Error("Invalid credentials")
  if (!data || data.length === 0) throw new Error("Invalid credentials")

  const user = {
    id: data[0].id,
    fullName: data[0].full_name,
    role: data[0].role,
    username: data[0].username,
    fingerprintId: data[0].fingerprint_id,
  }

  const json = JSON.stringify(user)
  localStorage.setItem("user", json)
  document.cookie = `user=${encodeURIComponent(json)}; path=/; max-age=86400; SameSite=Lax`
  return { user }
}

export function logout() {
  localStorage.removeItem("user")
  document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  window.location.href = "/login"
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data, error } = await supabase.rpc("create_user_with_password", {
    p_username: payload.username || `user_${Date.now()}`,
    p_password: "password123",
    p_full_name: payload.full_name,
    p_fingerprint_id: payload.fingerprint_id,
    p_role: payload.role,
    p_status: payload.status,
  })

  if (error) throw error

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", data)
    .single()

  return user!
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("id", id)
  if (error) throw error
}

export async function getAttendance(): Promise<AttendanceLog[]> {
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100)

  if (error) throw error

  const logs = data || []
  if (logs.length === 0) return logs

  const fpIds = [...new Set(logs.map((l) => l.fingerprint_id).filter(Boolean))]
  if (fpIds.length === 0) return logs

  const { data: users } = await supabase
    .from("users")
    .select("full_name, role, status, fingerprint_id")
    .in("fingerprint_id", fpIds)

  const userMap = new Map((users || []).map((u) => [u.fingerprint_id, u]))

  return logs.map((log) => ({
    ...log,
    user: userMap.get(log.fingerprint_id) || null,
  }))
}
