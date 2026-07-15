"use client"

import { useEffect } from "react"
import { useMqtt } from "@/components/mqtt-provider"
import { supabase } from "@/lib/supabase"
import type { ScanEvent } from "@/types/mqtt"

export function MqttSupabaseBridge() {
  const { onScan } = useMqtt()

  useEffect(() => {
    const unsubscribe = onScan(async (event: ScanEvent & { device_id?: string }) => {
      if (!event.match) return
      try {
        const deviceId = event.device_id || "office-01"

        // Determine log type: every other scan is CHECK_OUT, first is CHECK_IN
        const { count } = await supabase
          .from("attendance_logs")
          .select("id", { count: "exact", head: true })
          .eq("fingerprint_id", event.fingerprint_id)
          .eq("device_id", deviceId)

        const logType = (count || 0) % 2 === 0 ? "CHECK_IN" : "CHECK_OUT"

        // Write scan event to Supabase (use ESP32 timestamp, not browser time)
        await supabase.from("attendance_logs").insert({
          fingerprint_id: event.fingerprint_id,
          device_id: deviceId,
          confidence: event.confidence,
          log_type: logType,
          timestamp: new Date(event.timestamp * 1000).toISOString(),
        })
      } catch (err) {
        console.error("Failed to write MQTT scan to Supabase:", err)
      }
    })

    return unsubscribe
  }, [onScan])

  return null
}
