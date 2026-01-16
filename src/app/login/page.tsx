// ========== 로그인 페이지 ==========
// - Next.js App Router에서 /login 경로 담당
// - app/login/page.tsx 파일이 /login URL과 자동 매칭
// - LoginForm 컴포넌트를 불러와서 표시

import { LoginForm } from "@/components/login-form"

// 페이지 메타데이터 (SEO, 브라우저 탭 제목 등)
export const metadata = {
  title: "Do,um - 로그인",
  description: "KookminUniv sw 교육봉사 동아리 Do,um 로그인 페이지",
}

export default function LoginPage() {
  return (
    // min-h-screen: 최소 높이를 화면 전체로 설정
    // bg-background: 배경색을 테마 색상으로 설정
    <div className="min-h-screen bg-background">
      {/* 실제 로그인 UI는 LoginForm 컴포넌트에 구현
          components/login-form.tsx 파일 참고 */}
      <LoginForm />
    </div>
  )
}
