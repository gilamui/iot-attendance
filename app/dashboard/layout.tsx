"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  History,
  Users,
  Shield,
  Radio,
  LogOut,
  Fingerprint,
  ChevronDown,
  Clock,
  Wifi,
} from "lucide-react"
import { clearAuth, getStoredUser } from "@/lib/api"
import { MqttProvider } from "@/components/mqtt-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/history", label: "Sensor History", icon: History },
  { href: "/dashboard/users", label: "Users & Fingerprints", icon: Users },
  { href: "/dashboard/logs", label: "Security Logs", icon: Shield },
  { href: "/dashboard/mqtt", label: "MQTT Telemetry", icon: Radio },
]

function LiveClock() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) return <span className="text-sm text-slate-400 font-mono tabular-nums">--:--</span>

  return (
    <span className="text-sm text-slate-400 font-mono tabular-nums" suppressHydrationWarning>
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const u = getStoredUser()
    if (!u) {
      router.push("/login")
      return
    }
    setUser(u)
  }, [router])

  function handleLogout() {
    clearAuth()
    router.push("/login")
  }

  const displayName = user?.fullName || user?.username || "Admin"
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-white/[0.06] bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
            <Fingerprint className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight">IoT Access</span>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Fingerprint System</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-indigo-500/10 text-indigo-300 shadow-sm border border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-indigo-400" : ""}`} />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-2 rounded-xl hover:bg-white/[0.04] text-slate-300"
              >
                <Avatar className="h-8 w-8 ring-2 ring-indigo-500/20">
                  <AvatarFallback className="text-xs bg-indigo-500/10 text-indigo-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left text-sm">
                  <p className="font-medium text-slate-200">{displayName}</p>
                  <p className="text-xs text-slate-500">{user?.username || ""}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-white/[0.06] bg-slate-900/95 backdrop-blur-xl text-slate-300"
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between border-b border-white/[0.06] bg-slate-900/40 backdrop-blur-xl px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Wifi className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">System Online</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <Badge
              variant="outline"
              className="gap-1.5 text-[10px] font-normal border-white/[0.06] text-slate-400 px-2 py-0.5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              All systems nominal
            </Badge>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between border-b border-white/[0.06] px-4 py-3 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Fingerprint className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">IoT Access</span>
          </div>
          <div className="flex items-center gap-2">
            <LiveClock />
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-xl px-4 py-3">
            <div className="grid grid-cols-4 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition-all ${
                      active
                        ? "bg-indigo-500/10 text-indigo-300"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <MqttProvider>{children}</MqttProvider>
          </div>
        </div>
      </main>
    </div>
  )
}