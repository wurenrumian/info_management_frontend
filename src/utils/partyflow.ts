export function compareIsoDesc(a?: string | null, b?: string | null): number {
  return String(b || '').localeCompare(String(a || ''))
}

export function formatDateTime(iso?: string | null): string {
  const raw = String(iso || '').trim()
  if (!raw) {
    return '-'
  }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) {
    return raw
  }
  const pad2 = (v: number) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
