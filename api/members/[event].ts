// /api/members/[event].ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs20.x' };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// 파싱 유틸
function parseSort(q?: string) {
  // ex) "power_m:desc,name:asc"
  const list = (q || '').split(',').map(s => s.trim()).filter(Boolean);
  const parsed = list.map(pair => {
    const [col, dir] = pair.split(':').map(x => x.trim());
    return { col, dir: (dir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc' };
  });
  // 허용 컬럼 화이트리스트
  const allow = new Set(['seq','name','power_m','gold','wish_slot','seat','updated_at']);
  return parsed.filter(p => allow.has(p.col));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const event_slug = String(req.query.event || '').trim();
  if (!event_slug) return res.status(400).json({ ok: false, error: 'event required' });

  if (req.method === 'GET') {
    // 페이지/정렬/검색
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const size = Math.min(100, Math.max(5, parseInt(String(req.query.size || '20'), 10)));
    const from = (page - 1) * size;
    const to = from + size - 1;

    const search = String(req.query.search || '').trim();
    const sort = parseSort(String(req.query.sort || 'seq:asc'));

    let q = supabase
      .from('event_members')
      .select('*', { count: 'exact' })
      .eq('event_slug', event_slug);

    if (search) {
      // name OR wish_slot OR seat OR note LIKE
      q = q.or(`name.ilike.%${search}%,wish_slot.ilike.%${search}%,seat.ilike.%${search}%,note.ilike.%${search}%`);
    }

    // 정렬
    if (sort.length === 0) sort.push({ col: 'seq', dir: 'asc' });
    sort.forEach(s => { q = q.order(s.col as any, { ascending: s.dir === 'asc' }); });

    // 페이지
    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) return res.status(400).json({ ok: false, error: error.message });

    return res.json({
      ok: true,
      page, size, total: count || 0,
      rows: data
    });
  }

  if (req.method === 'POST') {
    // 저장/삭제는 편집키 필요
    const editKey = req.headers['x-edit-key'];
    if (editKey !== process.env.EDIT_KEY) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const body = req.body as {
      upserts?: Array<any>;
      deletes?: Array<{ seq: number }>;
    };
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ ok: false, error: 'invalid body' });
    }

    // upsert
    if (Array.isArray(body.upserts) && body.upserts.length) {
      const upserts = body.upserts.map(r => ({
        event_slug,
        seq: Number(r.seq),
        name: String(r.name || ''),
        power_m: r.power_m === null || r.power_m === '' ? null : Number(r.power_m),
        gold: r.gold === null || r.gold === '' ? null : Number(r.gold),
        wish_slot: r.wish_slot ?? null,
        seat: r.seat ?? null,
        note: r.note ?? null,
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase
        .from('event_members')
        .upsert(upserts, { onConflict: 'event_slug,seq' });
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
