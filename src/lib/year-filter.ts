function normalizeDateToken(value?: string | null) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01`
  }

  const normalized = trimmed.replace(/\./g, "-").replace(/\//g, "-")
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

  if (isoDatePattern.test(normalized)) {
    return normalized
  }

  const dateTimePrefix = normalized.slice(0, 10)
  if (isoDatePattern.test(dateTimePrefix)) {
    return dateTimePrefix
  }

  return null
}

function sortYearsAscending(years: string[]) {
  return Array.from(new Set(years)).sort((left, right) => Number(left) - Number(right))
}

function buildYearRange(startYear?: string | null, endYear?: string | null) {
  const start = startYear ? Number(startYear) : Number.NaN
  const end = endYear ? Number(endYear) : Number.NaN

  if (Number.isFinite(start) && Number.isFinite(end)) {
    const from = Math.min(start, end)
    const to = Math.max(start, end)
    const years: string[] = []

    for (let year = from; year <= to; year += 1) {
      years.push(String(year))
    }

    return years
  }

  if (Number.isFinite(start)) {
    return [String(start)]
  }

  if (Number.isFinite(end)) {
    return [String(end)]
  }

  return [] as string[]
}

function extractYearsFromText(value: string) {
  return sortYearsAscending(value.match(/(?:19|20)\d{2}/g) ?? [])
}

export function getStartYearFromRangeValue(value?: string | null) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  const parts = trimmed
    .split("~")
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length) {
    const normalizedFirstPart = normalizeDateToken(parts[0])
    if (normalizedFirstPart) {
      return normalizedFirstPart.slice(0, 4)
    }

    const yearsFromFirstPart = extractYearsFromText(parts[0])
    if (yearsFromFirstPart.length) {
      return yearsFromFirstPart[0]
    }
  }

  const normalizedDate = normalizeDateToken(trimmed)
  if (normalizedDate) {
    return normalizedDate.slice(0, 4)
  }

  return extractYearsFromText(trimmed)[0] ?? null
}

export function getYearsFromRangeValue(value?: string | null) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return [] as string[]
  }

  const parts = trimmed
    .split("~")
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    const yearsFromRange = buildYearRange(
      normalizeDateToken(parts[0])?.slice(0, 4) ?? extractYearsFromText(parts[0])[0] ?? null,
      normalizeDateToken(parts[parts.length - 1])?.slice(0, 4) ??
        extractYearsFromText(parts[parts.length - 1]).slice(-1)[0] ??
        null,
    )

    if (yearsFromRange.length) {
      return yearsFromRange
    }
  }

  const normalizedDate = normalizeDateToken(trimmed)
  if (normalizedDate) {
    return [normalizedDate.slice(0, 4)]
  }

  return extractYearsFromText(trimmed)
}

export function getStartYearFromPeriod(start?: string | null, end?: string | null, fallback?: string | null) {
  const startYear = normalizeDateToken(start)?.slice(0, 4)
  if (startYear) {
    return startYear
  }

  const endYear = normalizeDateToken(end)?.slice(0, 4)
  if (endYear) {
    return endYear
  }

  return getStartYearFromRangeValue(fallback)
}

export function getYearsFromPeriod(start?: string | null, end?: string | null, fallback?: string | null) {
  const years = buildYearRange(normalizeDateToken(start)?.slice(0, 4), normalizeDateToken(end)?.slice(0, 4))

  if (years.length) {
    return years
  }

  const startYear = normalizeDateToken(start)?.slice(0, 4)
  if (startYear) {
    return [startYear]
  }

  const endYear = normalizeDateToken(end)?.slice(0, 4)
  if (endYear) {
    return [endYear]
  }

  return getYearsFromRangeValue(fallback)
}

export function formatYearTagLabel(years: string[]) {
  const sortedYears = sortYearsAscending(years)

  if (!sortedYears.length) {
    return "미정"
  }

  if (sortedYears.length === 1) {
    return sortedYears[0]
  }

  return `${sortedYears[0]} ~ ${sortedYears[sortedYears.length - 1]}`
}

export function sortYearsForFilter(years: string[]) {
  return sortYearsAscending(years).reverse()
}
