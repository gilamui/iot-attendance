"use client"

import { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AttendanceLog } from "@/types/api"

interface Props {
  logs: AttendanceLog[]
}

export function AttendanceChart({ logs }: Props) {
  const chartData = useMemo(() => {
    const hourMap = new Array(24).fill(0)
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recent = logs.filter((l) => new Date(l.timestamp) >= sevenDaysAgo)
    for (const log of recent) {
      const hour = new Date(log.timestamp).getHours()
      hourMap[hour]++
    }

    return hourMap.map((count, hour) => ({
      label: `${hour.toString().padStart(2, "0")}:00`,
      scans: count,
    }))
  }, [logs])

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Peak Attendance Hours (7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No hourly data available yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scansGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#scansGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
