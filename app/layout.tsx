import './globals.css'
import Link from 'next/link'
import { headers } from 'next/headers'

export const metadata = {
  title: 'NXT 이벤트 가이드',
  description: '이벤트 공지/가이드/룰을 담은 문서 사이트',
}

const links = [
  { href: '/', label: '홈' },
  { href: '/guides', label: '가이드 개요' },
  { href: '/guides/event-basics', label: '이벤트 기본' },
  { href: '/guides/rules', label: '규칙 정리' },
  { href: '/guides/faq', label: 'FAQ' },
]

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const currentPath = h.get('x-invoke-path') ?? ''

  return (
    <html lang="ko">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h2>문서</h2>
            <nav>
              {links.map(l => {
                const active = currentPath === l.href
                return (
                  <Link key={l.href} href={l.href} className={active ? 'active' : ''}>
                    {l.label}
                  </Link>
                )
              })}
            </nav>
          </aside>
          <div>
            <header className="header">
              <strong>NXT 이벤트 가이드</strong>
              <span style={{ color: '#9ca3af' }}>Markdown 기반 · Next.js + MDX</span>
            </header>
            <main className="main">
              <div className="mdx">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}