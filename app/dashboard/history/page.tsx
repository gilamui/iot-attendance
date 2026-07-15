"use client"

import { useState, useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { getAttendance } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const deviceOptions = [
  { value: "", label: "All Devices" },
  { value: "office-01", label: "Office-01" },
  { value: "ESP32_FRONT_GATE", label: "ESP32 Front Gate" },
  { value: "ESP32_BACK_DOOR", label: "ESP32 Back Door" },
]

const logTypeOptions = [
  { value: "", label: "All Types" },
  { value: "CHECK_IN", label: "IN" },
  { value: "CHECK_OUT", label: "OUT" },
]

export default function HistoryPage() {
  const [deviceId, setDeviceId] = useState("")
  const [logType, setLogType] = useState("")
  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [livePolling, setLivePolling] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendance,
    refetchInterval: livePolling ? 3000 : false,
  })

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((log) => {
      if (deviceId && log.device_id !== deviceId) return false
      if (logType && log.log_type !== logType) return false
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = log.user?.full_name?.toLowerCase().includes(q)
        const fpMatch = String(log.fingerprint_id).includes(q)
        if (!nameMatch && !fpMatch) return false
      }
      if (fromDate && new Date(log.timestamp) < new Date(fromDate)) return false
      if (toDate) {
        const end = new Date(toDate)
        end.setDate(end.getDate() + 1)
        if (new Date(log.timestamp) > end) return false
      }
      return true
    })
  }, [data, deviceId, logType, search, fromDate, toDate])

  const exportCSV = useCallback(() => {
    if (!filtered.length) {
      toast.error("No data to export")
      return
    }
    const headers = ["ID", "Name", "Fingerprint ID", "Device ID", "Type", "Confidence", "Timestamp"]
    const rows = filtered.map((log) => [
      log.id,
      log.user?.full_name || "Unknown",
      log.fingerprint_id,
      log.device_id,
      log.log_type === "CHECK_IN" ? "IN" : "OUT",
      log.confidence != null ? log.confidence + "%" : "-",
      new Date(log.timestamp).toLocaleString(),
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-history-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported successfully")
  }, [filtered])

  return (
    <>
      {/* Page Header */}
      <div className="pt-8 mb-10">
        <h1 className="font-display-lg text-display-lg text-on-surface lg:text-[48px] text-[32px] mb-2 tracking-tight">
          Sensor & Attendance History
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Monitor all fingerprint scan events from hardware gateways
        </p>
      </div>

      {/* Filters Card */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">filter_list</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Filters</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span className="font-label-md text-label-md">Auto-Refresh</span>
              <Switch
                checked={livePolling}
                onCheckedChange={setLivePolling}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Button
              size="sm"
              onClick={exportCSV}
              className="rounded-xl bg-primary text-on-primary hover:bg-primary/80 font-label-md"
            >
              <span className="material-symbols-outlined text-[16px] mr-1">download</span>
              Export CSV
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
              search
            </span>
            <Input
              placeholder="Search name or FP ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 border-white/10 bg-surface-container text-on-surface placeholder:text-on-surface-variant focus-visible:ring-primary/30"
            />
          </div>
          <Select
            options={deviceOptions}
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="border-white/10 bg-surface-container text-on-surface [color-scheme:dark] focus-visible:ring-primary/30"
          />
          <Select
            options={logTypeOptions}
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            className="border-white/10 bg-surface-container text-on-surface [color-scheme:dark] focus-visible:ring-primary/30"
          />
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From date"
            className="h-10 border-white/10 bg-surface-container text-on-surface [color-scheme:dark] focus-visible:ring-primary/30"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="To date"
            className="h-10 border-white/10 bg-surface-container text-on-surface [color-scheme:dark] focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-surface-container" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-error">
            Failed to load attendance data. Check API connection.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">ID</TableHead>
                    <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Name</TableHead>
                    <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">FP ID</TableHead>
                    <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Device</TableHead>
                    <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Type</TableHead>
                    <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Confidence</TableHead>
                    <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-body-sm divide-y divide-white/5">
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-on-surface-variant py-8">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((log) => {
                      const isIn = log.log_type === "CHECK_IN"
                      const name = log.user?.full_name || `FP#${log.fingerprint_id}`
                      const initials = log.user?.full_name
                        ? log.user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                        : "FP"

                      return (
                        <TableRow
                          key={log.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <TableCell className="font-mono-sm text-xs text-on-surface-variant">
                            {log.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-on-surface font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-surface-container-high border border-white/10 overflow-hidden flex items-center justify-center text-on-surface-variant font-semibold text-[10px]">
                                {initials}
                              </div>
                              {name}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono-sm text-xs text-on-surface-variant">
                            {log.fingerprint_id}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center font-mono-sm text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-white/10">
                              {log.device_id}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                              isIn
                                ? "bg-secondary/10 text-secondary border-secondary/20"
                                : "bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20"
                            }`}>
                              <span className="material-symbols-outlined text-[14px] mr-1">
                                {isIn ? "login" : "logout"}
                              </span>
                              {isIn ? "IN" : "OUT"}
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
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 bg-surface/20">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                {data && data.length !== filtered.length
                  ? ` (filtered from ${data.length})`
                  : ""}
              </p>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-secondary">circle</span>
                  {livePolling ? "Live" : "Static"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">fingerprint</span>
                  {data?.length || 0} total
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
