"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateUser } from "@/lib/api"
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
import { Select } from "@/components/ui/select"
import { Loader2, Pencil } from "lucide-react"
import type { User } from "@/types/api"

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "EMPLOYEE", label: "Employee" },
]

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
]

export function EditUserModal({
  open,
  onOpenChange,
  user,
}: EditUserModalProps) {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState("")
  const [fingerprintId, setFingerprintId] = useState("")
  const [role, setRole] = useState("EMPLOYEE")
  const [status, setStatus] = useState("ACTIVE")

  useEffect(() => {
    if (user) {
      setFullName(user.full_name)
      setFingerprintId(
        user.fingerprint_id != null ? String(user.fingerprint_id) : ""
      )
      setRole(user.role)
      setStatus(user.status)
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: () =>
      updateUser(user!.id, {
        full_name: fullName,
        fingerprint_id: fingerprintId
          ? parseInt(fingerprintId, 10)
          : undefined,
        role: role as "ADMIN" | "EMPLOYEE",
        status: status as "ACTIVE" | "SUSPENDED",
      }),
    onSuccess: () => {
      toast.success("User updated successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update user")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName) {
      toast.error("Full name is required")
      return
    }
    const fpNum = fingerprintId ? parseInt(fingerprintId, 10) : null
    if (fpNum != null && (isNaN(fpNum) || fpNum < 1 || fpNum > 127)) {
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
              <Pencil className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-slate-100">Edit User</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update details for {user?.full_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Full Name
              </label>
              <Input
                placeholder="Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Hardware Fingerprint ID (1-127)
              </label>
              <Input
                type="number"
                min={1}
                max={127}
                placeholder="Leave empty to unassign"
                value={fingerprintId}
                onChange={(e) => setFingerprintId(e.target.value)}
                className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Role
              </label>
              <Select
                options={roleOptions}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border-white/[0.06] bg-slate-800 text-white [color-scheme:dark] focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Status
              </label>
              <Select
                options={statusOptions}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border-white/[0.06] bg-slate-800 text-white [color-scheme:dark] focus-visible:ring-indigo-500/30"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              className="rounded-xl"
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
