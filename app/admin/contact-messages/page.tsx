import { loadContactMessages } from "@/lib/admin-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MessageCircle } from "lucide-react"
import { ContactMessageCell } from "./ContactMessageCell"
import { ContactMessageDeleteButton } from "./ContactMessageDeleteButton"
import { ContactMessageStatusCell } from "./ContactMessageStatusCell"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default async function AdminContactMessagesPage() {
  const { messages, error } = await loadContactMessages()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contact messages</h1>
        <p className="text-muted-foreground">
          Submissions from the site contact form
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            All messages
          </CardTitle>
          <CardDescription>
            Latest {messages.length} contact form submissions, newest first
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No contact messages yet
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[140px]">Name</TableHead>
                    <TableHead className="w-[180px]">Email</TableHead>
                    <TableHead className="w-[120px]">Phone</TableHead>
                    <TableHead className="min-w-0 w-[240px] max-w-[240px]">Message</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[80px]">Consent</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                        {formatDate(row.created_at)}
                      </TableCell>
                      <TableCell className="font-medium truncate" title={row.name}>
                        {row.name}
                      </TableCell>
                      <TableCell className="min-w-0">
                        <a
                          href={`mailto:${row.email}`}
                          className="text-primary hover:underline truncate block"
                          title={row.email}
                        >
                          {row.email}
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap truncate" title={row.phone ?? undefined}>
                        {row.phone || "—"}
                      </TableCell>
                      <TableCell className="min-w-0 w-[240px] max-w-[240px]">
                        <ContactMessageCell message={row.message} />
                      </TableCell>
                      <TableCell>
                        <ContactMessageStatusCell
                          id={row.id}
                          status={row.handled_status}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.consent_to_contact ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ContactMessageDeleteButton id={row.id} senderName={row.name} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
