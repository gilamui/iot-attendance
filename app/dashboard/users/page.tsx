"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Pencil, Users, Fingerprint } from "lucide-react"
import { toast } from "sonner"
import { getUsers, deleteUser } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EnrollUserModal } from "@/components/enroll-user-modal"
import { EditUserModal } from "@/components/edit-user-modal"
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { User } from "@/types/api"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  EMPLOYEE: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; fullName: string } | null>(null)
  const [editTarget, setEditTarget] = useState<User | null>(null)

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success("User access revoked")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to revoke access")
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Users & Fingerprints
          </h1>
          <p className="text-sm text-slate-400">
            Manage enrolled employees and their hardware fingerprint slots
          </p>
        </div>
        <Button
          onClick={() => setEnrollOpen(true)}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Enroll New
        </Button>
      </div>

      {/* Directory Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl shadow-lg shadow-black/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <Users className="h-4 w-4 text-indigo-400" />
            <span className="font-medium">Employee Directory</span>
            {users && (
              <Badge variant="outline" className="ml-1 text-[10px] border-white/[0.06] text-slate-400">
                {users.length} total
              </Badge>
            )}
          </div>
          <Fingerprint className="h-4 w-4 text-slate-500" />
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-white/[0.04]" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-rose-400">
            Failed to load users. Check API connection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Username</TableHead>
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Full Name</TableHead>
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Fingerprint ID</TableHead>
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-slate-400 font-medium text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="w-[120px] text-slate-400 font-medium text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No users enrolled yet
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="font-mono text-xs text-slate-400">
                        {user.username || "—"}
                      </TableCell>
                      <TableCell className="font-medium text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-xs font-semibold text-indigo-300">
                            {getInitials(user.fullName)}
                          </div>
                          {user.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] border-white/[0.06] bg-white/[0.04] text-slate-300"
                        >
                          {user.fingerprintId != null ? `Slot #${user.fingerprintId}` : "Unassigned"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium ${roleColors[user.role] || "border-white/[0.06] text-slate-400"}`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === "ACTIVE" ? "success" : "destructive"}
                          className="text-[10px] px-2 py-0.5"
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditTarget(user)}
                            className="text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteTarget({ id: user.id, fullName: user.fullName })
                            }
                            className="text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <EnrollUserModal open={enrollOpen} onOpenChange={setEnrollOpen} />
      <EditUserModal
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        user={editTarget}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Revoke Access"
        description={`Are you sure you want to remove ${deleteTarget?.fullName}? This will free up their fingerprint slot.`}
        confirmLabel="Revoke Access"
        destructive
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}