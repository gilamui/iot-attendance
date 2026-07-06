"use client"

import { Unlock, BugPlay, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { unlockDoor, mockScan } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  const unlockMutation = useMutation({
    mutationFn: () => unlockDoor("office-01"),
    onSuccess: () => {
      toast.success("Door unlock command sent to office-01 (5s)")
    },
    onError: () => {
      toast.error("Failed to send unlock command")
    },
  })

  const mockMutation = useMutation({
    mutationFn: () =>
      mockScan({
        device_id: "office-01",
        fingerprint_id: 1,
        confidence: 95,
        log_type: "CHECK_IN",
      }),
    onSuccess: (data) => {
      const label = data.logType === "CHECK_IN" ? "IN" : "OUT"
      toast.success(`Mock scan registered: ${label} at ${data.deviceId}`)
    },
    onError: () => {
      toast.error("Failed to simulate scan")
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="destructive"
          className="w-full justify-start gap-2"
          disabled={unlockMutation.isPending}
          onClick={() => unlockMutation.mutate()}
        >
          {unlockMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
          Emergency / Manual Door Unlock
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          disabled={mockMutation.isPending}
          onClick={() => mockMutation.mutate()}
        >
          {mockMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BugPlay className="h-4 w-4" />
          )}
          Simulate Hardware Scan
        </Button>
      </CardContent>
    </Card>
  )
}
