import { requireAdminUser, requireRentalUser } from "@/lib/auth"
import { createCaughtRecord, sanitizeDisplayName, type CaughtRecord, type CaughtMode } from "@/lib/bet-game"
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase"

type BetCaughtHistoryRow = {
  id: string
  name: string
  normalized_name: string
  mode: CaughtMode
  detail: string | null
  created_at: string
  created_by_public_user_id: number | null
}

function getSupabase() {
  return getSupabaseBrowserClient()
}

function formatBetHistoryErrorMessage(error: { message: string } | null, fallbackMessage: string) {
  const message = error?.message?.trim()

  if (!message) {
    return fallbackMessage
  }

  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes("permission denied") || normalizedMessage.includes("row-level security")) {
    return `${fallbackMessage} Supabase RLS 정책, 테이블 GRANT 권한, 마이그레이션 적용 여부를 확인해 주세요.`
  }

  if (normalizedMessage.includes("does not exist") || normalizedMessage.includes("schema cache")) {
    return `${fallbackMessage} Supabase에 bet_caught_history 테이블 마이그레이션이 아직 반영되지 않았습니다.`
  }

  return message
}

function throwIfError(error: { message: string } | null, fallbackMessage: string): asserts error is null {
  if (error) {
    throw new Error(formatBetHistoryErrorMessage(error, fallbackMessage))
  }
}

function mapBetCaughtHistoryRow(row: BetCaughtHistoryRow): CaughtRecord {
  return {
    id: row.id,
    name: sanitizeDisplayName(row.name),
    normalizedName: row.normalized_name,
    mode: row.mode,
    createdAt: new Date(row.created_at).toISOString(),
    detail: row.detail ? sanitizeDisplayName(row.detail) : undefined,
  }
}

export function isPersistentBetHistoryAvailable() {
  return hasSupabaseEnv()
}

export async function fetchPersistentCaughtHistory() {
  await requireRentalUser()

  const { data, error } = await getSupabase()
    .from("bet_caught_history")
    .select("id, name, normalized_name, mode, detail, created_at, created_by_public_user_id")
    .order("created_at", { ascending: true })

  throwIfError(error, "명예의 전당 기록을 불러오지 못했습니다.")

  return ((data ?? []) as BetCaughtHistoryRow[]).map(mapBetCaughtHistoryRow)
}

export async function createPersistentCaughtHistoryRecord(input: {
  name: string
  mode: CaughtMode
  detail?: string
}) {
  const currentUser = await requireRentalUser()
  const nextRecord = createCaughtRecord(input)

  const { data, error } = await getSupabase()
    .from("bet_caught_history")
    .insert({
      id: nextRecord.id,
      name: nextRecord.name,
      normalized_name: nextRecord.normalizedName,
      mode: nextRecord.mode,
      detail: nextRecord.detail ?? null,
      created_at: nextRecord.createdAt,
      created_by_public_user_id: currentUser.id,
    })
    .select("id, name, normalized_name, mode, detail, created_at, created_by_public_user_id")
    .single()

  throwIfError(error, "명예의 전당 기록을 저장하지 못했습니다.")

  return mapBetCaughtHistoryRow(data as BetCaughtHistoryRow)
}

export async function clearPersistentCaughtHistory() {
  await requireAdminUser()

  const { error } = await getSupabase().from("bet_caught_history").delete().not("id", "is", null)
  throwIfError(error, "명예의 전당 기록을 초기화하지 못했습니다.")
}
