"use client"

import { useState, useEffect } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface AttendanceChartProps {
  data: { label: string; scans: number }[]
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  const [xInterval, setXInterval] = useState(2)

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w < 480) setXInterval(7)       // show every 8th (00,08,16)
      else if (w < 768) setXInterval(5)  // show every 6th (00,06,12,18)
      else setXInterval(2)               // every 3rd on desktop
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  if (data.every((d) => d.scans === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-on-surface-variant">
        No data available yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <CartesianGrid
          strokeDasharray="0"
          stroke="rgba(255,255,255,0.05)"
          strokeOpacity={1}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#c7c4d7", fontFamily: "Geist" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          interval={xInterval}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#c7c4d7", fontFamily: "Geist" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          allowDecimals={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            color: "#dae2fd",
            fontFamily: "Inter",
          }}
          labelStyle={{
            fontWeight: 600,
            marginBottom: 4,
            color: "#dae2fd",
          }}
        />
        <Area
          type="monotone"
          dataKey="scans"
          stroke="#6366f1"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#areaGradient)"
          filter="url(#glow)"
          dot={false}
          activeDot={{
            r: 5,
            fill: "#0F172A",
            stroke: "#6366f1",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
