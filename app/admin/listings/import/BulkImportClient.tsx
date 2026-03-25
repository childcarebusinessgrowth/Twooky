"use client"

import { useMemo, useState, useTransition } from "react"
import { Download, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

type ImportRowResult =
  | { rowNumber: number; status: "created"; profileId: string; slug: string }
  | { rowNumber: number; status: "skipped"; reason: string }
  | { rowNumber: number; status: "failed"; error: string }

type ImportResponse =
  | { ok: true; summary: { total: number; created: number; skipped: number; failed: number }; results: ImportRowResult[] }
  | { error: string }

export function BulkImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<ImportResponse | null>(null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = () => {
    setError(null)
    setResponse(null)
    if (!file) {
      setError("Please choose a .csv or .xlsx file to upload.")
      return
    }
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set("file", file)
        const res = await fetch("/api/admin/listings/import", { method: "POST", body: fd })
        const json = (await res.json()) as ImportResponse
        if (!res.ok) {
          setError("error" in json ? json.error : "Import failed.")
          setResponse(json)
          return
        }
        setResponse(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed.")
      }
    })
  }

  const results = useMemo(() => {
    if (!response || !("ok" in response) || !response.ok) return null
    return response.results
  }, [response])

  const summary = useMemo(() => {
    if (!response || !("ok" in response) || !response.ok) return null
    return response.summary
  }, [response])

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>1) Download template</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/admin/listings/import/template.csv">
              <Download className="h-4 w-4 mr-2" />
              Download CSV template
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/admin/listings/import/template.xlsx">
              <Download className="h-4 w-4 mr-2" />
              Download Excel template
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>2) Upload file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Input
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={isPending}
            />
            <Button onClick={onSubmit} disabled={isPending || !file}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Import
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {summary && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Total: {summary.total}</Badge>
              <Badge className="bg-emerald-600 hover:bg-emerald-600">Created: {summary.created}</Badge>
              <Badge variant="outline">Skipped: {summary.skipped}</Badge>
              <Badge variant="destructive">Failed: {summary.failed}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Import results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Row</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={`${r.status}-${r.rowNumber}`}>
                    <TableCell className="font-mono text-xs">{r.rowNumber}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "created" ? "default" : r.status === "skipped" ? "secondary" : "destructive"
                        }
                        className={r.status === "created" ? "bg-emerald-600 hover:bg-emerald-600" : ""}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.status === "created" ? (
                        <span>
                          Created{" "}
                          <a className="underline" href={`/admin/listings/${r.profileId}`}>
                            {r.slug}
                          </a>
                        </span>
                      ) : r.status === "skipped" ? (
                        r.reason
                      ) : (
                        r.error
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

