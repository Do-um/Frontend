import { ActivitiesLandingPage } from "@/components/pages/activities-landing-page"

export function StudyLandingPage() {
  return (
    <ActivitiesLandingPage
      mode="study"
      archiveLabel="Study Archive"
      heroTitle="Our Study"
      heroDescription="함께 배우고 함께 성장한 스터디 기록"
      sectionEyebrow="DO,UM STUDYBOARD"
      sectionTitle="스터디 기록"
      emptyTitle="등록된 스터디가 없습니다."
      emptyDescription="스터디로 분류된 활동이 등록되면 이 영역이 카드형 기록 보드로 채워집니다."
    />
  )
}
