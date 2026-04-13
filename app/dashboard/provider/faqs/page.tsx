"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Loader2, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useAuth } from "@/components/AuthProvider"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import {
  addProviderFaq,
  updateProviderFaq,
  deleteProviderFaq,
} from "./actions"

type FaqItem = {
  id: string
  question: string
  answer: string
  sort_order: number
}

export default function FaqsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null)
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [editQuestion, setEditQuestion] = useState("")
  const [editAnswer, setEditAnswer] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [faqToDelete, setFaqToDelete] = useState<FaqItem | null>(null)

  const fetchFaqs = useCallback(async () => {
    if (!user) {
      setFaqs([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
      const { data, error: fetchError } = await supabase
        .from("provider_faqs")
        .select("id, question, answer, sort_order")
        .eq("provider_profile_id", providerProfileId)
        .order("sort_order", { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
        setFaqs([])
        return
      }

      setFaqs((data ?? []) as FaqItem[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FAQs")
      setFaqs([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchFaqs()
  }, [fetchFaqs])

  const handleAdd = async () => {
    setSaving(true)
    const result = await addProviderFaq(newQuestion, newAnswer)
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setNewQuestion("")
      setNewAnswer("")
      setAddDialogOpen(false)
      await fetchFaqs()
      toast({ title: "FAQ added", variant: "success" })
    }
    setSaving(false)
  }

  const openEdit = (faq: FaqItem) => {
    setEditingFaq(faq)
    setEditQuestion(faq.question)
    setEditAnswer(faq.answer)
    setEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!editingFaq) return
    setSaving(true)
    const result = await updateProviderFaq(editingFaq.id, editQuestion, editAnswer)
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setEditDialogOpen(false)
      setEditingFaq(null)
      await fetchFaqs()
      toast({ title: "FAQ updated", variant: "success" })
    }
    setSaving(false)
  }

  const handleDeleteClick = (faq: FaqItem) => {
    setFaqToDelete(faq)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!faqToDelete) return
    const result = await deleteProviderFaq(faqToDelete.id)
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setDeleteDialogOpen(false)
      setFaqToDelete(null)
      await fetchFaqs()
      toast({ title: "FAQ deleted", variant: "success" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQs</h1>
          <p className="text-muted-foreground">
            Add frequently asked questions to help parents learn more about your program (optional)
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add FAQ</DialogTitle>
              <DialogDescription>
                Add a question and answer that parents will see on your provider profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-question">Question</Label>
                <Input
                  id="new-question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. What are the enrollment requirements?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-answer">Answer</Label>
                <Textarea
                  id="new-answer"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="e.g. We require a completed application, immunization records..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={saving || !newQuestion.trim() || !newAnswer.trim()}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    "Add FAQ"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Your FAQs</CardTitle>
          <CardDescription>
            These FAQs appear on your public provider profile in the FAQs tab. Adding FAQs is optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-foreground mb-1">No FAQs yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                FAQs are optional. Add them to help parents learn about common questions like enrollment, policies, and more.
              </p>
              <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add your first FAQ
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <div className="flex items-center gap-2">
                    <AccordionTrigger className="flex-1 text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(faq)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(faq)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update the question and answer for this FAQ.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-question">Question</Label>
              <Input
                id="edit-question"
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                placeholder="e.g. What are the enrollment requirements?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-answer">Answer</Label>
              <Textarea
                id="edit-answer"
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                placeholder="e.g. We require a completed application..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={saving || !editQuestion.trim() || !editAnswer.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {faqToDelete && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) setFaqToDelete(null)
          }}
          title="Delete FAQ?"
          description="This FAQ will be removed from your provider profile."
          itemName={faqToDelete.question}
          variant="delete"
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}
