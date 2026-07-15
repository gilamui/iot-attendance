"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUsers, getAttendance } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { timeAgo, getInitials } from "@/lib/utils"
import { useMqtt } from "@/components/mqtt-provider"
import type { AttendanceLog } from "@/types/api"
import dynamic from "next/dynamic"

const AttendanceChart = dynamic(
  () => import("@/components/attendance-chart").then((m) => m.AttendanceChart),
  { ssr: false }
)

function WhiteTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border border-white/20 px-3 py-2 text-xs shadow-xl"
      style={{ background: "rgba(15,23,42,0.9)", color: "#dae2fd", fontFamily: "Inter" }}
    >
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: "#dae2fd" }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

const DashboardPieChart = dynamic(
  () => import("recharts").then((m) => ({
    default: function Pie({ inCount, outCount }: { inCount: number; outCount: number }) {
      const data = [
        { name: "IN", value: inCount, fill: "#4edea3" },
        { name: "OUT", value: outCount, fill: "#a1887f" },
      ]
      if (inCount === 0 && outCount === 0) {
        return (
          <div className="flex items-center justify-center h-[140px] text-on-surface-variant font-body-xs">
            No scans today
          </div>
        )
      }
      return (
        <m.ResponsiveContainer width="100%" height={140}>
          <m.PieChart>
            <m.Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <m.Cell key={i} fill={entry.fill} />
              ))}
            </m.Pie>
            <m.Tooltip content={<WhiteTooltip />} />
          </m.PieChart>
        </m.ResponsiveContainer>
      )
    },
  })),
  { ssr: false }
)

const DashboardBarChart = dynamic(
  () => import("recharts").then((m) => ({
    default: function Bar({ thisWeek, lastWeek }: { thisWeek: number; lastWeek: number }) {
      const data = [
        { name: "Last Week", scans: lastWeek, fill: "rgba(255,255,255,0.12)" },
        { name: "This Week", scans: thisWeek, fill: "#c0c1ff" },
      ]
      return (
        <m.ResponsiveContainer width="100%" height={300}>
          <m.BarChart data={data} barCategoryGap="15%" barSize={60} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
            <m.CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <m.XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#c7c4d7", fontFamily: "Geist" }}
              tickLine={false}
              axisLine={false}
            />
            <m.YAxis hide domain={[0, "dataMax + 1"]} />
            <m.Bar dataKey="scans" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <m.Cell key={i} fill={entry.fill} />
              ))}
            </m.Bar>
            <m.Tooltip cursor={false} content={<WhiteTooltip />} />
          </m.BarChart>
        </m.ResponsiveContainer>
      )
    },
  })),
  { ssr: false }
)

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatUptime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
}

export default function DashboardPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const { connected, devices, publishCommand } = useMqtt()

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  })

  const { data: initialLogs, isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendance,
  })

  useEffect(() => {
    if (initialLogs) setLogs(initialLogs)
  }, [initialLogs])

  useEffect(() => {
    const channel = supabase
      .channel("attendance-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance_logs" },
        (payload) => {
          const newLog = payload.new as AttendanceLog
          setLogs((prev) => [newLog, ...prev].slice(0, 200))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const todayLogs = logs?.filter((l) => isToday(l.timestamp)) || []
  const scansIn = todayLogs.filter((l) => l.log_type === "CHECK_IN").length
  const scansOut = todayLogs.filter((l) => l.log_type === "CHECK_OUT").length

  const thisWeekStart = getStartOfWeek(new Date())
  const lastWeekStart = getStartOfWeek(
    new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  )
  const thisWeekLogs =
    logs?.filter((l) => new Date(l.timestamp) >= thisWeekStart) || []
  const lastWeekLogs =
    logs?.filter((l) => {
      const d = new Date(l.timestamp)
      return d >= lastWeekStart && d < thisWeekStart
    }) || []

  const weeklyChange = lastWeekLogs.length > 0
    ? Math.round(
        ((thisWeekLogs.length - lastWeekLogs.length) / lastWeekLogs.length) *
          100
      )
    : thisWeekLogs.length > 0
      ? 100
      : 0

  const topUser = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {}
    for (const log of thisWeekLogs) {
      const name =
        log.user?.full_name || `Fingerprint #${log.fingerprint_id}`
      const key = log.user?.full_name || `fp-${log.fingerprint_id}`
      if (!counts[key]) counts[key] = { name, count: 0 }
      counts[key].count++
    }
    return Object.values(counts).sort((a, b) => b.count - a.count)[0] || null
  }, [thisWeekLogs])

  const chartData = useMemo(() => {
    const hourMap = new Array(24).fill(0)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recent = (logs || []).filter(
      (l) => new Date(l.timestamp).getTime() >= sevenDaysAgo
    )
    for (const log of recent) {
      hourMap[new Date(log.timestamp).getHours()]++
    }
    return hourMap.map((count, hour) => ({
      label: `${hour.toString().padStart(2, "0")}:00`,
      scans: count,
    }))
  }, [logs])

  const recentLogs = logs?.slice(0, 5) || []
  const feedLogs = logs?.slice(0, 12) || []

  const deviceList = Object.entries(devices)

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-10 w-64 bg-surface-container rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-80 bg-surface-container rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-3 glass-card rounded-xl p-6 h-44 animate-pulse" />
          <div className="lg:col-span-5 glass-card rounded-xl p-6 h-44 animate-pulse" />
          <div className="lg:col-span-4 glass-card rounded-xl p-6 h-44 animate-pulse" />
          <div className="lg:col-span-7 glass-card rounded-xl p-6 h-72 animate-pulse" />
          <div className="lg:col-span-2 glass-card rounded-xl p-6 h-72 animate-pulse" />
          <div className="lg:col-span-3 glass-card rounded-xl p-6 h-72 animate-pulse" />
          <div className="lg:col-span-5 glass-card rounded-xl p-6 h-80 animate-pulse" />
          <div className="lg:col-span-3 glass-card rounded-xl p-6 h-80 animate-pulse" />
          <div className="lg:col-span-4 glass-card rounded-xl p-6 h-80 animate-pulse" />
          <div className="lg:col-span-12 glass-card rounded-xl p-6 h-64 animate-pulse" />
        </div>
      </div>
    )
  }

  const inPercent =
    todayLogs.length > 0 ? Math.round((scansIn / todayLogs.length) * 100) : 50

  return (
    <>
      <div className="pt-8 mb-10">
        <h1 className="font-display-lg text-display-lg text-on-surface lg:text-[48px] text-[32px] mb-2 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Real-time telemetry and access control analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* ===== ROW 1 ===== */}

        {/* Enrolled Users */}
        <div className="glass-card rounded-xl p-6 lg:col-span-3 flex flex-col justify-between group hover:border-primary/30 transition-colors relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Enrolled Users
              </p>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-primary">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  group
                </span>
              </div>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {users?.length?.toLocaleString() ?? 0}
            </h2>
          </div>
          <div className="flex items-center gap-2 relative z-10 mt-4">
            <span className="flex items-center text-secondary font-label-sm text-label-sm bg-secondary/10 px-2 py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px] mr-1">
                trending_up
              </span>
              Active
            </span>
            <span className="font-body-xs text-on-surface-variant">
              enrolled members
            </span>
          </div>
        </div>

        {/* Today's Scans */}
        <div
          className="glass-card rounded-xl p-6 lg:col-span-5 flex flex-col justify-between group hover:border-primary/30 transition-colors relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0.10) 100%)",
            borderColor: "rgba(99,102,241,0.25)",
          }}
        >
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Today&apos;s Scans
              </p>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-secondary">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  fingerprint
                </span>
              </div>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
              {todayLogs.length.toLocaleString()}
            </h2>
            <div className="flex justify-between text-sm mb-2 font-mono-sm text-on-surface-variant">
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-secondary mr-2" />
                IN ({scansIn})
              </span>
              <span>
                OUT ({scansOut})
                <span className="inline-block w-2 h-2 rounded-full bg-tertiary-container ml-2" />
              </span>
            </div>
            <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
              <div
                className="h-full bg-secondary transition-all duration-500"
                style={{ width: `${inPercent}%` }}
              />
              <div
                className="h-full bg-tertiary-container transition-all duration-500"
                style={{ width: `${100 - inPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Device Status */}
        <div className="glass-card rounded-xl p-6 lg:col-span-4 flex flex-col justify-between group hover:border-primary/30 transition-colors relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-tertiary/10 rounded-full blur-3xl group-hover:bg-tertiary/20 transition-all duration-500" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Device Status
              </p>
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-label-sm text-label-sm ${
                  deviceList.length === 0
                    ? "bg-white/5 border-white/10 text-on-surface-variant"
                    : deviceList.some(([, d]) => d.online)
                      ? "bg-secondary/10 border-secondary/20 text-secondary"
                      : "bg-error/10 border-error/20 text-error"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    deviceList.length === 0
                      ? "bg-on-surface-variant/50"
                      : deviceList.some(([, d]) => d.online)
                        ? "bg-secondary"
                        : "bg-error"
                  }`}
                />
                {deviceList.filter(([, d]) => d.online).length}/
                {deviceList.length || 0} Online
              </div>
            </div>

            {deviceList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40 mb-2">
                  router
                </span>
                <p className="font-body-sm text-on-surface-variant">
                  No devices connected
                </p>
                <p className="font-body-xs text-on-surface-variant/60 mt-1">
                  Power on your ESP32
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {deviceList.map(([id, device]) => (
                  <div
                    key={id}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${device.online ? "bg-secondary" : "bg-error"}`}
                        />
                        <span className="font-mono-sm text-on-surface">
                          {id}
                        </span>
                      </div>
                      <span
                        className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded ${
                          device.door === "unlocked"
                            ? "bg-secondary/15 text-secondary"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px] mr-0.5 align-[-3px]">
                          {device.door === "unlocked" ? "lock_open" : "lock"}
                        </span>
                        {device.door === "unlocked" ? "Unlocked" : "Locked"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-body-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          schedule
                        </span>
                        {formatUptime(device.uptime)}
                      </span>
                      {device.rssi != null && (
                        <span className="font-body-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            signal_cellular_alt
                          </span>
                          {device.rssi} dBm
                        </span>
                      )}
                    </div>

                    <button
                      disabled={!device.online || device.door === "unlocked"}
                      onClick={() =>
                        publishCommand(id, { action: "unlock" })
                      }
                      className={`w-full py-1.5 rounded-lg font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-all ${
                        device.online && device.door === "locked"
                          ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 active:scale-[0.97]"
                          : "bg-white/5 text-on-surface-variant/40 border border-white/5 cursor-not-allowed"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        lock_open
                      </span>
                      {device.door === "unlocked"
                        ? "Already Unlocked"
                        : device.online
                          ? "Unlock Door"
                          : "Offline"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== ROW 2 ===== */}

        {/* Peak Attendance Chart */}
        <div className="glass-card rounded-xl p-6 lg:col-span-7 glow-inner relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Peak Attendance
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Attendance trends over last week
              </p>
            </div>
          </div>
          <div className="h-[260px] w-full">
            {chartData.every((d) => d.scans === 0) ? (
              <div className="flex items-center justify-center h-full text-on-surface-variant">
                No data available yet
              </div>
            ) : (
              <AttendanceChart data={chartData} />
            )}
          </div>
        </div>

        {/* Check-in Ratio (Pie Chart) */}
        <div className="glass-card rounded-xl p-6 lg:col-span-2 flex flex-col items-center justify-center group hover:border-primary/30 transition-colors relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />
          <div className="relative z-10 text-center w-full">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
              IN / OUT
            </p>
            <DashboardPieChart inCount={scansIn} outCount={scansOut} />
            <div className="flex justify-center gap-4 text-xs mt-2">
              <span className="flex items-center gap-1.5 font-body-xs text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                In ({scansIn})
              </span>
              <span className="flex items-center gap-1.5 font-body-xs" style={{ color: "#a1887f" }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#a1887f" }} />
                Out ({scansOut})
              </span>
            </div>
          </div>
        </div>

        {/* Top User This Week */}
        <div className="glass-card rounded-xl p-6 lg:col-span-3 flex flex-col justify-between group hover:border-primary/30 transition-colors relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Top User
              </p>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-primary">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  emoji_events
                </span>
              </div>
            </div>
            {topUser ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {getInitials(topUser.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-body-sm text-on-surface font-medium truncate">
                    {topUser.name}
                  </p>
                  <p className="font-body-xs text-on-surface-variant">
                    {topUser.count} scans this week
                  </p>
                </div>
              </div>
            ) : (
              <p className="font-body-sm text-on-surface-variant">
                No scans this week
              </p>
            )}
          </div>
        </div>

        {/* ===== ROW 3 ===== */}

        {/* Live Activity Feed */}
        <div className="glass-card rounded-xl p-0 lg:col-span-5 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-surface/30">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Live Feed
              </h3>
            </div>
            <span className="font-body-xs text-on-surface-variant">
              {feedLogs.length} events
            </span>
          </div>
          <div className="overflow-y-auto max-h-[320px] divide-y divide-white/5">
            {feedLogs.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-body-sm">
                Waiting for scans...
              </div>
            ) : (
              feedLogs.map((log) => {
                const isIn = log.log_type === "CHECK_IN"
                const name =
                  log.user?.full_name || `Fingerprint #${log.fingerprint_id}`
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isIn
                          ? "bg-secondary/15 text-secondary"
                          : "bg-tertiary-container/15 text-tertiary-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isIn ? "login" : "logout"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-sm text-on-surface truncate">
                        {name}
                      </p>
                      <p className="font-body-xs text-on-surface-variant">
                        {timeAgo(log.timestamp)}
                      </p>
                    </div>
                    <span
                      className={`font-label-sm text-label-sm ${isIn ? "text-secondary" : "text-tertiary-container"}`}
                    >
                      {isIn ? "IN" : "OUT"}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-xl p-6 lg:col-span-3 flex flex-col justify-between group hover:border-primary/30 transition-colors relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-tertiary/10 rounded-full blur-3xl group-hover:bg-tertiary/20 transition-all duration-500" />
          <div className="relative z-10">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-4">
              Quick Actions
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard/users"
                className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group/btn"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    person_add
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-body-sm text-on-surface group-hover/btn:text-primary transition-colors">
                    Enroll User
                  </p>
                  <p className="font-body-xs text-on-surface-variant">
                    Add fingerprint
                  </p>
                </div>
              </Link>
              <Link
                href="/dashboard/history"
                className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group/btn"
              >
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    history
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-body-sm text-on-surface group-hover/btn:text-primary transition-colors">
                    View History
                  </p>
                  <p className="font-body-xs text-on-surface-variant">
                    Attendance logs
                  </p>
                </div>
              </Link>
              <Link
                href="/dashboard/mqtt"
                className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group/btn"
              >
                <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary shrink-0">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    settings_input_component
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-body-sm text-on-surface group-hover/btn:text-primary transition-colors">
                    MQTT Console
                  </p>
                  <p className="font-body-xs text-on-surface-variant">
                    Send commands
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Weekly Trend (Bar Chart) */}
        <div className="glass-card rounded-xl p-6 lg:col-span-4 group hover:border-primary/30 transition-colors relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Weekly Trend
              </p>
              <span
                className={`flex items-center gap-1 font-label-sm text-label-sm ${weeklyChange >= 0 ? "text-secondary" : "text-error"}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {weeklyChange >= 0 ? "trending_up" : "trending_down"}
                </span>
                {weeklyChange >= 0 ? "+" : ""}
                {weeklyChange}%
              </span>
            </div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-headline-md text-headline-md text-on-surface">
                {thisWeekLogs.length}
              </span>
              <span className="text-on-surface-variant/40 font-body-xs">vs</span>
              <span className="font-headline-md text-headline-md text-on-surface-variant">
                {lastWeekLogs.length}
              </span>
              <span className="font-body-xs text-on-surface-variant">scans</span>
            </div>
          </div>
          <div>
            <DashboardBarChart thisWeek={thisWeekLogs.length} lastWeek={lastWeekLogs.length} />
          </div>
        </div>

        {/* ===== ROW 4 ===== */}

        {/* Recent Scans Table */}
        <div className="glass-card rounded-xl p-0 lg:col-span-12 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface/30">
            <div className="flex items-center gap-3">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Recent Scans
              </h3>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
              </span>
            </div>
            <button
              onClick={() => router.push("/dashboard/history")}
              className="text-primary hover:text-primary-fixed transition-colors text-sm font-label-md"
            >
              View All Logs
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 bg-surface/20">
                  <th className="p-4 font-label-md text-xs text-on-surface-variant tracking-wider">
                    Employee
                  </th>
                  <th className="p-4 font-label-md text-xs text-on-surface-variant tracking-wider">
                    Status
                  </th>
                  <th className="p-4 font-label-md text-xs text-on-surface-variant tracking-wider">
                    Device
                  </th>
                  <th className="p-4 font-label-md text-xs text-on-surface-variant tracking-wider">
                    Confidence
                  </th>
                  <th className="p-4 font-label-md text-xs text-on-surface-variant tracking-wider text-right">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-body-sm">
                {recentLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-on-surface-variant"
                    >
                      No recent scans
                    </td>
                  </tr>
                ) : (
                  recentLogs.map((log) => {
                    const isIn = log.log_type === "CHECK_IN"
                    const name =
                      log.user?.full_name ||
                      `Fingerprint #${log.fingerprint_id}`
                    const initials = log.user?.full_name
                      ? getInitials(log.user.full_name)
                      : `#${log.fingerprint_id}`
                    const confidence = log.confidence ?? 0

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="p-4 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-surface-container-high border border-white/10 overflow-hidden flex items-center justify-center text-on-surface-variant font-semibold text-xs">
                            {initials}
                          </div>
                          <span className="text-on-surface font-medium">
                            {name}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${isIn ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20"}`}
                          >
                            <span className="material-symbols-outlined text-[14px] mr-1">
                              {isIn ? "login" : "logout"}
                            </span>
                            {isIn ? "IN" : "OUT"}
                          </span>
                        </td>
                        <td className="p-4 text-on-surface-variant font-mono-sm">
                          {log.device_id}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono-sm ${confidence >= 60 ? "text-secondary" : "text-error"}`}
                            >
                              {confidence}%
                            </span>
                            <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div
                                className={`h-full ${confidence >= 60 ? "bg-secondary" : "bg-error"}`}
                                style={{ width: `${confidence}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right text-on-surface-variant text-sm">
                          {timeAgo(log.timestamp)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
