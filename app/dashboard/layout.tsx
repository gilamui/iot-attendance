"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { logout, getStoredUser } from "@/lib/api"
import { MqttProvider } from "@/components/mqtt-provider"
import { useMqtt } from "@/components/mqtt-provider"
import { MqttSupabaseBridge } from "@/components/mqtt-supabase-bridge"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "dashboard", mobileIcon: "dashboard" },
  { href: "/dashboard/devices", label: "Devices", icon: "router", mobileIcon: "router" },
  { href: "/dashboard/history", label: "History", icon: "history", mobileIcon: "list_alt" },
  { href: "/dashboard/users", label: "Users", icon: "group", mobileIcon: "person" },
  { href: "/dashboard/logs", label: "Logs", icon: "security", mobileIcon: "shield" },
  { href: "/dashboard/mqtt", label: "MQTT", icon: "settings_input_component", mobileIcon: "settings_input_component" },
]

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/dashboard/devices", label: "Devices", icon: "router" },
  { href: "/dashboard/history", label: "History", icon: "list_alt" },
  { href: "/dashboard/users", label: "Users", icon: "person" },
  { href: "/dashboard/logs", label: "Security", icon: "shield" },
  { href: "/dashboard/mqtt", label: "MQTT", icon: "settings_input_component" },
]

function MqttStatusBadge() {
  const { connected } = useMqtt()
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
      connected
        ? "bg-secondary/20 border-secondary/30"
        : "bg-error/20 border-error/30"
    }`}>
      <div className={`w-2 h-2 rounded-full animate-pulse ${
        connected
          ? "bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]"
          : "bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]"
      }`} />
      <span className={`text-xs font-label-md ${
        connected ? "text-secondary" : "text-error"
      }`}>
        MQTT: {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const u = getStoredUser()
    if (!u) {
      router.push("/login")
      return
    }
    setUser(u)
  }, [router])

  function handleLogout() {
    logout()
  }

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href)
  }

  return (
    <MqttProvider>
      <MqttSupabaseBridge />
      <div className="min-h-screen bg-surface text-on-background">
        {/* Top Navigation Bar */}
        <nav className="bg-surface/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
          <div className="w-full max-w-[1440px] mx-auto hidden lg:grid lg:grid-cols-[auto_1fr_auto]">
            {/* Left: Branding */}
            <div className="flex items-center justify-center pl-8 pr-12 py-3 border-r border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/10 bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-on-surface leading-tight">IoT Access</span>
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-label-md">Admin Terminal</span>
                </div>
              </div>
            </div>

            {/* Middle: Navigation */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 py-3 overflow-x-auto no-scrollbar">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-5 h-11 rounded-xl transition-all shrink-0 ${
                        active
                          ? "text-primary font-semibold bg-primary/10"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {item.icon}
                      </span>
                      <span className="font-body-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right: MQTT Status + Logout */}
            <div className="flex items-center justify-center pr-6 pl-8 py-3 border-l border-white/5 gap-4">
              <MqttStatusBadge />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-all text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span className="font-body-sm">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Header */}
        <nav className="lg:hidden bg-surface/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg border border-white/10 bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
              </div>
              <span className="font-headline-sm text-on-surface">IoT Access</span>
            </div>
            <div className="flex items-center gap-3">
              <MqttStatusBadge />
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg border border-white/10 text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex flex-col min-h-[calc(100vh-7rem)]">
          <div className="p-6 md:p-8 lg:p-12 pb-28 lg:pb-12 w-full max-w-[1440px] mx-auto flex-1">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-lg border-t border-white/10 shadow-2xl z-50 flex justify-around items-center h-20 px-4 pb-safe">
          {mobileNavItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center rounded-2xl w-14 h-14 transition-all active:scale-90 ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-on-surface-variant hover:bg-white/5"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[30px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </MqttProvider>
  )
}
