import { ActivityBoard } from "@/components/activities/activity-board"
import { fetchIntroduceCardItems } from "@/lib/introduce-content"
import type { IntroduceCardItem } from "@/lib/introduce-content"

export default async function ActivitiesProjectsPage() {
  let items: IntroduceCardItem[] = []
  let errorMessage: string | null = null

  try {
    items = await fetchIntroduceCardItems("project")
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "프로젝트 데이터를 불러오지 못했습니다."
  }

  return (
    <ActivityBoard
      title="Our Project"
      subtitle="우리가 만든 결과물, 우리가 키우는 경험"
      items={items}
      errorMessage={errorMessage}
      emptyMessage="activityId 또는 설명에 '프로젝트' 키워드가 포함된 데이터가 없습니다."
    />
  )
}
