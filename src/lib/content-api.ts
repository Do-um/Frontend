import { apiFetch, apiFetchData, type ApiEnvelope } from "@/lib/api"
import { getAuthorizationHeaders, getStoredAccessToken, type NormalizedUserRole } from "@/lib/auth"
import { compressImagesForUpload } from "@/lib/image-compression"

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

type RawProjectItem = Omit<ProjectItem, "pinned"> & {
  isPinned?: boolean
  pinned?: boolean
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

export async function fetchActivities() {
  return apiFetchData<ActivityItem[]>("/api/introduce")
}

export async function fetchProjects() {
  const projects = await apiFetchData<RawProjectItem[]>("/api/project")

  return projects.map((project) => ({
    ...project,
    pinned: project.isPinned ?? project.pinned ?? false,
  }))
}

export async function fetchClubContent() {
  return apiFetchData<ClubContent>("/api/club/content")
}

export async function fetchClubPrograms() {
  return apiFetchData<ClubProgramItem[]>("/api/club/programs")
}

export async function fetchRecruitContent() {
  return apiFetchData<RecruitContent>("/api/club/recruit/content")
}

export async function fetchStaff() {
  return apiFetchData<StaffItem[]>("/api/introduce/staff")
}

export async function fetchRentalItems() {
  return apiFetchData<RentalItem[]>("/api/rentals/items")
}

export async function fetchMyRentalHistory(token = getStoredAccessToken()) {
  return apiFetchData<UserRentalHistoryItem[]>("/api/users/me/rentals", {
    headers: getAuthorizationHeaders(token),
  })
}

export async function fetchRentalSchedule(itemId: number) {
  return apiFetchData<RentalScheduleEntry[]>(`/api/rentals/items/${itemId}/schedule`)
}

export async function fetchManagedUsers(token = getStoredAccessToken()) {
  return apiFetchData<ManagedUser[]>("/api/users/admin", {
    headers: getAuthorizationHeaders(token),
  })
}

export async function createActivity(payload: ActivityWritePayload, token = getStoredAccessToken()) {
  return apiFetchData<ActivityItem>("/api/introduce", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function uploadImageFiles(files: File[], token = getStoredAccessToken()) {
  const optimizedFiles = await compressImagesForUpload(files)
  const formData = new FormData()
  optimizedFiles.forEach((file) => {
    formData.append("files", file)
  })

  const response = await apiFetch("/api/uploads/images", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    body: formData,
  })

  let payload: ApiEnvelope<string[]> | null = null
  try {
    payload = (await response.json()) as ApiEnvelope<string[]>
  } catch {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message || `Request failed with status ${response.status}`)
  }

  return payload.data
}

export async function updateActivity(
  activityId: number,
  payload: ActivityWritePayload,
  token = getStoredAccessToken(),
) {
  return apiFetchData<ActivityItem>(`/api/introduce/${activityId}`, {
    method: "PUT",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function createProject(payload: ProjectWritePayload, token = getStoredAccessToken()) {
  return apiFetchData<ProjectMutationResult>("/api/project/add", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function updateProject(payload: ProjectWritePayload, token = getStoredAccessToken()) {
  return apiFetchData<ProjectMutationResult>("/api/project/edit", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function updateClubContent(payload: ClubContentWritePayload, token = getStoredAccessToken()) {
  return apiFetchData<ClubContent>("/api/club/content", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function createRental(payload: RentalCreatePayload, token = getStoredAccessToken()) {
  return apiFetchData<RentalRecord>("/api/rentals", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function returnRental(rentalId: number, token = getStoredAccessToken()) {
  return apiFetchData<RentalRecord>(`/api/rentals/${rentalId}/return`, {
    method: "POST",
    headers: getAuthorizationHeaders(token),
  })
}

export async function createRentalItem(
  payload: RentalItemCreatePayload,
  token = getStoredAccessToken(),
) {
  const formData = new FormData()
  formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }))

  const response = await apiFetch("/api/rentals/items", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    body: formData,
  })

  let result: ApiEnvelope<RentalItem> | null = null
  try {
    result = (await response.json()) as ApiEnvelope<RentalItem>
  } catch {
    result = null
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.error?.message || `Request failed with status ${response.status}`)
  }

  return result.data
}

export async function updateRentalItem(
  itemId: number,
  payload: RentalItemUpdatePayload,
  token = getStoredAccessToken(),
) {
  const formData = new FormData()
  formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }))

  const response = await apiFetch(`/api/rentals/items/${itemId}`, {
    method: "PATCH",
    headers: getAuthorizationHeaders(token),
    body: formData,
  })

  let result: ApiEnvelope<RentalItem> | null = null
  try {
    result = (await response.json()) as ApiEnvelope<RentalItem>
  } catch {
    result = null
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.error?.message || `Request failed with status ${response.status}`)
  }

  return result.data
}

export async function deleteRentalItem(itemId: number, token = getStoredAccessToken()) {
  const response = await apiFetch(`/api/rentals/items/${itemId}`, {
    method: "DELETE",
    headers: getAuthorizationHeaders(token),
  })

  if (!response.ok) {
    let payload: ApiEnvelope<null> | null = null
    try {
      payload = (await response.json()) as ApiEnvelope<null>
    } catch {
      payload = null
    }

    throw new Error(payload?.error?.message || `Request failed with status ${response.status}`)
  }
}

export async function updateManagedUserRole(
  userId: number,
  role: NormalizedUserRole,
  token = getStoredAccessToken(),
) {
  return apiFetchData<ManagedUser>(`/api/users/${userId}/role`, {
    method: "PATCH",
    headers: getAuthorizationHeaders(token),
    json: { role },
  })
}

export async function createClubProgram(payload: ClubProgramWritePayload, token = getStoredAccessToken()) {
  return apiFetchData<ClubProgramItem>("/api/club/programs", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function updateRecruitContent(
  payload: RecruitContentWritePayload,
  token = getStoredAccessToken(),
) {
  return apiFetchData<RecruitContent>("/api/club/recruit/content", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function updateClubProgram(
  programId: number,
  payload: ClubProgramWritePayload,
  token = getStoredAccessToken(),
) {
  return apiFetchData<ClubProgramItem>(`/api/club/programs/${programId}`, {
    method: "PUT",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function createStaff(payload: StaffWritePayload, token = getStoredAccessToken()) {
  return apiFetchData<StaffItem>("/api/introduce/staff", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function updateStaff(
  staffId: number,
  payload: StaffWritePayload,
  token = getStoredAccessToken(),
) {
  return apiFetchData<StaffItem>(`/api/introduce/staff/${staffId}`, {
    method: "PUT",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function deleteStaff(staffId: number, token = getStoredAccessToken()) {
  const response = await apiFetch(`/api/introduce/staff/${staffId}`, {
    method: "DELETE",
    headers: getAuthorizationHeaders(token),
  })

  if (!response.ok) {
    let payload: ApiEnvelope<null> | null = null
    try {
      payload = (await response.json()) as ApiEnvelope<null>
    } catch {
      payload = null
    }

    throw new Error(payload?.error?.message || `Request failed with status ${response.status}`)
  }
}
