"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createUser } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Fingerprint } from "lucide-react"

interface EnrollmentLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fingerprintId: number
}

export function EnrollmentLinkModal({
  open,
  onOpenChange,
  fingerprintId,
}: EnrollmentLinkModalProps) {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState("")

  const mutation = useMutation({
    mutationFn: () =>
      createUser({
        full_name: fullName,
        fingerprint_id: fingerprintId,
        role: "EMPLOYEE",
        status: "ACTIVE",
      }),
    onSuccess: () => {
      toast.success(`Fingerprint slot #${fingerprintId} linked to ${fullName}`)
      queryClient.invalidateQueries({ queryKey: ["users"] })
      onOpenChange(false)
      setFullName("")
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to link fingerprint to user")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error("Employee name is required")
      return
    }
    mutation.mutate()
  }

  function handleSkip() {
    onOpenChange(false)
    setFullName("")
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Fingerprint className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-slate-100">
                Link Enrolled Fingerprint
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Slot #{fingerprintId} was just enrolled on the device. Link it
                to an employee.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Employee Full Name
              </label>
              <Input
                placeholder="e.g. Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
                className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/30"
              />
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300">
                Hardware slot #{fingerprintId} already stored on device
              </span>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleSkip}
              disabled={mutation.isPending}
              className="rounded-xl"
            >
              Skip
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500"
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Link to Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
