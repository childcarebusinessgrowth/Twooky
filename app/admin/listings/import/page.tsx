import { BulkImportClient } from "./BulkImportClient"

export default function AdminBulkImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bulk Import Providers</h1>
        <p className="text-muted-foreground">
          Import providers from a CSV/Excel template. Images are not included , add photos after the listing is created.
        </p>
      </div>

      <BulkImportClient />
    </div>
  )
}

