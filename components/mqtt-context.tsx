"use client"

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { getAuthToken } from "@/lib/api"

interface TerminalMessage {
  id: string
  topic: string
  payload: string
  timestamp: number
}

type ConnStatus = "disconnected" | "connecting" | "connected"

interface MqttContextValue {
  status: ConnStatus
  packetCount: number
  messages: TerminalMessage[]
  subscribedTopics: string[]
  connect: () => void
  disconnect: () => void
  subscribeTopic: (topic: string) => boolean
  unsubscribeTopic: (topic: string) => void
  clearLogs: () => void
}

const MqttContext = createContext<MqttContextValue | null>(null)

function getWsUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
  return apiUrl.replace(/^http/, "ws") + "/mqtt/ws"
}

let msgId = 0
function nextId() {
  return `msg_${++msgId}_${Date.now()}`
}

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null)
  const messageDedupRef = useRef<Map<string, number>>(new Map())
  const subscribedTopicsRef = useRef<string[]>(["attendance/log", "attendance/device/#"])

  const [status, setStatus] = useState<ConnStatus>("disconnected")
  const [packetCount, setPacketCount] = useState(0)
  const [messages, setMessages] = useState<TerminalMessage[]>([])
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>(["attendance/log", "attendance/device/#"])

  subscribedTopicsRef.current = subscribedTopics

  const connect = useCallback(() => {
    const token = getAuthToken()
    if (!token) {
      toast.error("Not authenticated")
      return
    }

    setStatus("connecting")

    const wsUrl = getWsUrl() + "?token=" + encodeURIComponent(token)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus("connected")
      setPacketCount(0)

      for (const topic of subscribedTopicsRef.current) {
        ws.send(JSON.stringify({ type: "subscribe", topic }))
      }

      toast.success("Connected to telemetry stream")
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "connected") return
        if (data.topic) {
          const key = data.topic + "\0" + data.payload
          const now = Date.now()
          const last = messageDedupRef.current.get(key)
          if (last && now - last < 1000) return
          messageDedupRef.current.set(key, now)

          setPacketCount((prev) => prev + 1)
          setMessages((prev) =>
            prev.concat({ id: nextId(), topic: data.topic, payload: data.payload, timestamp: now })
          )
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      setStatus("disconnected")
      if (wsRef.current === ws) wsRef.current = null
    }

    ws.onerror = () => {
      setStatus("disconnected")
      toast.error("WebSocket connection error")
      if (wsRef.current === ws) wsRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setStatus("disconnected")
    toast.info("Disconnected")
  }, [])

  const subscribeTopic = useCallback(
    (topic: string): boolean => {
      const trimmed = topic.trim()
      if (!trimmed) return false
      if (subscribedTopicsRef.current.includes(trimmed)) return false
      if (wsRef.current && status === "connected") {
        wsRef.current.send(JSON.stringify({ type: "subscribe", topic: trimmed }))
      }
      setSubscribedTopics((prev) => [...prev, trimmed])
      return true
    },
    [status]
  )

  const unsubscribeTopic = useCallback(
    (topic: string) => {
      if (wsRef.current && status === "connected") {
        wsRef.current.send(JSON.stringify({ type: "unsubscribe", topic }))
      }
      setSubscribedTopics((prev) => prev.filter((t) => t !== topic))
    },
    [status]
  )

  const clearLogs = useCallback(() => {
    setMessages([])
  }, [])

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  return (
    <MqttContext.Provider
      value={{
        status,
        packetCount,
        messages,
        subscribedTopics,
        connect,
        disconnect,
        subscribeTopic,
        unsubscribeTopic,
        clearLogs,
      }}
    >
      {children}
    </MqttContext.Provider>
  )
}

export function useMqtt(): MqttContextValue {
  const ctx = useContext(MqttContext)
  if (!ctx) throw new Error("useMqtt must be used within MqttProvider")
  return ctx
}
