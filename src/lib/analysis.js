// ═══════════════════════════════════════════════════════
// Lotto Metis — 패턴 분석 엔진
// ═══════════════════════════════════════════════════════

// ── 유틸 ────────────────────────────────────────────────
function getNumbers(draw) {
  return [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.n6]
}

function getSection(n) {
  if (n <= 9)  return 0
  if (n <= 19) return 1
  if (n <= 29) return 2
  if (n <= 39) return 3
  return 4
}

const SECTION_LABELS = ['1~9', '10~19', '20~29', '30~39', '40~45']

// 최근 N개월치 draws 필터
function filterByMonths(draws, months) {
  if (!months) return draws
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  return draws.filter(d => new Date(d.date) >= cutoff)
}

// ── 패턴 A: 갭 패턴 ─────────────────────────────────────
// "전주 번호에서 ±gap 이내 숫자가 다음주에 포함될 확률"
export function analyzeGapPattern(draws, gap = 1) {
  if (draws.length < 2) return { rate: 0, count: 0, total: 0, candidates: [] }

  let hit = 0
  for (let i = 1; i < draws.length; i++) {
    const prev = getNumbers(draws[i - 1])
    const curr = getNumbers(draws[i])
    const candidates = new Set()
    prev.forEach(n => {
      for (let d = -gap; d <= gap; d++) {
        const t = n + d
        if (t >= 1 && t <= 45) candidates.add(t)
      }
    })
    const matched = curr.filter(n => candidates.has(n)).length
    if (matched >= 1) hit++
  }

  const total = draws.length - 1
  const rate = total > 0 ? hit / total : 0

  // 이번주 후보 생성 (마지막 회차 기준)
  const lastNums = getNumbers(draws[draws.length - 1])
  const candidateSet = new Set()
  lastNums.forEach(n => {
    for (let d = -gap; d <= gap; d++) {
      const t = n + d
      if (t >= 1 && t <= 45 && !lastNums.includes(t)) candidateSet.add(t)
    }
  })

  return {
    rate: Math.round(rate * 1000) / 10,
    count: hit,
    total,
    candidates: [...candidateSet].sort((a, b) => a - b),
    lastNums
  }
}

// ── 패턴 B: 구간 사이클 ─────────────────────────────────
export function analyzeSectionCycle(draws, windowSize = 8) {
  const recent = draws.slice(-windowSize)
  const longterm = draws.slice(-52)

  const recentCounts = [0, 0, 0, 0, 0]
  const longtermCounts = [0, 0, 0, 0, 0]

  recent.forEach(d => getNumbers(d).forEach(n => recentCounts[getSection(n)]++))
  longterm.forEach(d => getNumbers(d).forEach(n => longtermCounts[getSection(n)]++))

  const recentTotal = recent.length * 6
  const longtermTotal = longterm.length * 6

  return SECTION_LABELS.map((label, i) => {
    const recentRate = recentTotal > 0 ? recentCounts[i] / recentTotal : 0
    const longtermRate = longtermTotal > 0 ? longtermCounts[i] / longtermTotal : 0
    const trend = recentRate - longtermRate
    return {
      section: label,
      recentRate: Math.round(recentRate * 1000) / 10,
      longtermRate: Math.round(longtermRate * 1000) / 10,
      trend: Math.round(trend * 1000) / 10,
      status: trend > 0.02 ? 'rising' : trend < -0.02 ? 'falling' : 'stable'
    }
  })
}

// ── 패턴 C: 동반 출현 쌍 ────────────────────────────────
export function analyzePairOccurrence(draws, topN = 10) {
  const pairCount = {}
  const numCount = {}

  draws.forEach(d => {
    const nums = getNumbers(d)
    nums.forEach(n => { numCount[n] = (numCount[n] || 0) + 1 })
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${Math.min(nums[i], nums[j])}-${Math.max(nums[i], nums[j])}`
        pairCount[key] = (pairCount[key] || 0) + 1
      }
    }
  })

  const pairs = Object.entries(pairCount)
    .map(([key, count]) => {
      const [a, b] = key.split('-').map(Number)
      const baseCount = Math.min(numCount[a] || 1, numCount[b] || 1)
      return { a, b, count, rate: Math.round(count / baseCount * 1000) / 10 }
    })
    .sort((x, y) => y.rate - x.rate)
    .slice(0, topN)

  return pairs
}

// ── 패턴 D: 합계 밴드 ───────────────────────────────────
export function analyzeSumBand(draws, windowSize = 13) {
  const recent = draws.slice(-windowSize)
  const sums = recent.map(d => getNumbers(d).reduce((a, b) => a + b, 0))
  const avg = sums.reduce((a, b) => a + b, 0) / sums.length
  const min = Math.min(...sums)
  const max = Math.max(...sums)

  // 전체 평균
  const allSums = draws.map(d => getNumbers(d).reduce((a, b) => a + b, 0))
  const allAvg = allSums.reduce((a, b) => a + b, 0) / allSums.length

  return {
    recentAvg: Math.round(avg),
    recentMin: min,
    recentMax: max,
    allAvg: Math.round(allAvg),
    targetMin: Math.round(avg - 20),
    targetMax: Math.round(avg + 20),
    trend: avg > allAvg ? 'high' : avg < allAvg ? 'low' : 'normal'
  }
}

// ── 패턴 E: 보너스 번호 동향 ────────────────────────────
export function analyzeBonusPattern(draws, windowSize = 13) {
  const recent = draws.slice(-windowSize)
  const bonuses = recent.map(d => d.bonus)

  const sectionCount = [0, 0, 0, 0, 0]
  bonuses.forEach(n => sectionCount[getSection(n)]++)

  // 최근에 안 나온 번호 (콜드)
  const recentAllNums = new Set(recent.flatMap(d => [...getNumbers(d), d.bonus]))
  const coldNums = []
  for (let n = 1; n <= 45; n++) {
    if (!recentAllNums.has(n)) coldNums.push(n)
  }

  // 보너스 후보 (구간 분포 역산)
  const lowSection = sectionCount.indexOf(Math.min(...sectionCount))
  const start = lowSection * 10 + 1
  const end = lowSection === 4 ? 45 : start + 9
  const candidates = []
  for (let n = start; n <= end; n++) candidates.push(n)

  return {
    recentBonuses: bonuses,
    sectionDistrib: SECTION_LABELS.map((l, i) => ({ section: l, count: sectionCount[i] })),
    candidates: candidates.slice(0, 5),
    coldNums: coldNums.slice(0, 8)
  }
}

// ── 메인: 번호 생성기 ────────────────────────────────────
export function generateNumbers(draws, options = {}) {
  const {
    periodMonths = 3,
    useGap = true,
    useSectionCycle = true,
    usePairs = true,
    useSumBand = true,
    gamesCount = 5
  } = options

  const filtered = filterByMonths(draws, periodMonths)
  if (filtered.length < 4) return { games: [], analysis: null }

  // 각 패턴 분석
  const gap1 = analyzeGapPattern(filtered, 1)
  const gap2 = analyzeGapPattern(filtered, 2)
  const sections = analyzeSectionCycle(filtered)
  const pairs = analyzePairOccurrence(filtered, 10)
  const sumBand = analyzeSumBand(filtered)
  const bonus = analyzeBonusPattern(filtered)

  // 번호별 점수 계산
  const scores = {}
  for (let n = 1; n <= 45; n++) scores[n] = 0

  // 갭 패턴 가중치
  if (useGap) {
    gap1.candidates.forEach(n => { scores[n] = (scores[n] || 0) + gap1.rate * 0.4 })
    gap2.candidates.forEach(n => { scores[n] = (scores[n] || 0) + gap2.rate * 0.2 })
  }

  // 구간 사이클 가중치
  if (useSectionCycle) {
    sections.forEach((sec, i) => {
      if (sec.status === 'rising') {
        const start = i * 10 + 1, end = i === 4 ? 45 : start + 9
        for (let n = start; n <= end; n++) scores[n] = (scores[n] || 0) + Math.abs(sec.trend) * 2
      }
    })
  }

  // 동반 출현 쌍 가중치
  if (usePairs && pairs.length > 0) {
    pairs.slice(0, 5).forEach(p => {
      scores[p.a] = (scores[p.a] || 0) + p.rate * 0.1
      scores[p.b] = (scores[p.b] || 0) + p.rate * 0.1
    })
  }

  // 게임 생성
  const games = []
  for (let g = 0; g < gamesCount; g++) {
    let attempts = 0
    let best = null

    while (attempts < 200) {
      attempts++
      // 점수 기반 확률 선택 + 랜덤 혼합
      const candidates = []
      for (let n = 1; n <= 45; n++) {
        const weight = Math.max(0.1, scores[n] + Math.random() * 15)
        candidates.push({ n, weight })
      }
      candidates.sort((a, b) => b.weight - a.weight)

      // 상위 풀에서 랜덤 선택
      const pool = candidates.slice(0, 20)
      const picked = []
      const poolCopy = [...pool]
      while (picked.length < 6 && poolCopy.length > 0) {
        const idx = Math.floor(Math.random() * Math.min(poolCopy.length, 15))
        picked.push(poolCopy.splice(idx, 1)[0].n)
      }
      if (picked.length < 6) continue

      const sum = picked.reduce((a, b) => a + b, 0)
      // 합계 밴드 필터
      if (useSumBand && (sum < sumBand.targetMin || sum > sumBand.targetMax)) continue

      // 구간 분산 체크 (최소 3개 구간 이상)
      const secs = new Set(picked.map(getSection))
      if (secs.size < 3) continue

      const score = calculateGameScore(picked, gap1, sections, pairs, sumBand)
      if (!best || score > best.score) best = { numbers: picked.sort((a, b) => a - b), score }
      if (score > 70) break
    }

    if (best) games.push(best)
  }

  const analysis = {
    gap1,
    gap2,
    sections,
    pairs: pairs.slice(0, 5),
    sumBand,
    bonus,
    periodMonths,
    drawCount: filtered.length
  }

  return { games, analysis }
}

// 게임 점수 계산 (100점 만점)
function calculateGameScore(numbers, gap1, sections, pairs, sumBand) {
  let score = 50

  // 갭 패턴 점수
  const gapHit = numbers.filter(n => gap1.candidates.includes(n)).length
  score += gapHit * 4

  // 구간 분산 점수
  const secs = new Set(numbers.map(getSection))
  score += secs.size * 3

  // 합계 점수
  const sum = numbers.reduce((a, b) => a + b, 0)
  const distFromAvg = Math.abs(sum - sumBand.recentAvg)
  score -= Math.min(15, distFromAvg * 0.3)

  // 구간 사이클 점수
  sections.forEach((sec, i) => {
    if (sec.status === 'rising') {
      const inSection = numbers.filter(n => getSection(n) === i).length
      score += inSection * 2
    }
  })

  return Math.min(100, Math.max(0, Math.round(score)))
}

// 이번주 리포트 생성
export function generateWeeklyReport(draws, periodMonths = 3) {
  const filtered = filterByMonths(draws, periodMonths)
  const lastDraw = draws[draws.length - 1]
  const lastNums = getNumbers(lastDraw)

  const gap1 = analyzeGapPattern(filtered, 1)
  const sections = analyzeSectionCycle(filtered)
  const bonus = analyzeBonusPattern(filtered)
  const sumBand = analyzeSumBand(filtered)

  const risingSection = sections.filter(s => s.status === 'rising').map(s => s.section)
  const fallingSection = sections.filter(s => s.status === 'falling').map(s => s.section)

  return {
    drawNo: lastDraw.draw_no + 1,
    lastNums,
    gap1Candidates: gap1.candidates.slice(0, 8),
    gap1Rate: gap1.rate,
    risingSection,
    fallingSection,
    bonusCandidates: bonus.candidates,
    sumTarget: `${sumBand.targetMin}~${sumBand.targetMax}`,
    strongPattern: gap1.rate > 65 ? 'gap' : risingSection.length > 1 ? 'section' : 'mixed'
  }
}
