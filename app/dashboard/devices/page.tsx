"use client"

import { useEffect, useState } from "react"
import { useMqtt } from "@/components/mqtt-provider"
import { EnrollmentLinkModal } from "@/components/enrollment-link-modal"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/utils"
import type { DeviceStatus } from "@/types/mqtt"

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function DeviceCard({
  id,
  status,
}: {
  id: string
  status: DeviceStatus | null
}) {
  const { publishCommand } = useMqtt()
  const [unlocking, setUnlocking] = useState(false)

  function handleUnlock() {
    setUnlocking(true)
    publishCommand(id, { action: "unlock" })
    setTimeout(() => setUnlocking(false), 2000)
  }

  return (
    <div className="glass-card rounded-xl p-6 transition-all duration-300 hover:border-primary/30 relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg border ${
              status?.online
                ? "bg-secondary/10 border-secondary/20 text-secondary"
                : "bg-error/10 border-error/20 text-error"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {status?.online ? "door_open" : "door_front"}
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">{id}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Smart Door Device</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
            status?.online
              ? "bg-secondary/10 text-secondary border-secondary/20"
              : "bg-error/10 text-error border-error/20"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {status?.online ? "wifi" : "wifi_off"}
          </span>
          {status?.online ? "Online" : "Offline"}
        </span>
      </div>

      {status ? (
        <div className="space-y-3 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-lg p-3">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                Door
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-[16px] ${
                  status.door === "locked" ? "text-tertiary-container" : "text-secondary"
                }`}>
                  {status.door === "locked" ? "lock" : "lock_open"}
                </span>
                <span className={`font-body-sm text-body-sm ${
                  status.door === "locked" ? "text-tertiary-container" : "text-secondary"
                }`}>
                  {status.door === "locked" ? "Locked" : "Unlocked"}
                </span>
              </div>
            </div>
            <div className="glass-card rounded-lg p-3">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                Uptime
              </p>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  schedule
                </span>
                <span className="font-body-sm text-body-sm text-on-surface">
                  {formatUptime(status.uptime)}
                </span>
              </div>
            </div>
            <div className="glass-card rounded-lg p-3">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                Memory
              </p>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container">
                  memory
                </span>
                <span className="font-body-sm text-body-sm text-on-surface">
                  {(status.freeHeap / 1024).toFixed(0)}KB
                </span>
              </div>
            </div>
            <div className="glass-card rounded-lg p-3">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                Signal
              </p>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  signal_cellular_alt
                </span>
                <span className="font-body-sm text-body-sm text-on-surface">
                  {status.rssi || "-"}dBm
                </span>
              </div>
            </div>
          </div>

          {status.enrollment_mode && (
            <div className="rounded-lg border border-tertiary-container/20 bg-tertiary-container/5 p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-tertiary-container animate-pulse">
                fingerprint
              </span>
              <span className="font-body-sm text-body-sm text-tertiary-container font-medium">
                Enrollment mode active on device
              </span>
            </div>
          )}

          {status.lastSeen && (
            <p className="font-body-xs text-body-xs text-on-surface-variant">
              Last seen: {timeAgo(status.lastSeen)}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUnlock}
              disabled={unlocking || status.door === "unlocked"}
              className="flex-1 rounded-xl bg-secondary/75 text-on-surface hover:bg-secondary/60 font-label-md"
            >
              {unlocking ? (
                <span className="animate-pulse">Unlocking...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px] mr-1">lock_open</span>
                  Unlock Door
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => publishCommand(id, { action: "status" })}
              className="rounded-xl border-white/10 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center relative z-10">
          <div className="p-3 rounded-full bg-surface-container mb-3">
            <span className="material-symbols-outlined text-[24px] text-on-surface-variant animate-pulse">
              router
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Waiting for device...</p>
          <p className="font-body-xs text-body-xs text-on-surface-variant mt-1">
            Device will appear when it connects to MQTT
          </p>
        </div>
      )}
    </div>
  )
}

export default function DevicesPage() {
  const { devices, connected, enrollmentEvents } = useMqtt()
  const deviceIds = Object.keys(devices)
  const [linkModal, setLinkModal] = useState<{
    open: boolean
    fingerprintId: number
  }>({ open: false, fingerprintId: 0 })

  useEffect(() => {
    const completed = Object.entries(enrollmentEvents).find(
      ([, event]) => event.status === "completed" && event.fingerprint_id
    )
    if (completed) {
      const [, event] = completed
      setLinkModal({ open: true, fingerprintId: event.fingerprint_id! })
    }
  }, [enrollmentEvents])

  return (
    <>
      {/* Page Header */}
      <div className="pt-8 mb-10">
        <h1 className="font-display-lg text-display-lg text-on-surface lg:text-[48px] text-[32px] mb-2 tracking-tight">
          Devices
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Monitor and control connected smart door devices
        </p>
      </div>

      {deviceIds.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center relative overflow-hidden">
          <div className="p-3 bg-surface-container rounded-lg mx-auto mb-4 inline-flex">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
              router
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            No Devices Online
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            Connect your ESP32 smart door device to HiveMQ Cloud. The device
            will automatically appear here when it publishes its status.
          </p>
          <div className="mt-6 glass-card rounded-lg p-4 max-w-sm mx-auto text-left">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
              Expected MQTT Topic
            </p>
            <p className="font-mono-sm text-xs text-primary bg-primary/5 px-2 py-1 rounded-lg">
              smart-door/office-01/status
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deviceIds.map((id) => (
            <DeviceCard key={id} id={id} status={devices[id]} />
          ))}
        </div>
      )}
      <EnrollmentLinkModal
        open={linkModal.open}
        onOpenChange={(open) => setLinkModal((prev) => ({ ...prev, open }))}
        fingerprintId={linkModal.fingerprintId}
      />
    </>
  )
}
