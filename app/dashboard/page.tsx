"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Users,
  Fingerprint,
  Unlock,
  BugPlay,
  Radio,
  Clock,
  Loader2,
  ChevronRight,
  Activity,
  Wifi,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { getUsers, getAttendance, unlockDoor, mockScan } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { AttendanceLog } from "@/types/api"

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function timeAgo(timestamp: string) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      <div className="col-span-1 md:col-span-2 row-span-1">
        <Skeleton className="h-48 w-full rounded-2xl bg-white/[0.04]" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl bg-white/[0.04]" />
      <Skeleton className="h-48 w-full rounded-2xl bg-white/[0.04]" />
      <div className="col-span-1 md:col-span-3 lg:col-span-2 row-span-2">
        <Skeleton className="h-80 w-full rounded-2xl bg-white/[0.04]" />
      </div>
      <div className="col-span-1 md:col-span-3 lg:col-span-2 row-span-2">
        <Skeleton className="h-80 w-full rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  })

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendance,
    refetchInterval: 10000,
  })

  const unlockMutation = useMutation({
    mutationFn: () => unlockDoor("office-01"),
    onSuccess: () => toast.success("Door unlock command sent to office-01 (5s)"),
    onError: () => toast.error("Failed to send unlock command"),
  })

  const mockMutation = useMutation({
    mutationFn: () =>
      mockScan({
        device_id: "office-01",
        fingerprint_id: 1,
        confidence: 95,
        log_type: "CHECK_IN",
      }),
    onSuccess: (data) => {
      const label = data.logType === "CHECK_IN" ? "IN" : "OUT"
      toast.success(`Mock scan registered: ${label} at ${data.deviceId}`)
    },
    onError: () => toast.error("Failed to simulate scan"),
  })

  const todayLogs = logs?.filter((l) => isToday(l.timestamp)) || []
  const scansIn = todayLogs.filter((l) => l.logType === "CHECK_IN").length
  const scansOut = todayLogs.filter((l) => l.logType === "CHECK_OUT").length
  const deviceIds = Array.from(new Set(logs?.map((l) => l.deviceId) || []))
  const recentLogs = logs?.slice(0, 5) || []

  const chartData = (() => {
    const hourMap = new Array(24).fill(0)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recent = (logs || []).filter((l) => new Date(l.timestamp).getTime() >= sevenDaysAgo)
    for (const log of recent) {
      hourMap[new Date(log.timestamp).getHours()]++
    }
    return hourMap.map((count, hour) => ({
      label: `${hour.toString().padStart(2, "0")}:00`,
      scans: count,
    }))
  })()

  const isLoading = usersLoading && logsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time attendance monitor</p>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time attendance monitor</p>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 text-xs font-normal border-emerald-500/20 text-emerald-300 bg-emerald-500/5"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          </span>
          All systems nominal
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Box 1: Command Center */}
        <div className="col-span-1 md:col-span-2 row-span-1 rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-lg shadow-black/20 transition-all duration-300 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Command Center
            </h2>
            <Badge
              variant="outline"
              className="gap-1.5 text-[10px] font-normal border-emerald-500/20 text-emerald-300 bg-emerald-500/5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              MQTT Gateway Online
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="flex-1 min-w-[180px] gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-600/25 hover:from-rose-500 hover:to-rose-600 transition-all duration-200"
              disabled={unlockMutation.isPending}
              onClick={() => unlockMutation.mutate()}
            >
              {unlockMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              Door Unlock
            </Button>
            <Button
              size="lg"
              className="flex-1 min-w-[140px] gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500 transition-all duration-200"
              disabled={mockMutation.isPending}
              onClick={() => mockMutation.mutate()}
            >
              {mockMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BugPlay className="h-4 w-4" />
              )}
              Test Scan
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-cyan-400" />
              {deviceIds.length} gateway{deviceIds.length !== 1 ? "s" : ""} active
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-indigo-400" />
              {todayLogs.length} scans today
            </span>
          </div>
        </div>

        {/* Box 2: Total Users KPI */}
        <div className="col-span-1 row-span-1 rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-lg shadow-black/20 transition-all duration-300 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Users
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5">
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">
            {users?.length ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Enrolled fingerprints
          </p>
        </div>

        {/* Box 3: Today's Scans KPI */}
        <div className="col-span-1 row-span-1 rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-lg shadow-black/20 transition-all duration-300 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Scans
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <Fingerprint className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">
            {todayLogs.length}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <Badge variant="success" className="text-[10px] px-1.5 py-0">
              {scansIn} IN
            </Badge>
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
              {scansOut} OUT
            </Badge>
          </div>
        </div>

        {/* Box 4: Visual Analytics */}
        <div className="col-span-1 md:col-span-3 lg:col-span-2 row-span-2 rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-lg shadow-black/20 transition-all duration-300 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Peak Attendance Hours
            </h2>
            <span className="text-[11px] text-slate-500">Last 7 days</span>
          </div>
          {chartData.every((d) => d.scans === 0) ? (
            <div className="flex items-center justify-center h-64 text-sm text-slate-500">
              No data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    color: "#f1f5f9",
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4, color: "#e2e8f0" }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#818cf8", stroke: "#0f172a", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Box 5: Live Activity Feed */}
        <div className="col-span-1 md:col-span-3 lg:col-span-2 row-span-2 rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-lg shadow-black/20 transition-all duration-300 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Live Activity Feed
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live Polling (10s)
            </div>
          </div>
          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-slate-500">
                No recent scans
              </div>
            ) : (
              recentLogs.map((log, i) => (
                <div
                  key={log.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all duration-200 hover:border-indigo-500/20 hover:bg-indigo-500/[0.03] hover:shadow-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-xs font-semibold text-indigo-300">
                    {log.user?.fullName ? getInitials(log.user.fullName) : `#${log.fingerprintId}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {log.user?.fullName || `Fingerprint #${log.fingerprintId}`}
                      </span>
                      <Badge
                        variant={log.logType === "CHECK_IN" ? "success" : "warning"}
                        className="text-[10px] px-1.5 py-0 shrink-0"
                      >
                        {log.logType === "CHECK_IN" ? "IN" : "OUT"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono">{log.deviceId}</span>
                      <span>·</span>
                      <span className={log.confidence >= 90 ? "text-emerald-400" : "text-amber-400"}>
                        {log.confidence}%
                      </span>
                      <span>·</span>
                      <span>{timeAgo(log.timestamp)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}