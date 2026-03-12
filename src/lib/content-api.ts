import { apiFetch, apiFetchData, type ApiEnvelope } from "@/lib/api"
import { getAuthorizationHeaders, getStoredAccessToken } from "@/lib/auth"

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

export type StaffWritePayload = {
  name: string
  department: string
  role: string
  description: string
  profileImage: string
  githubUrl: string | null
  instagramUrl: string | null
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

export async function fetchStaff() {
  return apiFetchData<StaffItem[]>("/api/introduce/staff")
}

export async function createActivity(payload: ActivityWritePayload, token = getStoredAccessToken()) {
  return apiFetchData<ActivityItem>("/api/introduce", {
    method: "POST",
    headers: getAuthorizationHeaders(token),
    json: payload,
  })
}

export async function uploadImageFiles(files: File[], token = getStoredAccessToken()) {
  const formData = new FormData()
  files.forEach((file) => {
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

export async function createClubProgram(payload: ClubProgramWritePayload, token = getStoredAccessToken()) {
  return apiFetchData<ClubProgramItem>("/api/club/programs", {
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
