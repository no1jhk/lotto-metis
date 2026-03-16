/**
 * 초기 데이터 구축 스크립트
 * Vercel 배포 후 브라우저에서 실행하거나,
 * 로컬 개발 시 localhost:5174 에서 실행
 *
 * 사용법: 브라우저 콘솔에서 아래 함수 호출
 *   import('/src/scripts/initDraws.js').then(m => m.initDraws())
 */

const API_BASE = import.meta.env.PROD
  ? 'https://lotto-metis.vercel.app/api/lotto'
  : '/api/lotto'  // vite dev proxy

export async function initDraws(onProgress) {
  const TOTAL_DRAWS = 1215
  const BATCH = 50
  const all = []

  console.log(`[LottoMetis] 동행복권 API에서 ${TOTAL_DRAWS}회차 수집 시작...`)

  for (let start = 1; start <= TOTAL_DRAWS; start += BATCH) {
    const end = Math.min(start + BATCH - 1, TOTAL_DRAWS)
    const res = await fetch(`${API_BASE}?from=${start}&to=${end}`)
    const data = await res.json()
    all.push(...data.draws)

    const pct = Math.round(end / TOTAL_DRAWS * 100)
    console.log(`  ${end}회차까지 완료 (${pct}%)`)
    if (onProgress) onProgress(pct, all.length)

    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`[LottoMetis] 완료: 총 ${all.length}회차 수집`)
  return all
}

export async function fetchLatest() {
  const res = await fetch(`${API_BASE}?latest`)
  return res.json()
}

export async function fetchSingle(drwNo) {
  const res = await fetch(`${API_BASE}?drwNo=${drwNo}`)
  return res.json()
}
