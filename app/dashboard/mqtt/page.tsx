"use client"

import { useState, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMqtt } from "@/components/mqtt-provider"
import { supabase } from "@/lib/supabase"
import { timeAgo } from "@/lib/utils"

export default function MqttTelemetryPage() {
  const {
    connected,
    devices,
    logs,
    alerts,
    enrollmentEvents,
    publishCommand,
  } = useMqtt()

  const [targetDevice, setTargetDevice] = useState("office-01")
  const [commandAction, setCommandAction] = useState("status")
  const [fpId, setFpId] = useState("")
  const [sent, setSent] = useState(false)
  const queryClient = useQueryClient()
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDeleteRef = useRef<{ deviceId: string; fpNum: number } | null>(null)

  useEffect(() => {
    const latestEvent = enrollmentEvents[targetDevice]
    if (!latestEvent || !pendingDeleteRef.current) return
    if (latestEvent.status !== "deleted") return
    if (latestEvent.fingerprint_id !== pendingDeleteRef.current.fpNum) return

    const { fpNum } = pendingDeleteRef.current
    pendingDeleteRef.current = null
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current)
      deleteTimeoutRef.current = null
    }

    async function unlinkUser() {
      const { error } = await supabase
        .from("users")
        .update({ fingerprint_id: null })
        .eq("fingerprint_id", fpNum)
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["users"] })
        toast.success(`Slot ${fpNum} deleted and user unlinked`)
      } else {
        toast.warning("Deleted from device but Supabase unlink failed")
      }
    }
    unlinkUser()
  }, [enrollmentEvents, targetDevice, queryClient])

  function handleSend() {
    const cmd: { action: string; fingerprint_id?: number } = {
      action: commandAction,
    }

    if (commandAction === "delete_fingerprint") {
      const fpNum = parseInt(fpId, 10)
      if (!fpId || isNaN(fpNum) || fpNum < 1 || fpNum > 127) {
        toast.error("Enter a valid fingerprint ID (1-127)")
        return
      }
      cmd.fingerprint_id = fpNum
      publishCommand(targetDevice, cmd as any)
      toast.info(`Deleting fingerprint slot ${fpNum}...`)
      pendingDeleteRef.current = { deviceId: targetDevice, fpNum }
      deleteTimeoutRef.current = setTimeout(() => {
        if (pendingDeleteRef.current) {
          pendingDeleteRef.current = null
          toast.error("Device did not respond — check if device is online")
        }
      }, 10000)
    } else if (
      commandAction === "enroll_start" &&
      fpId
    ) {
      cmd.fingerprint_id = parseInt(fpId, 10)
      publishCommand(targetDevice, cmd as any)
    } else {
      publishCommand(targetDevice, cmd as any)
    }

    setSent(true)
    setTimeout(() => setSent(false), 2000)
  }

  const deviceCount = Object.keys(devices).length

  return (
    <>
      {/* Page Header */}
      <div className="pt-8 mb-10">
          <h1 className="font-display-lg text-display-lg text-on-surface lg:text-[48px] text-[32px] mb-2 tracking-tight">
            MQTT Telemetry
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Real-time HiveMQ Cloud connection monitor & command center
          </p>
      </div>

      <div className="flex justify-end mb-6">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${
            connected
              ? "bg-secondary/10 text-secondary border-secondary/20"
              : "bg-error/10 text-error border-error/20"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {connected ? "wifi" : "wifi_off"}
          </span>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Broker
              </p>
              <span className="material-symbols-outlined text-[18px] text-secondary">cell_tower</span>
            </div>
            <p className="font-headline-md text-headline-md text-on-surface">HiveMQ Cloud</p>
            <p className="font-mono-sm text-xs text-on-surface-variant mt-1">
              TLS :8884 WSS
            </p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Devices
              </p>
              <span className="material-symbols-outlined text-[18px] text-primary">devices</span>
            </div>
            <p className="font-headline-md text-headline-md text-on-surface">{deviceCount}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Online via MQTT
            </p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-tertiary-container/10 rounded-full blur-3xl group-hover:bg-tertiary-container/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Messages
              </p>
              <span className="material-symbols-outlined text-[18px] text-tertiary-container">arrow_downward</span>
            </div>
            <p className="font-headline-md text-headline-md text-on-surface">{logs.length}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Received this session
            </p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-error/10 rounded-full blur-3xl group-hover:bg-error/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Alerts
              </p>
              <span className="material-symbols-outlined text-[18px] text-error">warning</span>
            </div>
            <p className="font-headline-md text-headline-md text-on-surface">{alerts.length}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Active warnings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Command Publisher */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Command Publisher</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant">Device ID</label>
              <Input
                value={targetDevice}
                onChange={(e) => setTargetDevice(e.target.value)}
                placeholder="office-01"
                className="h-10 border-white/10 bg-surface-container text-on-surface text-sm font-mono-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant">Action</label>
              <select
                value={commandAction}
                onChange={(e) => setCommandAction(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/10 bg-surface-container px-3 text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="status">Request Status</option>
                <option value="unlock">Unlock Door</option>
                <option value="enroll_start">Start Enrollment</option>
                <option value="enroll_cancel">Cancel Enrollment</option>
                <option value="delete_fingerprint">Delete Fingerprint</option>
              </select>
            </div>

            {(commandAction === "enroll_start" ||
              commandAction === "delete_fingerprint") && (
              <div className="space-y-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant">
                  Fingerprint ID
                </label>
                <Input
                  type="number"
                  min={1}
                  max={127}
                  value={fpId}
                  onChange={(e) => setFpId(e.target.value)}
                  placeholder="1-127"
                  className="h-10 border-white/10 bg-surface-container text-on-surface text-sm font-mono-sm"
                />
              </div>
            )}

            <div className="pt-1">
              <Button
                onClick={handleSend}
                disabled={!connected || !targetDevice}
                className="w-full rounded-xl bg-primary text-on-primary hover:bg-primary/80 font-label-md"
              >
                {sent ? (
                  "Sent!"
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px] mr-1">send</span>
                    Publish Command
                  </>
                )}
              </Button>
            </div>

            {/* Topic preview */}
            <div className="glass-card rounded-lg p-3">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Topic</p>
              <p className="font-mono-sm text-xs text-primary break-all">
                smart-door/{targetDevice || "..."}/command
              </p>
            </div>
          </div>
        </div>

        {/* Connection Info + Topics */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-secondary">
                <span className="material-symbols-outlined text-[20px]">cell_tower</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Subscribed Topics
              </h3>
            </div>
            <div className="space-y-2">
              {[
                "smart-door/+/status",
                "smart-door/+/scan",
                "smart-door/+/enrollment",
                "smart-door/+/log",
                "smart-door/+/alert",
              ].map((topic) => (
                <div
                  key={topic}
                  className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2"
                >
                  <span className="material-symbols-outlined text-[14px] text-primary shrink-0">arrow_downward</span>
                  <span className="font-mono-sm text-xs text-primary break-all">
                    {topic}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Enrollment Status */}
          {Object.keys(enrollmentEvents).length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">
                Enrollment Events
              </h3>
              <div className="space-y-2">
                {Object.entries(enrollmentEvents).map(([deviceId, event]) => (
                  <div
                    key={deviceId}
                    className="flex items-center justify-between rounded-lg glass-card px-3 py-2"
                  >
                    <span className="font-mono-sm text-xs text-on-surface-variant">
                      {deviceId}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        event.status === "completed"
                          ? "bg-secondary/10 text-secondary border-secondary/20"
                          : event.status === "failed" || event.status === "failed_mismatch"
                          ? "bg-error/10 text-error border-error/20"
                          : "bg-surface-container text-on-surface-variant border-white/10"
                      }`}
                    >
                      {event.status}
                      {event.fingerprint_id ? ` (Slot #${event.fingerprint_id})` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Log */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface/30">
          <div className="flex items-center gap-3">
            <h3 className="font-headline-md text-headline-md text-on-surface">Message Log</h3>
            <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
              {logs.length} messages
            </span>
          </div>
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            arrow_upward
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center font-body-sm text-body-sm text-on-surface-variant">
              No messages received yet. Waiting for device events...
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {logs.map((log, i) => (
                <div
                  key={`${log.timestamp}-${i}`}
                  className="flex items-start gap-3 px-6 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="p-1.5 bg-tertiary-container/10 rounded-lg border border-tertiary-container/20 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-tertiary-container">arrow_upward</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center font-mono-sm text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-white/10">
                        {(log as any).device_id || "unknown"}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">
                        {log.event}
                      </span>
                    </div>
                    <p className="font-body-xs text-body-xs text-on-surface-variant mt-0.5 break-all">
                      {log.message}
                    </p>
                  </div>
                  <span className="font-body-xs text-body-xs text-on-surface-variant shrink-0 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    {(log as any).receivedAt
                      ? timeAgo((log as any).receivedAt)
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="glass-card rounded-xl border border-tertiary-container/20 bg-tertiary-container/5 p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-tertiary-container/10 rounded-lg border border-tertiary-container/20">
              <span className="material-symbols-outlined text-[18px] text-tertiary-container">warning</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Active Alerts
            </h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={`${i}-${alert.type}`}
                className="flex items-center justify-between rounded-lg bg-tertiary-container/5 border border-tertiary-container/10 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border border-tertiary-container/20 text-tertiary-container bg-tertiary-container/10">
                    {alert.type}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface">
                    {alert.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
