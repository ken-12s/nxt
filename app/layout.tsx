import './globals.css'
import Sidebar from './components/Sidebar'
import MobileSidebar from './components/MobileSidebar'

export const metadata = {
  title: 'NXT 이벤트 가이드',
  description: 'Markdown 기반 문서 사이트',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-bg text-text">
        {/* 상단 헤더: 모바일에서 메뉴 버튼 노출 */}
        <header className="sticky top-0 z-20 border-b border-border bg-panel/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <MobileSidebar />
              <strong className="text-base lg:text-lg">NXT 이벤트 가이드</strong>
            </div>
            <span className="hidden text-sm text-muted sm:block">Next.js · MDX · Tailwind</span>
          </div>
        </header>

        {/* 본문 레이아웃: 모바일 단일열, 데스크톱 2열 */}
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-0 px-4 lg:grid-cols-[16rem_1fr]">
          <Sidebar />
          <main className="py-6">
            <article className="prose max-w-none">{children}</article>
          </main>
        </div>
      </body>
    </html>
  )
}
