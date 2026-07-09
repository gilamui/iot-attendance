"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import {
  Plug,
  PlugZap,
  Activity,
  Hash,
  Send,
  Terminal,
  Trash2,
  X,
  Loader2,
  Wifi,
  WifiOff,
  CheckCircle2,
} from "lucide-react"
import { publishMqtt } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useMqtt } from "@/components/mqtt-context"

function jsonPrettify(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

export default function MqttTelemetryPage() {
  const mqtt = useMqtt()
  const terminalRef = useRef<HTMLDivElement>(null)

  const [jsonPretty, setJsonPretty] = useState(true)

  const [publishTopic, setPublishTopic] = useState("attendance/device/office-01/cmd")
  const [publishPayload, setPublishPayload] = useState("")
  const [newTopic, setNewTopic] = useState("")

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [mqtt.messages])

  const handleSubscribe = useCallback(() => {
    const topic = newTopic.trim()
    if (!topic) return
    const ok = mqtt.subscribeTopic(topic)
    if (!ok) {
      toast.error("Already subscribed")
      return
    }
    setNewTopic("")
    toast.success(`Subscribed to ${topic}`)
  }, [newTopic, mqtt])

  const publishMessage = useCallback(async () => {
    if (!publishTopic.trim() || !publishPayload.trim()) {
      toast.error("Topic and payload are required")
      return
    }
    try {
      const res = await publishMqtt(publishTopic, publishPayload)
      if (res.success) {
        toast.success(`Published to ${publishTopic}`)
      } else {
        toast.error("Failed to publish — broker may be disconnected")
      }
    } catch {
      toast.error("Failed to publish")
    }
  }, [publishTopic, publishPayload])

  const applyPreset = useCallback((preset: "unlock" | "lock" | "scan") => {
    if (preset === "unlock") {
      setPublishTopic("attendance/device/office-01/cmd")
      setPublishPayload(JSON.stringify({ action: "OPEN_DOOR", duration: 10000 }, null, 2))
    } else if (preset === "lock") {
      setPublishTopic("attendance/device/office-01/cmd")
      setPublishPayload(JSON.stringify({ action: "LOCK_DOOR" }, null, 2))
    } else if (preset === "scan") {
      setPublishTopic("attendance/log")
      setPublishPayload(
        JSON.stringify(
          { device_id: "office-01", fingerprint_id: 1, confidence: 95, log_type: "CHECK_IN" },
          null,
          2
        )
      )
    }
  }, [])

  const statusColor =
    mqtt.status === "connected"
      ? "border-emerald-500/20 text-emerald-300 bg-emerald-500/5"
      : mqtt.status === "connecting"
      ? "border-amber-500/20 text-amber-300 bg-amber-500/5"
      : "border-rose-500/20 text-rose-300 bg-rose-500/5"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">MQTT Live Telemetry</h1>
          <p className="text-sm text-slate-400">
            Real-time broker debugger, publisher, and subscription manager
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`gap-1.5 text-xs font-normal ${statusColor}`}>
            {mqtt.status === "connected" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : mqtt.status === "connecting" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {mqtt.status === "connected"
              ? "Connected"
              : mqtt.status === "connecting"
              ? "Connecting..."
              : "Disconnected"}
          </Badge>
          {mqtt.status === "connected" ? (
            <Button variant="destructive" size="sm" onClick={mqtt.disconnect} className="rounded-xl">
              <PlugZap className="mr-1.5 h-3.5 w-3.5" />
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={mqtt.connect}
              disabled={mqtt.status === "connecting"}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500"
            >
              {mqtt.status === "connecting" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plug className="mr-1.5 h-3.5 w-3.5" />
              )}
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* Metrics + Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Section B: Live Metrics */}
        <div className="col-span-1 rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">Metrics</h2>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs text-slate-500">Connection</p>
              <div className="flex items-center gap-2 mt-1">
                {mqtt.status === "connected" ? (
                  <Wifi className="h-4 w-4 text-emerald-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-slate-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    mqtt.status === "connected"
                      ? "text-emerald-300"
                      : mqtt.status === "connecting"
                      ? "text-amber-300"
                      : "text-slate-500"
                  }`}
                >
                  {mqtt.status === "connected"
                    ? "Connected"
                    : mqtt.status === "connecting"
                    ? "Connecting..."
                    : "Disconnected"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Packets Received</p>
              <p className="text-2xl font-bold text-white mt-1 tabular-nums">{mqtt.packetCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Active Topics</p>
              <p className="text-2xl font-bold text-white mt-1 tabular-nums">{mqtt.subscribedTopics.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Terminal Buffer</p>
              <p className="text-2xl font-bold text-white mt-1 tabular-nums">{mqtt.messages.length}</p>
            </div>
          </div>
        </div>

        {/* Section E: Master Terminal */}
        <div className="col-span-1 lg:col-span-3 rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl shadow-lg shadow-black/20 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">Terminal Stream</h2>
              <Badge variant="outline" className="text-[10px] border-white/[0.06] text-slate-400 font-mono">
                {mqtt.messages.length} msgs
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>JSON Prettify</span>
                <Switch
                  checked={jsonPretty}
                  onCheckedChange={setJsonPretty}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={mqtt.clearLogs}
                className="text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            </div>
          </div>
          <div
            ref={terminalRef}
            className="h-80 overflow-y-auto p-4 space-y-1 font-mono text-xs"
          >
            {mqtt.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                {mqtt.status === "connected"
                  ? "Waiting for messages..."
                  : "Connect to broker to view live telemetry"}
              </div>
            ) : (
              mqtt.messages.map((msg) => (
                <div
                  key={msg.id}
                  className="group hover:bg-white/[0.03] rounded-lg p-2 -mx-2 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-slate-600 shrink-0 mt-0.5 tabular-nums">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono shrink-0 border-white/[0.06] text-cyan-300 bg-cyan-500/5"
                    >
                      {msg.topic}
                    </Badge>
                    <span className="text-slate-300 whitespace-pre-wrap break-all min-w-0">
                      {jsonPretty ? jsonPrettify(msg.payload) : msg.payload}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions + Publisher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Section C: Topic Subscriptions */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">Subscriptions</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="attendance/#"
              className="h-9 border-white/[0.06] bg-white/[0.04] text-white placeholder:text-slate-500 text-xs font-mono focus-visible:ring-indigo-500/30"
              onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
            />
            <Button
              size="sm"
              onClick={handleSubscribe}
              disabled={mqtt.status !== "connected"}
              className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500"
            >
              Subscribe
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {mqtt.subscribedTopics.map((topic) => (
              <Badge
                key={topic}
                variant="secondary"
                className="gap-1.5 text-[10px] px-2 py-1 border-white/[0.06] bg-white/[0.04] text-slate-300"
              >
                <span className="font-mono">{topic}</span>
                <button
                  onClick={() => mqtt.unsubscribeTopic(topic)}
                  className="text-slate-500 hover:text-rose-300 transition-colors ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {mqtt.subscribedTopics.length === 0 && (
              <p className="text-xs text-slate-500 py-1">No subscriptions</p>
            )}
          </div>
        </div>

        {/* Section D: Publisher */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-xl p-5 md:p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <Send className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">Publish</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Topic</label>
              <Input
                value={publishTopic}
                onChange={(e) => setPublishTopic(e.target.value)}
                placeholder="attendance/device/office-01/cmd"
                className="h-9 border-white/[0.06] bg-white/[0.04] text-white placeholder:text-slate-500 text-xs font-mono focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Payload (raw JSON)</label>
              <textarea
                value={publishPayload}
                onChange={(e) => setPublishPayload(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 resize-none"
                placeholder='{"action":"OPEN_DOOR","duration":10000}'
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset("unlock")}
                className="bg-slate-900/60 border-rose-500/20 text-rose-400 hover:bg-slate-800/50 hover:text-rose-350 text-[10px]"
              >
                Unlock Preset
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset("lock")}
                className="bg-slate-900/60 border-amber-500/20 text-amber-400 hover:bg-slate-800/50 hover:text-amber-350 text-[10px]"
              >
                Lock Preset
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset("scan")}
                className="bg-slate-900/60 border-emerald-500/20 text-emerald-400 hover:bg-slate-800/50 hover:text-emerald-350 text-[10px]"
              >
                Mock Scan Preset
              </Button>
            </div>
            <Button
              onClick={publishMessage}
              disabled={mqtt.status !== "connected"}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500"
            >
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
