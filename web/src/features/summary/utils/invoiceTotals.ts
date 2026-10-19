export function formatMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}

export function monthLabel(month: string | null, locale: string) {
  const date = month && /^\d{4}-\d{2}$/.test(month) ? new Date(`${month}-01T12:00:00`) : new Date()
  return date.toLocaleDateString(locale, { month: "long" })
}

export const deltaPercent = (total: number, previous: number | null) => (previous && previous > 0 ? Math.round(((total - previous) / previous) * 100) : null)
