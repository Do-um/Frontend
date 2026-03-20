// ========== 로그인 폼 컴포넌트 ==========
// - 실제 로그인 UI를 담당하는 컴포넌트
// - 헤더 + 로그인 카드로 구성
// - Google OAuth 로그인 버튼 포함

"use client"

import { useSearchParams } from "next/navigation"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HeaderNav } from "@/components/header-nav"
import { signInWithGoogle } from "@/lib/auth"
import { hasSupabaseEnv } from "@/lib/supabase"

export function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const allowedDomain = searchParams.get("allowedDomain") || "@kookmin.ac.kr"

  const errorMessage =
    error === "restricted_domain"
      ? `국민대학교 Google 계정(${allowedDomain})만 로그인할 수 있습니다.`
      : error
        ? "Google 로그인에 실패했습니다. 다시 시도해 주세요."
        : ""

  const handleGoogleLogin = async () => {
    try {
      if (!hasSupabaseEnv()) {
        throw new Error("Supabase 환경변수가 설정되지 않았습니다.")
      }

      await signInWithGoogle()
    } catch (err) {
      console.error(err)
      alert("Supabase 로그인 설정이 완료되지 않았습니다.")
    }
  }

  return (
    // flex flex-col: 세로 방향 플렉스박스 (헤더 위, 로그인 카드 아래)
    // min-h-screen: 최소 높이를 화면 전체로 설정
    <div 
      className="flex min-h-screen flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      {/* ========== 헤더 영역 ==========
          - 로그인 페이지 상단 네비게이션
          - 홈 페이지와 동일한 스타일 유지
          - border-b: 하단 테두리
          - px-6 py-4: 좌우 패딩 24px, 상하 패딩 16px
      */}
      <HeaderNav />

      {/* ========== 로그인 카드 영역 ==========
          - flex-1: 남은 공간을 모두 차지
          - flex items-center justify-center: 카드를 화면 중앙에 배치
          - p-6: 전체 패딩 24px
      */}
      <main className="flex flex-1 items-center justify-center p-6">


        {/* 로그인 카드
            - max-w-md: 최대 너비 28rem (448px)
            - rounded-3xl: 큰 둥근 모서리 (24px)
            - p-12: 카드 내부 패딩 48px (넉넉한 공간)
            - shadow-lg: 큰 그림자 효과
        */}
        <Card className="w-full max-w-md rounded-3xl border-2 bg-card p-12 shadow-2xl">
          {/* space-y-8: 자식 요소들 간 세로 간격 32px */}
          <div className="flex flex-col items-center space-y-8">
            {/* ========== 타이틀 영역 ========== */}
            <div className="text-center">
              {/* Do,um 로고/제목
                  - text-6xl: 매우 큰 글씨 (60px)
                  - font-bold: 굵은 글씨
                  - tracking-tight: 글자 간격 좁게
              */}
              <h1 className="text-6xl font-bold tracking-tight">Do,um</h1>

              {/* 동아리 설명
                  - mt-4: 상단 마진 16px
                  - text-sm: 작은 글씨 (14px)
                  - text-muted-foreground: 흐린 색상
              */}
              <p className="mt-4 text-sm text-muted-foreground">KookminUniv sw 교육봉사 동아리</p>
            </div>

            {errorMessage ? (
              <div className="w-full max-w-sm rounded-2xl border border-[#f1c9c9] bg-[#fff4f4] px-4 py-3 text-center text-sm text-[#9a3b3b]">
                {errorMessage}
              </div>
            ) : null}

            {/* ========== Google 로그인 버튼 ==========
                - variant="outline": 테두리만 있는 버튼 스타일
                - max-w-sm: 최대 너비 24rem (384px)
                - rounded-full: 완전히 둥근 모서리
                - py-6: 상하 패딩 24px (버튼 높이 증가)
                - text-base: 기본 폰트 크기 (16px)
                - bg-transparent: 투명 배경
                
                Supabase Google OAuth 로그인 진입점
            */}
            <Button
              variant="outline"
              className="w-full max-w-sm rounded-full border-2 py-6 text-base font-medium shadow-md transition-all hover:scale-105 hover:shadow-lg hover:bg-accent/20 bg-transparent"
              onClick={handleGoogleLogin}
            >
              {/* Google 아이콘 SVG
                  - mr-2: 오른쪽 마진 8px (텍스트와 간격)
                  - h-5 w-5: 크기 20x20px
                  - Google의 공식 브랜드 컬러 사용
              */}
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {/* 파란색 부분 */}
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                {/* 초록색 부분 */}
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                {/* 노란색 부분 */}
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                {/* 빨간색 부분 */}
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google로 로그인
            </Button>

            {/* ========== 구분선 ==========
                - relative: 부모 요소 (구분선 배치 기준)
                - absolute inset-0: 자식 요소를 전체 영역에 배치
                - border-t: 상단 테두리 (실제 구분선)
            */}
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
            </div>

            {/* ========== 안내 텍스트 ==========
                - 학교 이메일로만 로그인 가능하다는 안내
                - text-sm: 작은 글씨 (14px)
                - text-muted-foreground: 흐린 색상
            */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Google 로그인만 지원합니다</p>
              <p className="text-sm text-muted-foreground">국민대학교 메일(@kookmin.ac.kr)만 로그인 가능합니다</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
