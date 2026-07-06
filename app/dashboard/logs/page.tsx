"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Shield,
  LogIn,
  AlertTriangle,
  Unlock,
  Wifi,
  Fingerprint,
  Scan,
} from "lucide-react"
import { getAttendance } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const eventConfig: Record<string, { icon: React.ElementType; label: string; badge: "success" | "warning" | "destructive" | "secondary"; color: string; glow: string }> = {
  CHECK_IN: {
    icon: LogIn,
    label: "CHECK IN",
    badge: "success",
    color: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  CHECK_OUT: {
    icon: AlertTriangle,
    label: "CHECK OUT",
    badge: "warning",
    color: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
  DOOR_UNLOCK: {
    icon: Unlock,
    label: "DOOR UNLOCK",
    badge: "destructive",
    color: "text-rose-400",
    glow: "shadow-rose-500/10",
  },
}

function getEventConfig(event: string) {
  return eventConfig[event] || {
    icon: Scan,
    label: event,
    badge: "secondary" as const,
    color: "text-slate-400",
    glow: "",
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function LogsPage() {
  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendance,
    refetchInterval: 10000,
  })

  const todayLogs = logs?.filter(
    (l) => new Date(l.timestamp).toDateString() === new Date().toDateString()
  ) || []

  const statCards = [
    {
      label: "Today Check-Ins",
      value: todayLogs.filter((l) => l.logType === "CHECK_IN").length,
      icon: LogIn,
      color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      glow: "glow-emerald",
    },
    {
      label: "Today Check-Outs",
      value: todayLogs.filter((l) => l.logType === "CHECK_OUT").length,
      icon: AlertTriangle,
      color: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      glow: "",
    },
    {
      label: "Active Devices",
      value: new Set(logs?.map((l) => l.deviceId)).size || 0,
      icon: Wifi,
      color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      glow: "",
    },
    {
      label: "Total Records",
      value: logs?.length || 0,
      icon: Shield,
      color: "from-violet-500/20 to-violet-500/5 border-violet-500/20",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      glow: "",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Security & System Logs
          </h1>
          <p className="text-sm text-slate-400">
            Audit trail for authentication events, door unlocks, and MQTT connectivity
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 border-violet-500/20 text-violet-300 bg-violet-500/5"
        >
          <Shield className="h-3 w-3" />
          Audit Trail
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`rounded-2xl border bg-gradient-to-br ${stat.color} bg-slate-900/40 backdrop-blur-xl p-5 shadow-lg shadow-black/20 transition-all duration-200 hover:brightness-110 ${stat.glow}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-white tracking-tight mt-1.5">
                    {stat.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Event Log Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl shadow-lg shadow-black/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <Fingerprint className="h-4 w-4 text-indigo-400" />
            <span className="font-medium">Attendance Event Log</span>
          </div>
          <Badge variant="outline" className="text-[10px] border-white/[0.06] text-slate-400">
            Auto-refresh 10s
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-white/[0.04]" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-rose-400">
            Failed to load logs. Check API connection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Event</TableHead>
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Employee</TableHead>
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Device</TableHead>
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Confidence</TableHead>
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      No event logs recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.slice(0, 100).map((log) => {
                    const config = getEventConfig(log.logType)
                    const Icon = config.icon
                    return (
                      <TableRow
                        key={log.id}
                        className="border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.color === "text-emerald-400" ? "bg-emerald-500/10" : config.color === "text-amber-400" ? "bg-amber-500/10" : config.color === "text-rose-400" ? "bg-rose-500/10" : "bg-slate-500/10"}`}>
                              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                            </div>
                            <Badge
                              variant={config.badge}
                              className="text-[10px] px-2 py-0.5 font-medium"
                            >
                              {config.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-500/10 text-[9px] font-semibold text-slate-400">
                              {log.user?.fullName ? getInitials(log.user.fullName) : "#"}
                            </div>
                            {log.user?.fullName || `FP#${log.fingerprintId}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] border-white/[0.06] text-slate-400"
                          >
                            {log.deviceId}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.confidence != null ? (
                            <span className={`font-mono ${log.confidence >= 90 ? "text-emerald-400" : "text-amber-400"}`}>
                              {log.confidence}%
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}