"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { MqttClient } from "mqtt"
import type {
  DeviceStatus,
  ScanEvent,
  EnrollmentEvent,
  DeviceLog,
  DeviceAlert,
  DeviceCommand,
} from "@/types/mqtt"

interface MqttContextValue {
  connected: boolean
  devices: Record<string, DeviceStatus>
  enrollmentEvents: Record<string, EnrollmentEvent>
  logs: DeviceLog[]
  alerts: DeviceAlert[]
  publishCommand: (deviceId: string, command: DeviceCommand) => void
  onScan: (callback: (event: ScanEvent) => void) => () => void
}

const MqttContext = createContext<MqttContextValue | null>(null)

export function useMqtt() {
  const ctx = useContext(MqttContext)
  if (!ctx) throw new Error("useMqtt must be used within MqttProvider")
  return ctx
}

const MQTT_BROKER = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || ""
const MQTT_USER = process.env.NEXT_PUBLIC_MQTT_USER || ""
const MQTT_PASS = process.env.NEXT_PUBLIC_MQTT_PASS || ""

const MAX_LOGS = 100
const MAX_ALERTS = 50

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<MqttClient | null>(null)
  const [connected, setConnected] = useState(false)
  const [devices, setDevices] = useState<Record<string, DeviceStatus>>({})
  const [enrollmentEvents, setEnrollmentEvents] = useState<
    Record<string, EnrollmentEvent>
  >({})
  const [logs, setLogs] = useState<DeviceLog[]>([])
  const [alerts, setAlerts] = useState<DeviceAlert[]>([])
  const scanListenersRef = useRef<Set<(event: ScanEvent) => void>>(new Set())

  const addScanEvent = useCallback((event: ScanEvent) => {
    const enriched = { ...event, receivedAt: new Date().toISOString() }
    scanListenersRef.current.forEach((cb) => cb(enriched))
  }, [])

  const onScan = useCallback(
    (callback: (event: ScanEvent) => void) => {
      scanListenersRef.current.add(callback)
      return () => {
        scanListenersRef.current.delete(callback)
      }
    },
    []
  )

  useEffect(() => {
    if (!MQTT_BROKER) {
      console.warn("MQTT_BROKER_URL not set")
      return
    }

    let cancelled = false

    async function connectMqtt() {
      const mqttModule = await import("mqtt")
      if (cancelled) return
      const mqttClient = mqttModule.default

      const clientId = `dashboard-${Date.now()}`
      const client = mqttClient.connect(MQTT_BROKER, {
        username: MQTT_USER,
        password: MQTT_PASS,
        clientId,
        protocolVersion: 5,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000,
      })

      clientRef.current = client

      client.on("connect", () => {
        setConnected(true)
        client.subscribe("smart-door/+/status")
        client.subscribe("smart-door/+/scan")
        client.subscribe("smart-door/+/enrollment")
        client.subscribe("smart-door/+/log")
        client.subscribe("smart-door/+/alert")
      })

      client.on("offline", () => {
        setConnected(false)
      })

      client.on("error", (err) => {
        console.error("MQTT error:", err.message)
      })

      client.on("message", (topic: string, payload: Buffer, packet: any) => {
        const parts = topic.split("/")
        if (parts.length < 3) return
        const deviceId = parts[1]
        const subtopic = parts[2]

        try {
          const data = JSON.parse(payload.toString())

          switch (subtopic) {
            case "status":
              // Ponytail: ignore retained messages — they reflect old state, not current liveness
              // Ceiling: if ESP32 publishes retain=false but broker misbehaves, we'd miss updates
              // Upgrade: track connection time, only trust messages after connect
              if (!packet?.retain) {
                setDevices((prev) => ({
                  ...prev,
                  [deviceId]: {
                    ...data,
                    lastSeen: new Date().toISOString(),
                  },
                }))
              }
              break

            case "scan":
              addScanEvent({ ...data, device_id: deviceId } as ScanEvent & {
                device_id: string
              })
              break

            case "enrollment":
              setEnrollmentEvents((prev) => ({
                ...prev,
                [deviceId]: data as EnrollmentEvent,
              }))
              break

            case "log":
              setLogs((prev) => {
                const entry = {
                  ...data,
                  device_id: deviceId,
                  receivedAt: new Date().toISOString(),
                } as DeviceLog & { device_id: string }
                return [entry, ...prev].slice(0, MAX_LOGS)
              })
              break

            case "alert":
              setAlerts((prev) => {
                const entry = {
                  ...data,
                  device_id: deviceId,
                  receivedAt: new Date().toISOString(),
                } as DeviceAlert & { device_id: string }
                return [entry, ...prev].slice(0, MAX_ALERTS)
              })
              break
          }
        } catch {
          // ignore malformed messages
        }
      })
    }

    connectMqtt()

    return () => {
      cancelled = true
      if (clientRef.current) {
        clientRef.current.end(true)
        clientRef.current = null
      }
    }
  }, [addScanEvent])

  const publishCommand = useCallback(
    (deviceId: string, command: DeviceCommand) => {
      const client = clientRef.current
      if (!client || !connected) return
      client.publish(
        `smart-door/${deviceId}/command`,
        JSON.stringify(command),
        { qos: 1 }
      )
    },
    [connected]
  )

  const value = useMemo(
    () => ({
      connected,
      devices,
      enrollmentEvents,
      logs,
      alerts,
      publishCommand,
      onScan,
    }),
    [connected, devices, enrollmentEvents, logs, alerts, publishCommand, onScan]
  )

  return (
    <MqttContext.Provider value={value}>
      {children}
    </MqttContext.Provider>
  )
}
