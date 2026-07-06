"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Fingerprint, Loader2, Shield, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { login } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login({ username, password })
      if (res.user.role !== "ADMIN") {
        toast.error("Access Denied: Admin privileges required")
        return
      }
      toast.success("Welcome back, " + res.user.fullName)
      router.push("/dashboard")
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid credentials"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-grid animate-drift" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/0 via-indigo-950/20 to-slate-950/0" />

      {/* Floating gradient orbs */}
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-cyan-500/8 blur-[100px]" />

      <div className="relative w-full max-w-md px-4">
        {/* Logo + Badge */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
            <Fingerprint className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            IoT Attendance
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Admin access control panel
          </p>
        </div>

        {/* Glass Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-300">
                Username
              </label>
              <Input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="h-11 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-300">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/40 transition-all"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500 hover:shadow-indigo-500/30 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Fingerprint className="h-3 w-3" />
            <span>Secure fingerprint authentication</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          IoT Fingerprint Attendance System &middot; v1.0
        </p>
      </div>
    </div>
  )
}
