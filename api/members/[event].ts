// api/members/[event].ts
// Vercel Serverless Function (Node runtime)
// - GET  : 목록 조회 (페이지/정렬/검색)
// - POST : 일괄 저장/삭제 (x-edit-key == EDIT_KEY 환경변수 일치 시에만 허용)

export const config = { runtime: 'nodejs' };

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

// ------------------------------
// Supabase (Service Role)
// ------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ------------------------------
// Helpers
// ------------------------------
type SortSpec = { col: string; dir: 'asc' | 'desc' };

function parseSort(q?: string): SortSpec[] {
  // ex) "power_m:desc,name:asc"
  const list = (q || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(pair => {
      const [colRaw, dirRaw] = pair.split(':').map(x => x.trim());
      const col = (colRaw || '').toLowerCase();
      const dir = (dirRaw || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
      return { col, dir } as SortSpec;
    });

  // 허용 컬럼 화이트리스트
  const allow = new Set([
    'seq',
    'name',
    'power_m',
    'gold',
    'wish_slot',
    'seat',
    'updated_at',
  ]);
  const filtered = list.filter(s => allow.has(s.col));
  return filtered.length ? filtered : [{ col: 'seq', dir: 'asc' }];
}

function normalizeHeader(h: unknown): string {
  if (Array.isArray(h)) return String(h[0] ?? '');
  return typeof h === 'string' ? h : '';
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const aTrim = a.trim();
  const bTrim = b.trim();
  if (aTrim.length !== bTrim.length) return false;
  const A = Buffer.from(aTrim, 'utf8');
  const B = Buffer.from(bTrim, 'utf8');
  try {
    return crypto.timingSafeEqual(A, B);
  } catch {
    return false;
  }
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ------------------------------
// Handler
// ------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const event_slug = String(req.query.event || '').trim();
  if (!event_slug) return res.status(400).json({ ok: false, error: 'event required' });

  if (req.method === 'GET') {
    // pagination
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const size = Math.min(100, Math.max(5, parseInt(String(req.query.size || '20'), 10)));
    const from = (page - 1) * size;
    const to = from + size - 1;

    // search & sort
    const search = String(req.query.search || '').trim();
    const sort = parseSort(String(req.query.sort || 'seq:asc'));

    let q = supabase
      .from('event_members')
      .select('*', { count: 'exact' })
      .eq('event_slug', event_slug);

    if (search) {
      // name OR wish_slot OR seat OR note LIKE
      q = q.or(
        `name.ilike.%${search}%,wish_slot.ilike.%${search}%,seat.ilike.%${search}%,note.ilike.%${search}%`
      );
    }

    sort.forEach(s => {
      q = q.order(s.col as any, { ascending: s.dir === 'asc' });
    });

    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) return res.status(400).json({ ok: false, error: error.message });

    return res.json({
      ok: true,
      page,
      size,
      total: count || 0,
      rows: data,
    });
  }

  if (req.method === 'POST') {
    // 편집키 검증
    const got = normalizeHeader(req.headers['x-edit-key']);
    const envKey = String(process.env.EDIT_KEY || '');
    if (!envKey || !timingSafeEqualStr(got, envKey)) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    // payload
    const body = req.body as {
      upserts?: Array<{
        seq: number;
        name?: string;
        power_m?: number | string | null;
        gold?: number | string | null;
        wish_slot?: string | null;
        seat?: string | null;
        note?: string | null;
      }>;
      deletes?: Array<{ seq: number }>;
    };

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ ok: false, error: 'invalid body' });
    }

    // upserts
    if (Array.isArray(body.upserts) && body.upserts.length) {
      const rows = body.upserts.map(r => ({
        event_slug,
        seq: Number(r.seq),
        name: String(r.name ?? ''),
        power_m: numOrNull(r.power_m),
        gold: numOrNull(r.gold),
        wish_slot: r.wish_slot ?? null,
        seat: r.seat ?? null,
        note: r.note ?? null,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('event_members')
        .upsert(rows, { onConflict: 'event_slug,seq' });
      if (error) return res.status(400).json({ ok: false, error: error.message });
    }

    // deletes
    if (Array.isArray(body.deletes) && body.deletes.length) {
      const seqs = body.deletes.map(d => Number(d.seq));
      const { error } = await supabase
        .from('event_members')
        .delete()
        .eq('event_slug', event_slug)
        .in('seq', seqs);
      if (error) return res.status(400).json({ ok: false, error: error.message });
    }

    return res.json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
