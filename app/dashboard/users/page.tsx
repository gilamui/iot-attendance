"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getUsers, deleteUser } from "@/lib/api"
import { useMqtt } from "@/components/mqtt-provider"
import { getInitials } from "@/lib/utils"
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

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    full_name: string
  } | null>(null)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const { publishCommand, connected } = useMqtt()

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  })

  const deleteMutation = useMutation({
    mutationFn: async (user: { id: string; fingerprint_id: number | null }) => {
      await deleteUser(user.id)
      if (user.fingerprint_id != null && connected) {
        publishCommand("office-01", {
          action: "delete_fingerprint",
          fingerprint_id: user.fingerprint_id,
        })
      }
    },
    onSuccess: () => {
      toast.success("User access revoked and fingerprint slot freed")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to revoke access")
    },
  })

  return (
    <>
      {/* Page Header */}
      <div className="pt-8 mb-4">
        <h1 className="font-display-lg text-display-lg text-on-surface lg:text-[48px] text-[32px] mb-2 tracking-tight">
          Users & Fingerprints
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Manage enrolled employees and their hardware fingerprint slots
        </p>
      </div>

      {/* Enroll Button */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setEnrollOpen(true)}
          className="rounded-xl bg-primary text-on-primary hover:bg-primary/80 font-label-md"
        >
          <span className="material-symbols-outlined text-[16px] mr-1">person_add</span>
          Enroll New
        </Button>
      </div>

      {/* Users Table Card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface/30">
          <div className="flex items-center gap-3">
            <h3 className="font-headline-md text-headline-md text-on-surface">Employee Directory</h3>
            {users && (
              <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                {users.length} total
              </span>
            )}
          </div>
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            fingerprint
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-surface-container" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-error">
            Failed to load users. Check Supabase connection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Username</TableHead>
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Full Name</TableHead>
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Fingerprint ID</TableHead>
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Role</TableHead>
                  <TableHead className="font-label-md text-xs text-on-surface-variant tracking-wider">Status</TableHead>
                  <TableHead className="w-[120px] font-label-md text-xs text-on-surface-variant tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-body-sm divide-y divide-white/5">
                {users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-on-surface-variant py-8">
                      No users enrolled yet
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-mono-sm text-xs text-on-surface-variant">
                        {user.username || "—"}
                      </TableCell>
                      <TableCell className="text-on-surface font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center text-primary font-semibold text-xs">
                            {getInitials(user.full_name)}
                          </div>
                          {user.full_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center font-mono-sm text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-white/10">
                          {user.fingerprint_id != null
                            ? `Slot #${user.fingerprint_id}`
                            : "Unassigned"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          user.role === "ADMIN"
                            ? "bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          user.status === "ACTIVE"
                            ? "bg-secondary/10 text-secondary border-secondary/20"
                            : "bg-error/10 text-error border-error/20"
                        }`}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditTarget(user)}
                            className="text-on-surface-variant hover:text-primary hover:bg-primary/10"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteTarget({
                                id: user.id,
                                full_name: user.full_name,
                              })
                            }
                            className="text-on-surface-variant hover:text-error hover:bg-error/10"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
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
        description={`Are you sure you want to remove ${deleteTarget?.full_name}? This will free up their fingerprint slot.`}
        confirmLabel="Revoke Access"
        destructive
        onConfirm={() => {
          const user = users?.find((u) => u.id === deleteTarget?.id)
          if (deleteTarget && user) {
            deleteMutation.mutate({
              id: deleteTarget.id,
              fingerprint_id: user.fingerprint_id,
            })
          }
        }}
        loading={deleteMutation.isPending}
      />
    </>
  )
}
