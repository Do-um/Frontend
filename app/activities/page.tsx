import { ActivityBoard } from "@/components/activities/activity-board"
import { fetchIntroduceCardItems } from "@/lib/introduce-content"
import type { IntroduceCardItem } from "@/lib/introduce-content"

export default async function ActivitiesPage() {
  let items: IntroduceCardItem[] = []
  let errorMessage: string | null = null

  try {
    items = await fetchIntroduceCardItems("activity")
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "주요활동 데이터를 불러오지 못했습니다."
  }

  return (
    <ActivityBoard
      title="Our Activity"
      subtitle="우리가 해온 길, 우리가 가는 길"
      items={items}
      errorMessage={errorMessage}
      emptyMessage="등록된 주요활동이 없습니다."
    />
  )
}
