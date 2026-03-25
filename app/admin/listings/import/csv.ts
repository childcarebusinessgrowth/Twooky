export function parseCsvToRows(csvText: string): string[][] {
  const text = csvText.replace(/^\uFEFF/, "")

  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  const pushCell = () => {
    row.push(cell)
    cell = ""
  }

  const pushRow = () => {
    // Ignore trailing completely empty row at end of file
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = []
      return
    }
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1]
        if (next === '"') {
          cell += '"'
          i += 1
          continue
        }
        inQuotes = false
        continue
      }
      cell += ch
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ",") {
      pushCell()
      continue
    }

    if (ch === "\r") {
      const next = text[i + 1]
      if (next === "\n") i += 1
      pushCell()
      pushRow()
      continue
    }

    if (ch === "\n") {
      pushCell()
      pushRow()
      continue
    }

    cell += ch
  }

  pushCell()
  pushRow()

  return rows
}

