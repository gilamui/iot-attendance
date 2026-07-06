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

interface EnrollUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnrollUserModal({ open, onOpenChange }: EnrollUserModalProps) {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState("")
  const [fingerprintId, setFingerprintId] = useState("")

  const mutation = useMutation({
    mutationFn: () =>
      createUser({
        fingerprint_id: parseInt(fingerprintId, 10),
        full_name: fullName,
        role: "EMPLOYEE",
        status: "ACTIVE",
      }),
    onSuccess: () => {
      toast.success("User enrolled successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      onOpenChange(false)
      resetForm()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to enroll user")
    },
  })

  function resetForm() {
    setFullName("")
    setFingerprintId("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !fingerprintId) {
      toast.error("Full name and fingerprint ID are required")
      return
    }
    const fpNum = parseInt(fingerprintId, 10)
    if (isNaN(fpNum) || fpNum < 1 || fpNum > 127) {
      toast.error("Fingerprint ID must be between 1 and 127")
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <Fingerprint className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-slate-100">Enroll New Fingerprint</DialogTitle>
              <DialogDescription className="text-slate-400">
                Assign a hardware fingerprint slot (1-127) to an employee
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <Input
                placeholder="Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Hardware Fingerprint ID (1-127)</label>
              <Input
                type="number"
                min={1}
                max={127}
                placeholder="e.g. 5"
                value={fingerprintId}
                onChange={(e) => setFingerprintId(e.target.value)}
                required
                className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/30"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              className="border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500"
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enroll User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}