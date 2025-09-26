'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: '홈' },
  { href: '/guides', label: '가이드 개요' },
  { href: '/guides/event-basics', label: '이벤트 기본' },
  { href: '/guides/rules', label: '규칙 정리' },
  { href: '/guides/faq', label: 'FAQ' },
]

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        aria-label="메뉴 열기"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-md border border-border bg-white px-3 py-2 text-sm hover:bg-slate-50 lg:hidden"
      >
        메뉴
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-panel border-r border-border p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-muted">문서</div>
              <button
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border bg-white px-2 py-1 text-sm hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
            <nav className="space-y-1">
              {links.map(l => {
                const active = pathname === l.href
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
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
          </div>
        </div>
      )}
    </>
  )
}