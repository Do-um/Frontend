export const CAUGHT_HISTORY_STORAGE_KEY = "caughtHistoryV1"

export const CAUGHT_MODE_LABELS = {
  ai_excuse: "AI 핑계",
  bomb_pass: "폭탄 넘기기",
  ladder: "사다리 타기",
  roulette_manual: "룰렛",
  manual: "수동 기록",
} as const

export type CaughtMode = keyof typeof CAUGHT_MODE_LABELS

export type CaughtRecord = {
  id: string
  name: string
  normalizedName: string
  mode: CaughtMode
  createdAt: string
  detail?: string
}

export type LeaderboardEntry = {
  displayName: string
  normalizedName: string
  totalCount: number
  perModeCounts: Record<CaughtMode, number>
  lastCaughtAt: string
}

export type LadderRow = {
  index: number
  connections: boolean[]
}

export type LadderStructure = {
  playerCount: number
  rows: LadderRow[]
  loserSlotIndex: number
}

export type LadderPoint = {
  x: number
  y: number
}

export type LadderTrace = {
  startIndex: number
  endIndex: number
  path: string
  points: LadderPoint[]
}

export type LadderGeometry = {
  width: number
  height: number
  topY: number
  bottomY: number
  xPositions: number[]
  rowYPositions: number[]
}

export const AI_EXCUSE_TEMPLATES = [
  "{name}는 오늘 이상하게 자신감이 넘쳤기 때문에 걸림 ㅋ",
  "{name}는 방금 안 걸릴 것 같은 표정을 지어서 더 수상함",
  "{name}의 최근 행동 패턴을 분석한 결과 이미 끝난 상태임",
  "{name}는 오늘 운이 좋다고 믿은 순간부터 위험했음",
  "{name}는 괜히 여유로워 보여서 시스템이 바로 감지함",
  "{name}는 지금 이 자리에서 가장 드립 맞을 상이라 걸림",
  "{name}는 통계적으로 오늘 한 번쯤 걸릴 얼굴임",
  "{name}는 너무 조용해서 오히려 레이더에 잡힘",
  "{name}는 방금 눈빛에서 수상한 신호가 포착됨",
  "{name}는 안 걸릴 거라고 확신한 죄로 걸림",
  "{name}는 분위기를 너무 편하게 즐겨서 바로 당첨",
  "{name}는 오늘 웃은 횟수가 많아서 시스템이 선택함",
  "{name}는 괜히 주변을 둘러본 시점에서 이미 늦었음",
  "{name}는 이 상황을 재미있어한 대가를 치르게 됨",
  "{name}는 운세가 좋다고 믿었지만 그게 함정이었음",
  "{name}는 존재감 조절에 실패해서 바로 걸림",
  "{name}는 지금 가장 무난해서 오히려 가장 위험했음",
  "{name}는 오늘따라 평온해 보여서 불길했음",
  "{name}는 마음의 준비가 덜 되어 보여서 시스템이 픽함",
  "{name}는 이유는 모르겠는데 아무튼 지금이 타이밍이었음",
  "{name}는 방금 미소가 너무 여유로워서 시스템이 질투함",
  "{name}는 오늘 주인공이 아니길 바랐지만 이미 늦었음",
  "{name}는 살짝 들뜬 기운이 감지돼서 바로 후보 1순위가 됨",
  "{name}는 여기서 안 걸리면 오히려 밸런스가 안 맞는다고 판정남",
] as const

const CAUGHT_MODES = Object.keys(CAUGHT_MODE_LABELS) as CaughtMode[]

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function isCaughtMode(value: unknown): value is CaughtMode {
  return typeof value === "string" && CAUGHT_MODES.includes(value as CaughtMode)
}

function isValidDateString(value: string) {
  return !Number.isNaN(new Date(value).getTime())
}

export function normalizeName(name: string) {
  const collapsed = collapseWhitespace(name)
  return collapsed ? collapsed.toLowerCase() : ""
}

export function sanitizeDisplayName(name: string) {
  return collapseWhitespace(name)
}

export function parseParticipantNames(rawValue: string) {
  const names = rawValue
    .split(/[\n,]/)
    .map((part) => sanitizeDisplayName(part))
    .filter(Boolean)

  if (names.length === 0) {
    return {
      names,
      error: "이름을 2명 이상 입력해 주세요",
    }
  }

  if (names.length === 1) {
    return {
      names,
      error: "최소 2명 이상 필요합니다",
    }
  }

  if (names.length > 12) {
    return {
      names,
      error: "이름은 최대 12명까지 입력할 수 있습니다",
    }
  }

  return {
    names,
    error: "",
  }
}

export function createEmptyModeCounts(): Record<CaughtMode, number> {
  return {
    ai_excuse: 0,
    bomb_pass: 0,
    ladder: 0,
    roulette_manual: 0,
    manual: 0,
  }
}

export function createCaughtRecord(input: {
  name: string
  mode: CaughtMode
  detail?: string
}): CaughtRecord {
  const displayName = sanitizeDisplayName(input.name)
  const normalizedName = normalizeName(displayName)

  if (!normalizedName) {
    throw new Error("걸린 사람 이름을 입력해 주세요")
  }

  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: displayName,
    normalizedName,
    mode: input.mode,
    createdAt: new Date().toISOString(),
    detail: sanitizeDisplayName(input.detail ?? "") || undefined,
  }
}

function sanitizeRecord(input: unknown): CaughtRecord | null {
  if (typeof input !== "object" || input === null) {
    return null
  }

  const candidate = input as Partial<CaughtRecord>
  const displayName = sanitizeDisplayName(candidate.name ?? "")
  const normalizedName = normalizeName(displayName)
  const mode = candidate.mode
  const createdAt = typeof candidate.createdAt === "string" && isValidDateString(candidate.createdAt)
    ? new Date(candidate.createdAt).toISOString()
    : ""

  if (!normalizedName || !isCaughtMode(mode) || !createdAt) {
    return null
  }

  return {
    id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : `${createdAt}-${normalizedName}`,
    name: displayName,
    normalizedName,
    mode,
    createdAt,
    detail:
      typeof candidate.detail === "string" && sanitizeDisplayName(candidate.detail)
        ? sanitizeDisplayName(candidate.detail)
        : undefined,
  }
}

export function loadCaughtHistory() {
  if (typeof window === "undefined") {
    return [] as CaughtRecord[]
  }

  try {
    const rawValue = window.localStorage.getItem(CAUGHT_HISTORY_STORAGE_KEY)
    if (!rawValue) {
      return []
    }

    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((item) => sanitizeRecord(item)).filter((item): item is CaughtRecord => item !== null)
  } catch {
    return []
  }
}

export function saveCaughtHistory(history: CaughtRecord[]) {
  if (typeof window === "undefined") {
    return
  }

  if (history.length === 0) {
    window.localStorage.removeItem(CAUGHT_HISTORY_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(CAUGHT_HISTORY_STORAGE_KEY, JSON.stringify(history))
}

export function buildLeaderboard(history: CaughtRecord[]) {
  const grouped = new Map<string, LeaderboardEntry>()

  for (const record of history) {
    const current = grouped.get(record.normalizedName)

    if (!current) {
      grouped.set(record.normalizedName, {
        displayName: record.name,
        normalizedName: record.normalizedName,
        totalCount: 1,
        perModeCounts: {
          ...createEmptyModeCounts(),
          [record.mode]: 1,
        },
        lastCaughtAt: record.createdAt,
      })
      continue
    }

    current.totalCount += 1
    current.perModeCounts[record.mode] += 1

    if (record.createdAt >= current.lastCaughtAt) {
      current.lastCaughtAt = record.createdAt
      current.displayName = record.name
    }
  }

  return [...grouped.values()].sort((left, right) => {
    if (left.totalCount !== right.totalCount) {
      return right.totalCount - left.totalCount
    }

    if (left.lastCaughtAt !== right.lastCaughtAt) {
      return right.lastCaughtAt.localeCompare(left.lastCaughtAt)
    }

    return left.displayName.localeCompare(right.displayName, "ko-KR")
  })
}

export function getRecentHistory(history: CaughtRecord[], limit = 5) {
  return [...history].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, limit)
}

export function buildRecentHistoryMap(history: CaughtRecord[], limit = 5) {
  const sorted = getRecentHistory(history, history.length)
  const recentMap = new Map<string, CaughtRecord[]>()

  for (const record of sorted) {
    const current = recentMap.get(record.normalizedName) ?? []

    if (current.length >= limit) {
      continue
    }

    current.push(record)
    recentMap.set(record.normalizedName, current)
  }

  return recentMap
}

export function createLadderStructure(playerCount: number): LadderStructure {
  const rowCount = Math.max(8, Math.min(15, playerCount * 2 + 2))
  const rows: LadderRow[] = []
  let hasConnection = false

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const connections = Array.from({ length: Math.max(0, playerCount - 1) }, () => false)

    for (let connectionIndex = 0; connectionIndex < connections.length; connectionIndex += 1) {
      if (connectionIndex > 0 && connections[connectionIndex - 1]) {
        continue
      }

      const shouldConnect = Math.random() < (playerCount <= 4 ? 0.42 : 0.3)
      if (shouldConnect) {
        connections[connectionIndex] = true
        hasConnection = true
        connectionIndex += 1
      }
    }

    rows.push({
      index: rowIndex,
      connections,
    })
  }

  if (!hasConnection && playerCount > 1) {
    const fallbackRowIndex = Math.floor(Math.random() * rows.length)
    const fallbackConnectionIndex = Math.floor(Math.random() * (playerCount - 1))
    rows[fallbackRowIndex].connections[fallbackConnectionIndex] = true
  }

  return {
    playerCount,
    rows,
    loserSlotIndex: Math.floor(Math.random() * playerCount),
  }
}

export function createLadderGeometry(playerCount: number, rowCount: number): LadderGeometry {
  const horizontalGap = 132
  const paddingX = 76
  const topY = 24
  const rowGap = 44
  const bottomY = topY + rowGap * (rowCount + 1)
  const xPositions = Array.from({ length: playerCount }, (_, index) => paddingX + horizontalGap * index)
  const rowYPositions = Array.from({ length: rowCount }, (_, index) => topY + rowGap * (index + 1))

  return {
    width: paddingX * 2 + horizontalGap * Math.max(0, playerCount - 1),
    height: bottomY + 28,
    topY,
    bottomY,
    xPositions,
    rowYPositions,
  }
}

export function getLadderEndIndex(structure: LadderStructure, startIndex: number) {
  let currentIndex = startIndex

  for (const row of structure.rows) {
    if (row.connections[currentIndex]) {
      currentIndex += 1
      continue
    }

    if (currentIndex > 0 && row.connections[currentIndex - 1]) {
      currentIndex -= 1
    }
  }

  return currentIndex
}

export function buildLadderTraces(structure: LadderStructure, geometry: LadderGeometry) {
  return Array.from({ length: structure.playerCount }, (_, startIndex) => {
    let currentIndex = startIndex
    const points: LadderPoint[] = [{ x: geometry.xPositions[currentIndex], y: geometry.topY }]

    for (const row of structure.rows) {
      const rowY = geometry.rowYPositions[row.index]
      points.push({ x: geometry.xPositions[currentIndex], y: rowY })

      if (row.connections[currentIndex]) {
        currentIndex += 1
        points.push({ x: geometry.xPositions[currentIndex], y: rowY })
        continue
      }

      if (currentIndex > 0 && row.connections[currentIndex - 1]) {
        currentIndex -= 1
        points.push({ x: geometry.xPositions[currentIndex], y: rowY })
      }
    }

    points.push({ x: geometry.xPositions[currentIndex], y: geometry.bottomY })

    return {
      startIndex,
      endIndex: currentIndex,
      points,
      path: points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" "),
    } satisfies LadderTrace
  })
}
