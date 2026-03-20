import { getStoredAccessToken, normalizeUserRole, requireAdminUser, requireRentalUser, type NormalizedUserRole } from "@/lib/auth"
import { compressImagesForUpload } from "@/lib/image-compression"
import { getSupabaseBrowserClient, getSupabaseStorageBucket } from "@/lib/supabase"

export type ActivityItem = {
  id: number
  activityId: string
  description: string
  activityDate: string | null
  location: string | null
  participantNames: string[]
  participantCount: number | null
  activityImages: string[]
  createdAt: string
  updatedAt: string
}

export type ProjectItem = {
  projectId: string
  title: string
  summary: string
  description: string
  thumbnailUrl: string
  images: string[]
  tags: string[]
  teamName: string | null
  members: string[]
  period: {
    start: string | null
    end: string | null
  } | null
  links: {
    github: string | null
    demo: string | null
    notion: string | null
  } | null
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export type ClubContent = {
  introTitle: string
  introLead: string
  introDescription: string
  heroBannerImageUrl: string
  activitySectionTitle: string
  historySectionTitle: string
  studyCaption: string
  studyTitle: string
  learnTitle: string
  learnDescription: string
  growTitle: string
  growDescription: string
  shareTitle: string
  shareDescription: string
  studyImageUrl: string
  createdAt: string | null
  updatedAt: string | null
}

export type ClubProgramItem = {
  id: number
  title: string
  description: string
  sortOrder: number
  createdAt: string | null
  updatedAt: string | null
}

export type RecruitContent = {
  overviewTitle: string
  overviewDescription: string
  applicationPeriodTitle: string
  applicationStart: string
  applicationEnd: string
  interviewPeriodTitle: string
  interviewStart: string
  interviewEnd: string
  targetSectionTitle: string
  targetSectionDescription: string
  targetItems: string[]
  ctaTitle: string
  ctaButtonLabel: string
  applyUrl: string
  createdAt: string | null
  updatedAt: string | null
}

export type StaffItem = {
  staffId: number
  userId: number | null
  name: string
  department: string
  role: string
  description: string
  profileImage: string
  githubUrl: string | null
  instagramUrl: string | null
}

export type RentalItem = {
  itemId: number
  name: string
  category: string
  description: string | null
  totalQuantity: number
  availableQuantity: number
  itemImage: string | null
  maxRentalDays: number
  status: string
  createdAt: string
  updatedAt: string
}

export type RentalRecord = {
  rentalId: number
  itemId: number
  userId: string
  quantity: number
  startDate: string
  endDate: string
  purpose: string
  status: string
  rentedAt: string
  returnedAt: string | null
}

export type UserRentalHistoryItem = {
  rentalId: number
  itemId: number
  itemName: string
  itemImage: string | null
  quantity: number
  rentalStatus: string
  startDate: string
  endDate: string
  purpose: string
  rentedAt: string
  returnedAt: string | null
  returned: boolean
}

export type RentalScheduleEntry = {
  rentalId: number
  quantity: number
  startDate: string
  endDate: string
  purpose: string | null
  reservedByName: string | null
}

export type ManagedUser = {
  id: number
  email: string
  name: string
  profileImageUrl: string | null
  provider: string
  role: NormalizedUserRole
  createdAt: string
  updatedAt: string
}

export type ActivityWritePayload = {
  activityId: string
  description: string
  activityDate: string | null
  location: string | null
  participantNames: string[]
  participantCount: number | null
  activityImages: string[]
}

export type ProjectWritePayload = {
  projectId?: string
  title: string
  summary: string
  description: string
  thumbnailUrl: string
  images: string[]
  tags: string[]
  teamName: string | null
  members: string[]
  period: {
    start: string | null
    end: string | null
  } | null
  links: {
    github: string | null
    demo: string | null
    notion: string | null
  } | null
  isPinned: boolean
}

export type ClubContentWritePayload = Omit<ClubContent, "createdAt" | "updatedAt">

export type ClubProgramWritePayload = {
  title: string
  description: string
  sortOrder: number
}

export type RecruitContentWritePayload = Omit<RecruitContent, "createdAt" | "updatedAt">

export type StaffWritePayload = {
  name: string
  department: string
  role: string
  description: string
  profileImage: string
  githubUrl: string | null
  instagramUrl: string | null
}

export type RentalCreatePayload = {
  itemId: number
  quantity: number
  startDate: string
  endDate: string
  purpose: string
}

export type RentalItemCreatePayload = {
  name: string
  category: string
  description: string
  itemImage: string
  totalQuantity: number
  maxRentalDays: number
}

export type RentalItemUpdatePayload = RentalItemCreatePayload & {
  status: string
}

type ProjectMutationResult = {
  projectId: string
}

type IntroduceRow = {
  id: number
  activity_id: string
  description: string
  activity_date: string | null
  location: string | null
  participant_count: number | null
  participant_names: string | null
  created_at: string
  updated_at: string
}

type IntroduceActivityImageRow = {
  id: number
  introduce_id: number
  image_url: string
  sort_order: number
}

type ProjectRow = {
  id: number
  project_id: string
  title: string
  summary: string
  description: string
  thumbnail_url: string
  team_name: string | null
  period_start: string | null
  period_end: string | null
  link_github: string | null
  link_demo: string | null
  link_notion: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
}

type ProjectImageRow = {
  project_pk: number
  image_url: string
}

type ProjectTagRow = {
  project_pk: number
  tag: string
}

type ProjectMemberRow = {
  project_pk: number
  member_name: string
}

type ClubContentRow = {
  id: number
  intro_title: string
  intro_lead: string
  intro_description: string
  activity_section_title: string
  history_section_title: string
  study_caption: string
  study_title: string
  learn_title: string
  learn_description: string
  grow_title: string
  grow_description: string
  share_title: string
  share_description: string
  hero_banner_image_url: string
  study_image_url: string
  created_at: string | null
  updated_at: string | null
}

type ClubProgramRow = {
  id: number
  title: string
  description: string
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

type RecruitContentRow = {
  id: number
  overview_title: string
  overview_description: string
  application_period_title: string
  application_start: string
  application_end: string
  interview_period_title: string
  interview_start: string
  interview_end: string
  target_section_title: string
  target_section_description: string
  target_items: string
  cta_title: string
  cta_button_label: string
  apply_url: string
  created_at: string | null
  updated_at: string | null
}

type StaffRow = {
  id: number
  user_id: number | null
  name: string
  department: string
  role: string
  description: string
  profile_image: string
  github_url: string | null
  instagram_url: string | null
}

type RentalItemRow = {
  id: number
  name: string
  category: string
  description: string | null
  total_quantity: number
  available_quantity: number
  item_image: string | null
  max_rental_days: number
  status: string
  created_at: string
  updated_at: string
}

type RentalRow = {
  id: number
  rental_item_id: number
  user_id: string
  quantity: number
  start_date: string
  end_date: string
  purpose: string
  status: string
  rented_at: string
  returned_at: string | null
}

type ManagedUserRow = {
  id: number
  email: string
  name: string
  profile_image_url: string | null
  provider: string
  role: string
  created_at: string
  updated_at: string
}

const defaultClubContent: ClubContent = {
  introTitle: "Do,um?",
  introLead: "'um' 하고 망설이기 전에, 'do' 무엇이든 해보자",
  introDescription:
    "Do,um은 국민대학교 소프트웨어융합대학 학생들이 함께 배우고 나누기 위해 만든 교육 봉사 동아리입니다. 교내외 코딩 교육과 친목 활동, 스터디를 꾸준히 이어가고 있습니다.",
  heroBannerImageUrl: "/hero-banner.png",
  activitySectionTitle: "정규 활동",
  historySectionTitle: "우리는 어떤 길을 걸어왔을까요?",
  studyCaption: "자기개발을 위한",
  studyTitle: "다양한 스터디와 친목활동 진행",
  learnTitle: "Learn",
  learnDescription: "기초부터 차근차근, 함께 배우는 스터디",
  growTitle: "Grow",
  growDescription: "알고리즘과 프로젝트로 쌓는 실전 역량",
  shareTitle: "Share",
  shareDescription: "배운 기술로 실천하는 SW 교육 봉사",
  studyImageUrl: "/skill.png",
  createdAt: null,
  updatedAt: null,
}

const defaultRecruitContent: RecruitContent = {
  overviewTitle: "모집 개요",
  overviewDescription: "2026년도 1학기 Do,um 신입 부원 모집 개요",
  applicationPeriodTitle: "지원 기간",
  applicationStart: "2026년 02월 23일 (월)",
  applicationEnd: "2026년 03월 04일 (수)",
  interviewPeriodTitle: "면접 일정",
  interviewStart: "2026년 03월 09일 (월)",
  interviewEnd: "2026년 03월 11일 (수)",
  targetSectionTitle: "모집 대상",
  targetSectionDescription: "함께 활동을 적극적으로 할 수 있는 누구나 환영합니다",
  targetItems: [
    "실력, 학과 무관! SW 교육에 관심이 있으신 분!",
    "평소에 봉사활동에 관심이 있으신 분!",
    "소융대 사람들과 다양한 교류 활동에 관심이 있으신 분!",
    "코딩 외에도 다양한 활동을 하고 싶으신 분!",
  ],
  ctaTitle: "2026학년도 1학기 Do,um 신규 부원",
  ctaButtonLabel: "지원하기",
  applyUrl: "",
  createdAt: null,
  updatedAt: null,
}

function getSupabase() {
  return getSupabaseBrowserClient()
}

function throwIfError(error: { message: string } | null, fallbackMessage: string): asserts error is null {
  if (error) {
    throw new Error(error.message || fallbackMessage)
  }
}

function splitLines(value: string | null | undefined) {
  if (!value) {
    return []
  }

  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function joinLines(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .join("\n")
}

function trimOrNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function createRandomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createProjectId() {
  return `prj_${createRandomId().replace(/-/g, "")}`
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function isActiveRental(rental: RentalRow) {
  return rental.status === "RENTED" && rental.end_date >= todayKey()
}

function buildReservedQuantityByDate(rentals: RentalRow[]) {
  const reservedQuantityByDate = new Map<string, number>()

  rentals.filter(isActiveRental).forEach((rental) => {
    let cursor = new Date(`${rental.start_date}T00:00:00`)
    const end = new Date(`${rental.end_date}T00:00:00`)

    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10)
      reservedQuantityByDate.set(key, (reservedQuantityByDate.get(key) ?? 0) + rental.quantity)
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    }
  })

  return reservedQuantityByDate
}

function getCurrentAvailableQuantity(item: RentalItemRow, rentals: RentalRow[]) {
  const reservedToday = rentals
    .filter(isActiveRental)
    .filter((rental) => rental.start_date <= todayKey() && rental.end_date >= todayKey())
    .reduce((sum, rental) => sum + rental.quantity, 0)

  return Math.max(item.total_quantity - reservedToday, 0)
}

function getMinAvailableQuantityForRange(item: RentalItemRow, rentals: RentalRow[], startDate: string, endDate: string) {
  const reservedByDate = buildReservedQuantityByDate(rentals)
  let minAvailable = item.total_quantity
  let cursor = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10)
    minAvailable = Math.min(minAvailable, item.total_quantity - (reservedByDate.get(key) ?? 0))
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
  }

  return Math.max(minAvailable, 0)
}

function getMaxReservedQuantity(rentals: RentalRow[]) {
  const values = Array.from(buildReservedQuantityByDate(rentals).values())
  return values.length ? Math.max(...values) : 0
}

function mapActivity(row: IntroduceRow, imageRows: IntroduceActivityImageRow[]) {
  return {
    id: row.id,
    activityId: row.activity_id,
    description: row.description,
    activityDate: row.activity_date,
    location: row.location,
    participantNames: splitLines(row.participant_names),
    participantCount: row.participant_count,
    activityImages: imageRows.map((imageRow) => imageRow.image_url),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies ActivityItem
}

function mapProject(row: ProjectRow, images: ProjectImageRow[], tags: ProjectTagRow[], members: ProjectMemberRow[]) {
  return {
    projectId: row.project_id,
    title: row.title,
    summary: row.summary,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    images: images.map((image) => image.image_url),
    tags: tags.map((tag) => tag.tag),
    teamName: row.team_name,
    members: members.map((member) => member.member_name),
    period:
      row.period_start || row.period_end
        ? {
            start: row.period_start,
            end: row.period_end,
          }
        : null,
    links:
      row.link_github || row.link_demo || row.link_notion
        ? {
            github: row.link_github,
            demo: row.link_demo,
            notion: row.link_notion,
          }
        : null,
    pinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies ProjectItem
}

function mapClubContent(row: ClubContentRow) {
  return {
    introTitle: row.intro_title,
    introLead: row.intro_lead,
    introDescription: row.intro_description,
    heroBannerImageUrl: row.hero_banner_image_url,
    activitySectionTitle: row.activity_section_title,
    historySectionTitle: row.history_section_title,
    studyCaption: row.study_caption,
    studyTitle: row.study_title,
    learnTitle: row.learn_title,
    learnDescription: row.learn_description,
    growTitle: row.grow_title,
    growDescription: row.grow_description,
    shareTitle: row.share_title,
    shareDescription: row.share_description,
    studyImageUrl: row.study_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies ClubContent
}

function mapClubProgram(row: ClubProgramRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies ClubProgramItem
}

function mapRecruitContent(row: RecruitContentRow) {
  return {
    overviewTitle: row.overview_title,
    overviewDescription: row.overview_description,
    applicationPeriodTitle: row.application_period_title,
    applicationStart: row.application_start,
    applicationEnd: row.application_end,
    interviewPeriodTitle: row.interview_period_title,
    interviewStart: row.interview_start,
    interviewEnd: row.interview_end,
    targetSectionTitle: row.target_section_title,
    targetSectionDescription: row.target_section_description,
    targetItems: splitLines(row.target_items),
    ctaTitle: row.cta_title,
    ctaButtonLabel: row.cta_button_label,
    applyUrl: row.apply_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies RecruitContent
}

function mapStaff(row: StaffRow) {
  return {
    staffId: row.id,
    userId: row.user_id,
    name: row.name,
    department: row.department,
    role: row.role,
    description: row.description,
    profileImage: row.profile_image,
    githubUrl: row.github_url,
    instagramUrl: row.instagram_url,
  } satisfies StaffItem
}

function mapRentalItem(row: RentalItemRow, rentals: RentalRow[]) {
  return {
    itemId: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    totalQuantity: row.total_quantity,
    availableQuantity: getCurrentAvailableQuantity(row, rentals),
    itemImage: row.item_image,
    maxRentalDays: row.max_rental_days,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies RentalItem
}

function mapRentalRecord(row: RentalRow) {
  return {
    rentalId: row.id,
    itemId: row.rental_item_id,
    userId: row.user_id,
    quantity: row.quantity,
    startDate: row.start_date,
    endDate: row.end_date,
    purpose: row.purpose,
    status: row.status,
    rentedAt: row.rented_at,
    returnedAt: row.returned_at,
  } satisfies RentalRecord
}

function mapManagedUser(row: ManagedUserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    profileImageUrl: row.profile_image_url,
    provider: row.provider,
    role: normalizeUserRole(row.role),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies ManagedUser
}

async function fetchActivityImageRows(introduceIds: number[]) {
  if (!introduceIds.length) {
    return [] as IntroduceActivityImageRow[]
  }

  const { data, error } = await getSupabase()
    .from("introduce_activity_image")
    .select("id, introduce_id, image_url, sort_order")
    .in("introduce_id", introduceIds)
    .order("introduce_id", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })

  throwIfError(error, "활동 이미지를 불러오지 못했습니다.")
  return (data as IntroduceActivityImageRow[]) ?? []
}

async function fetchProjectRelations(projectIds: number[]) {
  if (!projectIds.length) {
    return {
      images: [] as ProjectImageRow[],
      members: [] as ProjectMemberRow[],
      tags: [] as ProjectTagRow[],
    }
  }

  const [imagesResult, tagsResult, membersResult] = await Promise.all([
    getSupabase().from("project_images").select("project_pk, image_url").in("project_pk", projectIds),
    getSupabase().from("project_tags").select("project_pk, tag").in("project_pk", projectIds),
    getSupabase().from("project_members").select("project_pk, member_name").in("project_pk", projectIds),
  ])

  throwIfError(imagesResult.error, "프로젝트 이미지를 불러오지 못했습니다.")
  throwIfError(tagsResult.error, "프로젝트 태그를 불러오지 못했습니다.")
  throwIfError(membersResult.error, "프로젝트 멤버 정보를 불러오지 못했습니다.")

  return {
    images: (imagesResult.data as ProjectImageRow[]) ?? [],
    members: (membersResult.data as ProjectMemberRow[]) ?? [],
    tags: (tagsResult.data as ProjectTagRow[]) ?? [],
  }
}

async function fetchRentalRowsByItemIds(itemIds: number[]) {
  if (!itemIds.length) {
    return [] as RentalRow[]
  }

  const { data, error } = await getSupabase()
    .from("rentals")
    .select("id, rental_item_id, user_id, quantity, start_date, end_date, purpose, status, rented_at, returned_at")
    .in("rental_item_id", itemIds)
    .eq("status", "RENTED")

  throwIfError(error, "대여 일정을 불러오지 못했습니다.")
  return (data as RentalRow[]) ?? []
}

async function fetchRentalRowById(rentalId: number) {
  const { data, error } = await getSupabase()
    .from("rentals")
    .select("id, rental_item_id, user_id, quantity, start_date, end_date, purpose, status, rented_at, returned_at")
    .eq("id", rentalId)
    .single()

  throwIfError(error, "대여 기록을 불러오지 못했습니다.")
  return data as RentalRow
}

async function syncRentalItemAvailableQuantity(itemId: number) {
  const { data: item, error: itemError } = await getSupabase()
    .from("rental_items")
    .select("id, name, category, description, total_quantity, available_quantity, item_image, max_rental_days, status, created_at, updated_at")
    .eq("id", itemId)
    .single()

  throwIfError(itemError, "대여 물품 정보를 불러오지 못했습니다.")

  const rentals = await fetchRentalRowsByItemIds([itemId])
  const nextAvailableQuantity = getCurrentAvailableQuantity(item as RentalItemRow, rentals)
  const { error } = await getSupabase().from("rental_items").update({ available_quantity: nextAvailableQuantity }).eq("id", itemId)
  throwIfError(error, "대여 가능 수량을 동기화하지 못했습니다.")
}

async function upsertSingletonRow(table: string, payload: Record<string, unknown>, selectQuery: string, fallbackMessage: string) {
  const { data: existingRow, error: existingError } = await getSupabase()
    .from(table)
    .select("id")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle()

  throwIfError(existingError, fallbackMessage)

  if (existingRow?.id) {
    const { data, error } = await getSupabase().from(table).update(payload).eq("id", existingRow.id).select(selectQuery).single()
    throwIfError(error, fallbackMessage)
    return data
  }

  const { data, error } = await getSupabase().from(table).insert(payload).select(selectQuery).single()
  throwIfError(error, fallbackMessage)
  return data
}

export async function fetchActivities() {
  const { data, error } = await getSupabase()
    .from("introduce")
    .select("id, activity_id, description, activity_date, location, participant_count, participant_names, created_at, updated_at")
    .order("created_at", { ascending: false })

  throwIfError(error, "활동 데이터를 불러오지 못했습니다.")

  const rows = (data as IntroduceRow[]) ?? []
  const imageRows = await fetchActivityImageRows(rows.map((row) => row.id))

  return rows.map((row) => mapActivity(row, imageRows.filter((imageRow) => imageRow.introduce_id === row.id)))
}

export async function fetchProjects() {
  const { data, error } = await getSupabase()
    .from("projects")
    .select(
      "id, project_id, title, summary, description, thumbnail_url, team_name, period_start, period_end, link_github, link_demo, link_notion, is_pinned, created_at, updated_at",
    )
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })

  throwIfError(error, "프로젝트 데이터를 불러오지 못했습니다.")

  const rows = (data as ProjectRow[]) ?? []
  const relations = await fetchProjectRelations(rows.map((row) => row.id))

  return rows.map((row) =>
    mapProject(
      row,
      relations.images.filter((image) => image.project_pk === row.id),
      relations.tags.filter((tag) => tag.project_pk === row.id),
      relations.members.filter((member) => member.project_pk === row.id),
    ),
  )
}

export async function fetchClubContent() {
  const { data, error } = await getSupabase()
    .from("club_content")
    .select(
      "id, intro_title, intro_lead, intro_description, activity_section_title, history_section_title, study_caption, study_title, learn_title, learn_description, grow_title, grow_description, share_title, share_description, hero_banner_image_url, study_image_url, created_at, updated_at",
    )
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle()

  throwIfError(error, "동아리 소개 정보를 불러오지 못했습니다.")
  return data ? mapClubContent(data as ClubContentRow) : defaultClubContent
}

export async function fetchClubPrograms() {
  const { data, error } = await getSupabase()
    .from("club_program")
    .select("id, title, description, sort_order, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })

  throwIfError(error, "정규 활동 정보를 불러오지 못했습니다.")
  return ((data as ClubProgramRow[]) ?? []).map(mapClubProgram)
}

export async function fetchRecruitContent() {
  const { data, error } = await getSupabase()
    .from("club_recruit_content")
    .select(
      "id, overview_title, overview_description, application_period_title, application_start, application_end, interview_period_title, interview_start, interview_end, target_section_title, target_section_description, target_items, cta_title, cta_button_label, apply_url, created_at, updated_at",
    )
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle()

  throwIfError(error, "모집 페이지 정보를 불러오지 못했습니다.")
  return data ? mapRecruitContent(data as RecruitContentRow) : defaultRecruitContent
}

export async function fetchStaff() {
  const { data, error } = await getSupabase()
    .from("introduce_staff")
    .select("id, user_id, name, department, role, description, profile_image, github_url, instagram_url")
    .order("id", { ascending: true })

  throwIfError(error, "운영진 정보를 불러오지 못했습니다.")
  return ((data as StaffRow[]) ?? []).map(mapStaff)
}

export async function fetchRentalItems() {
  const { data, error } = await getSupabase()
    .from("rental_items")
    .select("id, name, category, description, total_quantity, available_quantity, item_image, max_rental_days, status, created_at, updated_at")
    .order("created_at", { ascending: false })

  throwIfError(error, "대여 물품 정보를 불러오지 못했습니다.")

  const rows = (data as RentalItemRow[]) ?? []
  const rentals = await fetchRentalRowsByItemIds(rows.map((row) => row.id))

  return rows.map((row) => mapRentalItem(row, rentals.filter((rental) => rental.rental_item_id === row.id)))
}

export async function fetchManagedUsers(_token = getStoredAccessToken()) {
  await requireAdminUser()
  const { data, error } = await getSupabase()
    .from("users")
    .select("id, email, name, profile_image_url, provider, role, created_at, updated_at")
    .order("created_at", { ascending: false })

  throwIfError(error, "회원 목록을 불러오지 못했습니다.")
  return ((data as ManagedUserRow[]) ?? []).map(mapManagedUser)
}

export async function fetchMyRentalHistory(_token = getStoredAccessToken()) {
  const currentUser = await requireRentalUser()
  const { data, error } = await getSupabase()
    .from("rentals")
    .select("id, rental_item_id, user_id, quantity, start_date, end_date, purpose, status, rented_at, returned_at")
    .eq("user_id", String(currentUser.id))
    .order("rented_at", { ascending: false })

  throwIfError(error, "내 대여 내역을 불러오지 못했습니다.")

  const rentals = (data as RentalRow[]) ?? []
  const itemIds = Array.from(new Set(rentals.map((rental) => rental.rental_item_id)))
  const itemsResult = itemIds.length
    ? await getSupabase().from("rental_items").select("id, name, item_image").in("id", itemIds)
    : { data: [], error: null }

  throwIfError(itemsResult.error, "대여 물품 정보를 불러오지 못했습니다.")

  const itemById = new Map(
    (((itemsResult.data as Array<{ id: number; name: string; item_image: string | null }>) ?? [])).map((item) => [
      item.id,
      item,
    ]),
  )

  return rentals.map((rental) => {
    const item = itemById.get(rental.rental_item_id)
    const returned = rental.status === "RETURNED" || rental.end_date < todayKey()

    return {
      rentalId: rental.id,
      itemId: rental.rental_item_id,
      itemName: item?.name ?? "알 수 없는 물품",
      itemImage: item?.item_image ?? null,
      quantity: rental.quantity,
      rentalStatus: returned ? "RETURNED" : rental.status,
      startDate: rental.start_date,
      endDate: rental.end_date,
      purpose: rental.purpose,
      rentedAt: rental.rented_at,
      returnedAt: returned ? rental.returned_at ?? rental.end_date : rental.returned_at,
      returned,
    } satisfies UserRentalHistoryItem
  })
}

export async function fetchRentalSchedule(itemId: number) {
  const { data, error } = await getSupabase()
    .from("rentals")
    .select("id, rental_item_id, user_id, quantity, start_date, end_date, purpose, status, rented_at, returned_at")
    .eq("rental_item_id", itemId)
    .eq("status", "RENTED")
    .order("start_date", { ascending: true })
    .order("rented_at", { ascending: true })

  throwIfError(error, "예약 일정을 불러오지 못했습니다.")

  const rentals = ((data as RentalRow[]) ?? []).filter(isActiveRental)
  const userIds = Array.from(new Set(rentals.map((rental) => Number(rental.user_id)).filter((userId) => Number.isFinite(userId))))
  const usersResult = userIds.length ? await getSupabase().from("users").select("id, name").in("id", userIds) : { data: [], error: null }

  throwIfError(usersResult.error, "예약자 정보를 불러오지 못했습니다.")

  const userNameById = new Map((((usersResult.data as Array<{ id: number; name: string }>) ?? [])).map((user) => [user.id, user.name]))

  return rentals.map((rental) => ({
    rentalId: rental.id,
    quantity: rental.quantity,
    startDate: rental.start_date,
    endDate: rental.end_date,
    purpose: rental.purpose,
    reservedByName: userNameById.get(Number(rental.user_id)) ?? null,
  }))
}

export async function createActivity(payload: ActivityWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const { data, error } = await getSupabase()
    .from("introduce")
    .insert({
      activity_id: payload.activityId.trim(),
      description: payload.description.trim(),
      activity_date: payload.activityDate,
      location: trimOrNull(payload.location),
      participant_names: joinLines(payload.participantNames),
      participant_count: payload.participantNames.length || payload.participantCount,
    })
    .select("id, activity_id, description, activity_date, location, participant_count, participant_names, created_at, updated_at")
    .single()

  throwIfError(error, "활동을 저장하지 못했습니다.")

  const row = data as IntroduceRow
  if (payload.activityImages.length) {
    const { error: imageError } = await getSupabase().from("introduce_activity_image").insert(
      payload.activityImages.map((imageUrl, index) => ({
        introduce_id: row.id,
        image_url: imageUrl,
        sort_order: index,
      })),
    )
    throwIfError(imageError, "활동 이미지를 저장하지 못했습니다.")
  }

  return mapActivity(row, await fetchActivityImageRows([row.id]))
}

export async function uploadImageFiles(files: File[], _token = getStoredAccessToken()) {
  await requireAdminUser()
  const bucket = getSupabaseStorageBucket()

  if (!bucket) {
    throw new Error("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET 설정이 필요합니다.")
  }

  const optimizedFiles = await compressImagesForUpload(files)
  const uploadedPaths: string[] = []
  const dateSegment = todayKey()

  for (const file of optimizedFiles) {
    const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".png"
    const objectPath = `images/${dateSegment}/${createRandomId()}${extension}`
    const { error } = await getSupabase().storage.from(bucket).upload(objectPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    })

    throwIfError(error, "이미지를 업로드하지 못했습니다.")
    uploadedPaths.push(`/storage/v1/object/public/${bucket}/${objectPath}`)
  }

  return uploadedPaths
}

export async function updateActivity(activityId: number, payload: ActivityWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const { data, error } = await getSupabase()
    .from("introduce")
    .update({
      activity_id: payload.activityId.trim(),
      description: payload.description.trim(),
      activity_date: payload.activityDate,
      location: trimOrNull(payload.location),
      participant_names: joinLines(payload.participantNames),
      participant_count: payload.participantNames.length || payload.participantCount,
    })
    .eq("id", activityId)
    .select("id, activity_id, description, activity_date, location, participant_count, participant_names, created_at, updated_at")
    .single()

  throwIfError(error, "활동을 수정하지 못했습니다.")

  const { error: deleteImageError } = await getSupabase().from("introduce_activity_image").delete().eq("introduce_id", activityId)
  throwIfError(deleteImageError, "기존 활동 이미지를 정리하지 못했습니다.")

  if (payload.activityImages.length) {
    const { error: insertImageError } = await getSupabase().from("introduce_activity_image").insert(
      payload.activityImages.map((imageUrl, index) => ({
        introduce_id: activityId,
        image_url: imageUrl,
        sort_order: index,
      })),
    )
    throwIfError(insertImageError, "활동 이미지를 저장하지 못했습니다.")
  }

  return mapActivity(data as IntroduceRow, await fetchActivityImageRows([activityId]))
}

export async function createProject(payload: ProjectWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const projectId = createProjectId()
  const { data, error } = await getSupabase()
    .from("projects")
    .insert({
      project_id: projectId,
      title: payload.title.trim(),
      summary: payload.summary.trim(),
      description: payload.description.trim(),
      thumbnail_url: payload.thumbnailUrl.trim(),
      team_name: trimOrNull(payload.teamName),
      period_start: payload.period?.start ?? null,
      period_end: payload.period?.end ?? null,
      link_github: trimOrNull(payload.links?.github),
      link_demo: trimOrNull(payload.links?.demo),
      link_notion: trimOrNull(payload.links?.notion),
      is_pinned: payload.isPinned,
    })
    .select("id, project_id")
    .single()

  throwIfError(error, "프로젝트를 저장하지 못했습니다.")

  const row = data as Pick<ProjectRow, "id" | "project_id">
  const [imagesResult, tagsResult, membersResult] = await Promise.all([
    payload.images.length
      ? getSupabase().from("project_images").insert(payload.images.map((imageUrl) => ({ project_pk: row.id, image_url: imageUrl })))
      : Promise.resolve({ error: null }),
    payload.tags.length
      ? getSupabase().from("project_tags").insert(payload.tags.map((tag) => ({ project_pk: row.id, tag })))
      : Promise.resolve({ error: null }),
    payload.members.length
      ? getSupabase().from("project_members").insert(payload.members.map((memberName) => ({ project_pk: row.id, member_name: memberName })))
      : Promise.resolve({ error: null }),
  ])

  throwIfError(imagesResult.error, "프로젝트 이미지를 저장하지 못했습니다.")
  throwIfError(tagsResult.error, "프로젝트 태그를 저장하지 못했습니다.")
  throwIfError(membersResult.error, "프로젝트 멤버 정보를 저장하지 못했습니다.")

  return { projectId: row.project_id } satisfies ProjectMutationResult
}

export async function updateProject(payload: ProjectWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()

  if (!payload.projectId) {
    throw new Error("수정할 프로젝트 ID가 필요합니다.")
  }

  const { data: project, error: projectError } = await getSupabase()
    .from("projects")
    .select("id, project_id")
    .eq("project_id", payload.projectId)
    .single()

  throwIfError(projectError, "프로젝트를 찾을 수 없습니다.")

  const row = project as Pick<ProjectRow, "id" | "project_id">
  const { error: updateError } = await getSupabase()
    .from("projects")
    .update({
      title: payload.title.trim(),
      summary: payload.summary.trim(),
      description: payload.description.trim(),
      thumbnail_url: payload.thumbnailUrl.trim(),
      team_name: trimOrNull(payload.teamName),
      period_start: payload.period?.start ?? null,
      period_end: payload.period?.end ?? null,
      link_github: trimOrNull(payload.links?.github),
      link_demo: trimOrNull(payload.links?.demo),
      link_notion: trimOrNull(payload.links?.notion),
      is_pinned: payload.isPinned,
    })
    .eq("id", row.id)

  throwIfError(updateError, "프로젝트를 수정하지 못했습니다.")

  const [deleteImagesResult, deleteTagsResult, deleteMembersResult] = await Promise.all([
    getSupabase().from("project_images").delete().eq("project_pk", row.id),
    getSupabase().from("project_tags").delete().eq("project_pk", row.id),
    getSupabase().from("project_members").delete().eq("project_pk", row.id),
  ])

  throwIfError(deleteImagesResult.error, "기존 프로젝트 이미지를 정리하지 못했습니다.")
  throwIfError(deleteTagsResult.error, "기존 프로젝트 태그를 정리하지 못했습니다.")
  throwIfError(deleteMembersResult.error, "기존 프로젝트 멤버 정보를 정리하지 못했습니다.")

  const [imagesResult, tagsResult, membersResult] = await Promise.all([
    payload.images.length
      ? getSupabase().from("project_images").insert(payload.images.map((imageUrl) => ({ project_pk: row.id, image_url: imageUrl })))
      : Promise.resolve({ error: null }),
    payload.tags.length
      ? getSupabase().from("project_tags").insert(payload.tags.map((tag) => ({ project_pk: row.id, tag })))
      : Promise.resolve({ error: null }),
    payload.members.length
      ? getSupabase().from("project_members").insert(payload.members.map((memberName) => ({ project_pk: row.id, member_name: memberName })))
      : Promise.resolve({ error: null }),
  ])

  throwIfError(imagesResult.error, "프로젝트 이미지를 저장하지 못했습니다.")
  throwIfError(tagsResult.error, "프로젝트 태그를 저장하지 못했습니다.")
  throwIfError(membersResult.error, "프로젝트 멤버 정보를 저장하지 못했습니다.")

  return { projectId: row.project_id } satisfies ProjectMutationResult
}

export async function updateClubContent(payload: ClubContentWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const data = (await upsertSingletonRow(
    "club_content",
    {
      intro_title: payload.introTitle.trim(),
      intro_lead: payload.introLead.trim(),
      intro_description: payload.introDescription.trim(),
      activity_section_title: payload.activitySectionTitle.trim(),
      history_section_title: payload.historySectionTitle.trim(),
      study_caption: payload.studyCaption.trim(),
      study_title: payload.studyTitle.trim(),
      learn_title: payload.learnTitle.trim(),
      learn_description: payload.learnDescription.trim(),
      grow_title: payload.growTitle.trim(),
      grow_description: payload.growDescription.trim(),
      share_title: payload.shareTitle.trim(),
      share_description: payload.shareDescription.trim(),
      hero_banner_image_url: payload.heroBannerImageUrl,
      study_image_url: payload.studyImageUrl,
    },
    "id, intro_title, intro_lead, intro_description, activity_section_title, history_section_title, study_caption, study_title, learn_title, learn_description, grow_title, grow_description, share_title, share_description, hero_banner_image_url, study_image_url, created_at, updated_at",
    "동아리 소개를 저장하지 못했습니다.",
  )) as ClubContentRow

  return mapClubContent(data)
}

export async function createRental(payload: RentalCreatePayload, _token = getStoredAccessToken()) {
  const currentUser = await requireRentalUser()
  const today = todayKey()

  if (!payload.startDate || !payload.endDate) {
    throw new Error("대여 기간을 선택해 주세요.")
  }
  if (payload.startDate < today) {
    throw new Error("오늘 이후 기간만 선택할 수 있습니다.")
  }
  if (payload.endDate < payload.startDate) {
    throw new Error("반납일은 대여 시작일 이후여야 합니다.")
  }
  if (!payload.purpose.trim()) {
    throw new Error("대여 사유를 입력해 주세요.")
  }

  const quantity = Number(payload.quantity || 1)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("대여 수량은 1개 이상이어야 합니다.")
  }

  const { data: item, error: itemError } = await getSupabase()
    .from("rental_items")
    .select("id, name, category, description, total_quantity, available_quantity, item_image, max_rental_days, status, created_at, updated_at")
    .eq("id", payload.itemId)
    .single()

  throwIfError(itemError, "대여 물품이 존재하지 않습니다.")

  const itemRow = item as RentalItemRow
  if (itemRow.status !== "AVAILABLE") {
    throw new Error("대여 가능한 상태가 아닙니다.")
  }

  const rentalDays =
    Math.floor(
      (new Date(`${payload.endDate}T00:00:00`).getTime() - new Date(`${payload.startDate}T00:00:00`).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1

  if (rentalDays > itemRow.max_rental_days) {
    throw new Error(`최대 대여 기간은 ${itemRow.max_rental_days}일입니다.`)
  }

  const rentals = await fetchRentalRowsByItemIds([payload.itemId])
  const availableForRange = getMinAvailableQuantityForRange(itemRow, rentals, payload.startDate, payload.endDate)

  if (quantity > availableForRange) {
    throw new Error(`선택한 기간에 대여 가능한 수량은 ${availableForRange}개입니다.`)
  }

  const { data, error } = await getSupabase()
    .from("rentals")
    .insert({
      rental_item_id: payload.itemId,
      user_id: String(currentUser.id),
      quantity,
      start_date: payload.startDate,
      end_date: payload.endDate,
      purpose: payload.purpose.trim(),
      status: "RENTED",
    })
    .select("id, rental_item_id, user_id, quantity, start_date, end_date, purpose, status, rented_at, returned_at")
    .single()

  throwIfError(error, "대여 신청 중 오류가 발생했습니다.")
  await syncRentalItemAvailableQuantity(payload.itemId)
  return mapRentalRecord(data as RentalRow)
}

export async function returnRental(rentalId: number, _token = getStoredAccessToken()) {
  const currentUser = await requireRentalUser()
  const rental = await fetchRentalRowById(rentalId)

  if (rental.user_id !== String(currentUser.id)) {
    throw new Error("본인의 대여 기록만 반납할 수 있습니다.")
  }
  if (rental.status === "RETURNED") {
    throw new Error("이미 반납된 대여 기록입니다.")
  }

  const { data, error } = await getSupabase()
    .from("rentals")
    .update({
      status: "RETURNED",
      returned_at: new Date().toISOString(),
    })
    .eq("id", rentalId)
    .select("id, rental_item_id, user_id, quantity, start_date, end_date, purpose, status, rented_at, returned_at")
    .single()

  throwIfError(error, "반납 처리 중 오류가 발생했습니다.")
  await syncRentalItemAvailableQuantity(rental.rental_item_id)
  return mapRentalRecord(data as RentalRow)
}

export async function createRentalItem(payload: RentalItemCreatePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()

  if (!payload.name.trim()) {
    throw new Error("물품명은 필수입니다.")
  }
  if (!payload.category.trim()) {
    throw new Error("분류는 필수입니다.")
  }
  if (!Number.isFinite(payload.totalQuantity) || payload.totalQuantity < 0) {
    throw new Error("총 수량은 0 이상이어야 합니다.")
  }
  if (!Number.isFinite(payload.maxRentalDays) || payload.maxRentalDays <= 0) {
    throw new Error("최대 대여 기간은 1일 이상이어야 합니다.")
  }

  const { data, error } = await getSupabase()
    .from("rental_items")
    .insert({
      name: payload.name.trim(),
      category: payload.category.trim(),
      description: trimOrNull(payload.description),
      item_image: trimOrNull(payload.itemImage),
      total_quantity: payload.totalQuantity,
      available_quantity: payload.totalQuantity,
      max_rental_days: payload.maxRentalDays,
      status: "AVAILABLE",
    })
    .select("id, name, category, description, total_quantity, available_quantity, item_image, max_rental_days, status, created_at, updated_at")
    .single()

  throwIfError(error, "대여 물품을 저장하지 못했습니다.")
  return mapRentalItem(data as RentalItemRow, [])
}

export async function updateRentalItem(itemId: number, payload: RentalItemUpdatePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()

  const { error: itemError } = await getSupabase()
    .from("rental_items")
    .select("id")
    .eq("id", itemId)
    .single()

  throwIfError(itemError, "대여 물품을 찾을 수 없습니다.")

  const activeRentals = await fetchRentalRowsByItemIds([itemId])
  const maxReservedQuantity = getMaxReservedQuantity(activeRentals)
  if (payload.totalQuantity < maxReservedQuantity) {
    throw new Error(`이미 예약된 일정 수량(${maxReservedQuantity})보다 총 수량을 줄일 수 없습니다.`)
  }

  const reservedToday = activeRentals
    .filter((rental) => rental.start_date <= todayKey() && rental.end_date >= todayKey())
    .reduce((sum, rental) => sum + rental.quantity, 0)
  const nextAvailableQuantity = Math.max(payload.totalQuantity - reservedToday, 0)

  const { data, error } = await getSupabase()
    .from("rental_items")
    .update({
      name: payload.name.trim(),
      category: payload.category.trim(),
      description: trimOrNull(payload.description),
      item_image: trimOrNull(payload.itemImage),
      total_quantity: payload.totalQuantity,
      available_quantity: nextAvailableQuantity,
      max_rental_days: payload.maxRentalDays,
      status: payload.status,
    })
    .eq("id", itemId)
    .select("id, name, category, description, total_quantity, available_quantity, item_image, max_rental_days, status, created_at, updated_at")
    .single()

  throwIfError(error, "대여 물품을 수정하지 못했습니다.")
  return mapRentalItem(data as RentalItemRow, activeRentals)
}

export async function deleteRentalItem(itemId: number, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const rentals = await fetchRentalRowsByItemIds([itemId])

  if (rentals.some(isActiveRental)) {
    throw new Error("예약 또는 대여중인 기록이 있어 삭제할 수 없습니다.")
  }

  const { error } = await getSupabase().from("rental_items").delete().eq("id", itemId)
  throwIfError(error, "물품 삭제 중 오류가 발생했습니다.")
}

export async function updateManagedUserRole(userId: number, role: NormalizedUserRole, _token = getStoredAccessToken()) {
  const currentUser = await requireAdminUser()

  if (currentUser.id === userId) {
    throw new Error("본인 권한은 이 페이지에서 변경할 수 없습니다.")
  }

  const { data, error } = await getSupabase()
    .from("users")
    .update({ role })
    .eq("id", userId)
    .select("id, email, name, profile_image_url, provider, role, created_at, updated_at")
    .single()

  throwIfError(error, "권한을 변경하지 못했습니다.")
  return mapManagedUser(data as ManagedUserRow)
}

export async function createClubProgram(payload: ClubProgramWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const { data, error } = await getSupabase()
    .from("club_program")
    .insert({
      title: payload.title.trim(),
      description: payload.description.trim(),
      sort_order: payload.sortOrder,
    })
    .select("id, title, description, sort_order, created_at, updated_at")
    .single()

  throwIfError(error, "정규 활동을 저장하지 못했습니다.")
  return mapClubProgram(data as ClubProgramRow)
}

export async function updateRecruitContent(payload: RecruitContentWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const data = (await upsertSingletonRow(
    "club_recruit_content",
    {
      overview_title: payload.overviewTitle.trim(),
      overview_description: payload.overviewDescription.trim(),
      application_period_title: payload.applicationPeriodTitle.trim(),
      application_start: payload.applicationStart.trim(),
      application_end: payload.applicationEnd.trim(),
      interview_period_title: payload.interviewPeriodTitle.trim(),
      interview_start: payload.interviewStart.trim(),
      interview_end: payload.interviewEnd.trim(),
      target_section_title: payload.targetSectionTitle.trim(),
      target_section_description: payload.targetSectionDescription.trim(),
      target_items: joinLines(payload.targetItems),
      cta_title: payload.ctaTitle.trim(),
      cta_button_label: payload.ctaButtonLabel.trim(),
      apply_url: payload.applyUrl.trim(),
    },
    "id, overview_title, overview_description, application_period_title, application_start, application_end, interview_period_title, interview_start, interview_end, target_section_title, target_section_description, target_items, cta_title, cta_button_label, apply_url, created_at, updated_at",
    "모집 페이지를 저장하지 못했습니다.",
  )) as RecruitContentRow

  return mapRecruitContent(data)
}

export async function updateClubProgram(programId: number, payload: ClubProgramWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const { data, error } = await getSupabase()
    .from("club_program")
    .update({
      title: payload.title.trim(),
      description: payload.description.trim(),
      sort_order: payload.sortOrder,
    })
    .eq("id", programId)
    .select("id, title, description, sort_order, created_at, updated_at")
    .single()

  throwIfError(error, "정규 활동을 수정하지 못했습니다.")
  return mapClubProgram(data as ClubProgramRow)
}

export async function createStaff(payload: StaffWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const { data, error } = await getSupabase()
    .from("introduce_staff")
    .insert({
      name: payload.name.trim(),
      department: payload.department.trim(),
      role: payload.role.trim(),
      description: payload.description.trim(),
      profile_image: payload.profileImage.trim(),
      github_url: trimOrNull(payload.githubUrl),
      instagram_url: trimOrNull(payload.instagramUrl),
    })
    .select("id, user_id, name, department, role, description, profile_image, github_url, instagram_url")
    .single()

  throwIfError(error, "운영진을 저장하지 못했습니다.")
  return mapStaff(data as StaffRow)
}

export async function updateStaff(staffId: number, payload: StaffWritePayload, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const { data, error } = await getSupabase()
    .from("introduce_staff")
    .update({
      name: payload.name.trim(),
      department: payload.department.trim(),
      role: payload.role.trim(),
      description: payload.description.trim(),
      profile_image: payload.profileImage.trim(),
      github_url: trimOrNull(payload.githubUrl),
      instagram_url: trimOrNull(payload.instagramUrl),
    })
    .eq("id", staffId)
    .select("id, user_id, name, department, role, description, profile_image, github_url, instagram_url")
    .single()

  throwIfError(error, "운영진을 수정하지 못했습니다.")
  return mapStaff(data as StaffRow)
}

export async function deleteStaff(staffId: number, _token = getStoredAccessToken()) {
  await requireAdminUser()
  const { error } = await getSupabase().from("introduce_staff").delete().eq("id", staffId)
  throwIfError(error, "운영진 삭제 중 오류가 발생했습니다.")
}
