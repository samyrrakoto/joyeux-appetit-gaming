export function formatNightDate(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1)
  const text = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function formatMonthYear(isoDate: string) {
  const [y, m] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(y!, (m ?? 1) - 1, 1))
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count > 1 ? pluralForm : singular}`
}

export function ordinal(rank: number) {
  return rank === 1 ? '1er' : `${rank}e`
}
