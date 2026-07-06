"use client"

import { useQuery } from "@tanstack/react-query"
import { Clock, Fingerprint } from "lucide-react"
import { getAttendance } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function LiveActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["attendance", "recent"],
    queryFn: getAttendance,
    refetchInterval: 5000,
  })

  const recent = data?.slice(0, 5) || []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Live Activity Feed</CardTitle>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Polling 5s
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent scans
          </p>
        ) : (
          recent.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Fingerprint className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {log.user?.fullName || `Fingerprint #${log.fingerprintId}`}
                  </span>
                  <Badge
                    variant={log.logType === "CHECK_IN" ? "success" : "warning"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {log.logType === "CHECK_IN" ? "IN" : "OUT"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(log.timestamp).toLocaleTimeString()}
                  <span className="mx-1">·</span>
                  {log.deviceId}
                  {log.confidence != null && (
                    <>
                      <span className="mx-1">·</span>
                      {log.confidence}%
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
