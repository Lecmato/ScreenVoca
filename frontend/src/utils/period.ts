// Preset period labels are anchored to a base week-offset chosen at creation time.
// Each elapsed week since creation shifts the effective offset up by one, so a
// session saved as "1 Week Ago" automatically reads as "2 Weeks Ago" a week later.

const WEEK_LABELS = ['This Week', '1 Week Ago', '2 Weeks Ago', '3 Weeks Ago']

export function computeEffectiveOffsetWeeks(
  baseOffsetWeeks: number | null | undefined,
  createdAt: string | null | undefined
): number | null {
  if (baseOffsetWeeks === null || baseOffsetWeeks === undefined) return null
  if (!createdAt) return baseOffsetWeeks

  const daysElapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  const weeksElapsed = Math.max(0, Math.floor(daysElapsed / 7))
  return baseOffsetWeeks + weeksElapsed
}

export function computePeriodLabel(
  periodLabel: string,
  baseOffsetWeeks: number | null | undefined,
  createdAt: string | null | undefined
): string {
  const effective = computeEffectiveOffsetWeeks(baseOffsetWeeks, createdAt)
  if (effective === null) return periodLabel

  if (effective < WEEK_LABELS.length) return WEEK_LABELS[effective]
  const months = Math.floor(effective / 4)
  return `${months} Month${months > 1 ? 's' : ''} Ago`
}
