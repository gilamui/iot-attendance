"use client"

import { useQuery } from "@tanstack/react-query"
import { getAttendance } from "@/lib/api"
import { getInitials } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const eventConfig: Record<
  string,
  { label: string; icon: string; colorClass: string; glowClass: string }
> = {
  CHECK_IN: {
    label: "CHECK IN",
    icon: "login",
    colorClass: "bg-secondary/10 text-secondary border-secondary/20",
    glowClass: "",
  },
  CHECK_OUT: {
    label: "CHECK OUT",
    icon: "logout",
    colorClass: "bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20",
    glowClass: "",
  },
  DOOR_UNLOCK: {
    label: "DOOR UNLOCK",
    icon: "lock_open",
    colorClass: "bg-error/10 text-error border-error/20",
    glowClass: "",
  },
}

function getEventConfig(event: string) {
  return (
    eventConfig[event] || {
      label: event,
      icon: "radio_button_checked",
      colorClass: "bg-surface-container text-on-surface-variant border-white/10",
      glowClass: "",
    }
  )
}

export default function LogsPage() {
  const {
    data: logs,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendance,
    refetchInterval: 10000,
  })

  const todayLogs =
    logs?.filter(
      (l) => new Date(l.timestamp).toDateString() === new Date().toDateString()
    ) || []

  const statCards = [
    {
      label: "Today Check-Ins",
      value: todayLogs.filter((l) => l.log_type === "CHECK_IN").length,
      icon: "login",
      color: "bg-secondary/10 border-secondary/20 text-secondary",
      orbColor: "bg-secondary/10",
    },
    {
      label: "Today Check-Outs",
      value: todayLogs.filter((l) => l.log_type === "CHECK_OUT").length,
      icon: "logout",
      color: "bg-tertiary-container/10 border-tertiary-container/20 text-tertiary-container",
      orbColor: "bg-tertiary-container/10",
    },
    {
      label: "Active Devices",
      value: new Set(logs?.map((l) => l.device_id)).size || 0,
      icon: "cell_tower",
      color: "bg-primary/10 border-primary/20 text-primary",
      orbColor: "bg-primary/10",
    },
    {
      label: "Total Records",
      value: logs?.length || 0,
      icon: "shield",
      color: "bg-tertiary-container/10 border-tertiary-container/20 text-tertiary-container",
      orbColor: "bg-tertiary-container/10",
    },
  ]

  return (
    <>
      {/* Page Header */}
      <div className="pt-8 mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface lg:text-[48px] text-[32px] mb-2 tracking-tight">
            Security & System Logs
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Audit trail for authentication events, door unlocks, and MQTT connectivity
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-xl p-6 flex flex-col justify-between group hover:border-primary/30 transition-colors relative overflow-hidden"
          >
            <div className={`absolute -right-10 -top-10 w-32 h-32 ${stat.orbColor} rounded-full blur-3xl group-hover:opacity-75 transition-all duration-500`} />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  {stat.value}
                </h2>
              </div>
              <div className={`p-3 rounded-lg border ${stat.color}`}>
                <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Event Log Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface/30">
          <div className="flex items-center gap-3">
            <h3 className="font-headline-md text-headline-md text-on-surface">Attendance Event Log</h3>
            <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
              Auto-refresh 10s
            </span>
          </div>
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            fingerprint
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-surface-container" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-error">
            Failed to load logs. Check API connection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Event</TableHead>
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Employee</TableHead>
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Device</TableHead>
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Confidence</TableHead>
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-body-sm divide-y divide-white/5">
                {logs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-on-surface-variant py-8">
                      No event logs recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.slice(0, 100).map((log) => {
                    const config = getEventConfig(log.log_type)
                    return (
                      <TableRow
                        key={log.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg border ${config.colorClass}`}>
                              <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${config.colorClass}`}>
                              {config.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-body-sm text-on-surface">
                            <div className="h-6 w-6 rounded-full bg-surface-container-high border border-white/10 overflow-hidden flex items-center justify-center text-on-surface-variant font-semibold text-[9px]">
                              {log.user?.full_name ? getInitials(log.user.full_name) : "#"}
                            </div>
                            {log.user?.full_name || `FP#${log.fingerprint_id}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center font-mono-sm text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-white/10">
                            {log.device_id}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.confidence != null ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-mono-sm ${log.confidence >= 60 ? "text-secondary" : "text-error"}`}>
                                {log.confidence}%
                              </span>
                              <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${log.confidence >= 60 ? "bg-secondary" : "bg-error"}`}
                                  style={{ width: `${log.confidence}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-on-surface-variant">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-on-surface-variant whitespace-nowrap font-mono-sm">
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
    </>
  )
}
