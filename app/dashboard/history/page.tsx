"use client"

import { useState, useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, Search, Clock, Fingerprint, Wifi, Radio } from "lucide-react"
import { toast } from "sonner"
import { getAttendance } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
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
      if (deviceId && log.deviceId !== deviceId) return false
      if (logType && log.logType !== logType) return false
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = log.user?.fullName?.toLowerCase().includes(q)
        const fpMatch = String(log.fingerprintId).includes(q)
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
      log.user?.fullName || "Unknown",
      log.fingerprintId,
      log.deviceId,
      log.logType === "CHECK_IN" ? "IN" : "OUT",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sensor & Attendance History
          </h1>
          <p className="text-sm text-slate-400">
            Monitor all fingerprint scan events from hardware gateways
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-indigo-500/20 text-indigo-300 bg-indigo-500/5"
          >
            <Radio className="h-3 w-3" />
            Live Feed
          </Badge>
        </div>
      </div>

      {/* Filters Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <h2 className="text-sm font-semibold text-slate-200 tracking-tight">
            Filters
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Auto-Refresh</span>
              <Switch
                checked={livePolling}
                onCheckedChange={setLivePolling}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
            <Button
              size="sm"
              onClick={exportCSV}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search name or FP ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 border-white/[0.06] bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/30"
            />
          </div>
          <Select
            options={deviceOptions}
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="border-white/[0.06] bg-white/[0.04] text-slate-300 focus-visible:ring-indigo-500/30"
          />
          <Select
            options={logTypeOptions}
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            className="border-white/[0.06] bg-white/[0.04] text-slate-300 focus-visible:ring-indigo-500/30"
          />
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From date"
            className="h-10 border-white/[0.06] bg-white/[0.04] text-white [color-scheme:dark] focus-visible:ring-indigo-500/30"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="To date"
            className="h-10 border-white/[0.06] bg-white/[0.04] text-white [color-scheme:dark] focus-visible:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl shadow-lg shadow-black/20 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-white/[0.04]" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-rose-400">
            Failed to load attendance data. Check API connection.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">ID</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">FP ID</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Device</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Confidence</TableHead>
                    <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((log) => (
                      <TableRow
                        key={log.id}
                        className="border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-slate-400">
                          {log.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-semibold text-indigo-300">
                              {log.user?.fullName
                                ? log.user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                                : "FP"}
                            </div>
                            {log.user?.fullName || `FP#${log.fingerprintId}`}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-400">
                          {log.fingerprintId}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] border-white/[0.06] text-slate-400"
                          >
                            {log.deviceId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={log.logType === "CHECK_IN" ? "success" : "warning"}
                            className="text-[10px] px-2 py-0.5"
                          >
                            {log.logType === "CHECK_IN" ? "IN" : "OUT"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {log.confidence != null ? (
                            <span className={log.confidence >= 90 ? "text-emerald-400" : "text-amber-400"}>
                              {log.confidence}%
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
              <p className="text-xs text-slate-500">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                {data && data.length !== filtered.length
                  ? ` (filtered from ${data.length})`
                  : ""}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-emerald-400" />
                  {livePolling ? "Live" : "Static"}
                </span>
                <span className="flex items-center gap-1">
                  <Fingerprint className="h-3 w-3" />
                  {data?.length || 0} total
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}