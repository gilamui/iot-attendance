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
        full_name: fullName,
        fingerprint_id: parseInt(fingerprintId, 10),
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
      toast.error(err?.message || "Failed to enroll user")
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
          <div className="flex items-start gap-3">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-on-surface font-headline-md text-headline-md">
                Enroll New Fingerprint
              </DialogTitle>
              <DialogDescription className="text-on-surface-variant font-body-sm text-body-sm mt-1">
                Assign a hardware fingerprint slot (1-127) to an employee
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant">
                Full Name
              </label>
              <Input
                placeholder="Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 border-white/10 bg-surface-container text-on-surface placeholder:text-on-surface-variant focus-visible:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant">
                Hardware Fingerprint ID (1-127)
              </label>
              <Input
                type="number"
                min={1}
                max={127}
                placeholder="e.g. 5"
                value={fingerprintId}
                onChange={(e) => setFingerprintId(e.target.value)}
                required
                className="h-10 border-white/10 bg-surface-container text-on-surface placeholder:text-on-surface-variant focus-visible:ring-primary/30"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              className="rounded-xl border-white/10 text-on-surface-variant hover:bg-white/5 font-label-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-primary text-on-primary hover:bg-primary/80 font-label-md"
            >
              {mutation.isPending ? (
                <span className="material-symbols-outlined text-[16px] mr-1 animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[16px] mr-1">person_add</span>
              )}
              Enroll User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
