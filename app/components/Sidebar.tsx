'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: '홈' },
  { href: '/guides', label: '가이드 개요' },
  { href: '/guides/event-basics', label: '이벤트 기본' },
  { href: '/guides/rules', label: '규칙 정리' },
  { href: '/guides/faq', label: 'FAQ' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-[100dvh] lg:w-64 lg:shrink-0 lg:border-r lg:border-border lg:bg-panel lg:px-4 lg:py-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">문서</div>
      <nav className="space-y-1">
        {links.map(l => {
          const active = pathname === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className={[
                'block rounded-md px-3 py-2 text-sm',
                active ? 'bg-white shadow text-slate-900' : 'text-slate-700 hover:bg-white hover:shadow',
              ].join(' ')}
            >
              {l.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
