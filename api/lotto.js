/**
 * Vercel Serverless Function
 * 동행복권 API 프록시 — 브라우저 CORS 우회
 *
 * GET /api/lotto?drwNo=1215        → 단일 회차
 * GET /api/lotto?from=1&to=1215   → 범위 수집 (초기 데이터 구축용)
 */

const DH_URL = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo='
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Referer': 'https://www.dhlottery.co.kr',
  'Accept': 'application/json',
}

async function fetchOne(drwNo) {
  const res = await fetch(`${DH_URL}${drwNo}`, { headers: HEADERS })
  const data = await res.json()
  if (data.returnValue !== 'success') return null
  return {
    draw_no:      data.drwNo,
    date:         data.drwNoDate,
    n1:           data.drwtNo1,
    n2:           data.drwtNo2,
    n3:           data.drwtNo3,
    n4:           data.drwtNo4,
    n5:           data.drwtNo5,
    n6:           data.drwtNo6,
    bonus:        data.bnusNo,
    prize_1st:    data.firstWinamnt,
    winners_1st:  data.firstPrzwnerCo,
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { drwNo, from, to } = req.query

  try {
    // 단일 회차
    if (drwNo) {
      const draw = await fetchOne(Number(drwNo))
      if (!draw) return res.status(404).json({ error: 'not found' })
      return res.status(200).json(draw)
    }

    // 범위 수집 (최대 50회차씩 — Vercel 함수 타임아웃 10초 고려)
    if (from && to) {
      const start = Number(from)
      const end   = Math.min(Number(to), start + 49) // 50회차 제한
      const results = []
      for (let i = start; i <= end; i++) {
        const draw = await fetchOne(i)
        if (draw) results.push(draw)
        await new Promise(r => setTimeout(r, 80)) // 과부하 방지
      }
      return res.status(200).json({ draws: results, next: end < Number(to) ? end + 1 : null })
    }

    // 최신 회차 감지
    if (req.query.latest !== undefined) {
      let lo = 1200, hi = 1300
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2)
        const d = await fetchOne(mid)
        d ? (lo = mid) : (hi = mid - 1)
      }
      const draw = await fetchOne(lo)
      return res.status(200).json({ latest: lo, draw })
    }

    return res.status(400).json({ error: 'drwNo, from+to, 또는 latest 파라미터 필요' })

  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
