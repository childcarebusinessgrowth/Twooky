"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Edit2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ProgramTypeEditor,
  type AgeGroupOption,
  type ProgramTypeFormData,
} from "@/components/admin/program-type-editor"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  createProgramType,
  deleteProgramType,
  getProgramTypeWithDetails,
  updateProgramType,
} from "./actions"

type ProgramTypeRecord = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  age_group_ids: string[] | null
}

type Props = {
  initialProgramTypes: ProgramTypeRecord[]
  initialAgeGroups: AgeGroupOption[]
}

export function AdminProgramTypesPageClient({
  initialProgramTypes,
  initialAgeGroups,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ProgramTypeRecord | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<ProgramTypeFormData> | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const openCreateDialog = useCallback(() => {
    setEditingId(null)
    setEditFormData(null)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((item: ProgramTypeRecord) => {
    setEditingId(item.id)
    setEditFormData(null)
    setDialogOpen(true)
    setLoadingDetails(true)
    getProgramTypeWithDetails(item.id)
      .then((details) => {
        if (details) {
          setEditFormData({
            name: details.name,
            isActive: details.is_active,
            shortDescription: details.short_description ?? "",
            aboutText: details.about_text ?? "",
            ageGroupIds: details.age_group_ids ?? [],
            keyBenefits: details.key_benefits ?? [],
            faqs: details.faqs.map((f) => ({ question: f.question, answer: f.answer })),
          })
        }
      })
      .finally(() => setLoadingDetails(false))
  }, [])

  const handleSave = useCallback(
    async (data: ProgramTypeFormData) => {
      if (editingId) {
        await updateProgramType(editingId, {
          name: data.name,
          isActive: data.isActive,
          shortDescription: data.shortDescription || null,
          aboutText: data.aboutText || null,
          ageGroupIds: data.ageGroupIds,
          keyBenefits: data.keyBenefits,
          faqs: data.faqs.map((f, i) => ({
            question: f.question,
            answer: f.answer,
            sortOrder: i,
          })),
        })
      } else {
        await createProgramType({
          name: data.name,
          isActive: data.isActive,
          shortDescription: data.shortDescription || null,
          aboutText: data.aboutText || null,
          ageGroupIds: data.ageGroupIds,
          keyBenefits: data.keyBenefits,
          faqs: data.faqs.map((f, i) => ({
            question: f.question,
            answer: f.answer,
            sortOrder: i,
          })),
        })
      }
      setDialogOpen(false)
      toast({
        title: editingId ? "Program type updated." : "Program type added.",
        variant: "success",
      })
      router.refresh()
    },
    [editingId, toast, router]
  )

  const handleSubmit = useCallback(
    async (data: ProgramTypeFormData) => {
      setIsSubmitting(true)
      try {
        await handleSave(data)
      } finally {
        setIsSubmitting(false)
      }
    },
    [handleSave]
  )

  const handleDeleteClick = (item: ProgramTypeRecord) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    try {
      await deleteProgramType(itemToDelete.id)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      toast({ title: "Program type removed.", variant: "success" })
      router.refresh()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to delete program type.",
        variant: "destructive",
      })
    }
  }

  const showEditor = !loadingDetails && (editingId === null || editFormData !== null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Program Types
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage program categories used by providers across the directory. Add about text, key
          benefits, and FAQs for each program type.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Program Types</CardTitle>
            <CardDescription>
              Control the program type options shown in forms and filters.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreateDialog} disabled={isSubmitting}>
            <Plus className="h-4 w-4 mr-2" />
            Add Program Type
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Age</TableHead>
                <TableHead className="hidden md:table-cell">Active</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialProgramTypes.map((item) => {
                const ageLabels =
                  (item.age_group_ids ?? [])
                    .map(
                      (id) => initialAgeGroups.find((ag) => ag.id === id)?.age_range
                    )
                    .filter(Boolean) ?? []
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {ageLabels.length > 0 ? ageLabels.join(", ") : ","}
                    </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.is_active ? (
                      <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(item)}
                      disabled={isSubmitting}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteClick(item)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                )
              })}
              {initialProgramTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                    No program types configured yet. Add your first program type to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Program Type" : "Add Program Type"}</DialogTitle>
            <DialogDescription>
              Manage the program type and its rich content (about, benefits, FAQs).
            </DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : showEditor ? (
            <ProgramTypeEditor
              key={editingId ?? "new"}
              ageGroups={initialAgeGroups}
              initialData={editingId ? editFormData ?? undefined : undefined}
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
              isPending={isSubmitting}
              isEdit={!!editingId}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete program type?"
        description="This will remove it from the list."
        itemName={itemToDelete?.name}
        variant="delete"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
