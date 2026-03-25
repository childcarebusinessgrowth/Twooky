export function publicMessageForError(e: unknown, fallback: string) {
  if (process.env.NODE_ENV !== "production") {
    const message = e instanceof Error ? e.message : String(e)
    return message || fallback
  }
  return fallback
}

