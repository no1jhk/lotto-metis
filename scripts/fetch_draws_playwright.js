/**
 * Playwright로 동행복권 API 직접 호출
 * 홈페이지 거치지 않고 API URL에 바로 접근
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const OUT_PATH = path.join(__dirname, '..', 'public', 'draws.json')

async function main() {
  // 기존 데이터 로드
  let existing = []
  let existingNos = new Set()
  if (fs.existsSync(OUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'))
    existingNos = new Set(existing.map(d => d.draw_no))
    console.log(`기존 데이터: ${existing.length}회차`)
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ]
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  })

  const page = await context.newPage()

  // 최신 회차 확인 — API URL 직접 접근
  console.log('최신 회차 확인 중...')
  let latest = 1215
  try {
    // 높은 회차부터 탐색
    for (let no = 1250; no >= 1200; no--) {
      const res = await page.goto(
        `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${no}`,
        { waitUntil: 'domcontentloaded', timeout: 15000 }
      )
      const text = await page.textContent('body')
      const data = JSON.parse(text)
      if (data.returnValue === 'success') {
        latest = no
        console.log(`최신 회차: ${latest}회 (${data.drwNoDate})`)
        break
      }
    }
  } catch (e) {
    console.log(`최신 회차 탐색 실패, 기존 최대값 사용: ${latest}`)
  }

  // 없는 회차만 수집
  const missing = []
  for (let i = 1; i <= latest; i++) {
    if (!existingNos.has(i)) missing.push(i)
  }
  console.log(`수집 필요: ${missing.length}회차`)

  if (missing.length === 0) {
    console.log('이미 최신 상태')
    await browser.close()
    return
  }

  const results = [...existing]
  let success = 0, fail = 0

  for (const drwNo of missing) {
    try {
      await page.goto(
        `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`,
        { waitUntil: 'domcontentloaded', timeout: 15000 }
      )
      const text = await page.textContent('body')
      const data = JSON.parse(text)

      if (data.returnValue === 'success') {
        results.push({
          draw_no:     data.drwNo,
          date:        data.drwNoDate,
          n1:          data.drwtNo1,
          n2:          data.drwtNo2,
          n3:          data.drwtNo3,
          n4:          data.drwtNo4,
          n5:          data.drwtNo5,
          n6:          data.drwtNo6,
          bonus:       data.bnusNo,
          prize_1st:   data.firstWinamnt,
          winners_1st: data.firstPrzwnerCo,
        })
        success++
        if (success % 100 === 0) console.log(`  ${drwNo}회차 완료...`)
      } else {
        fail++
      }
    } catch (e) {
      console.warn(`  실패: ${drwNo}회차 — ${e.message}`)
      fail++
    }

    await new Promise(r => setTimeout(r, 150))
  }

  results.sort((a, b) => a.draw_no - b.draw_no)
  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2), 'utf8')
  await browser.close()

  console.log(`\n완료: 총 ${results.length}회차 (성공 ${success} / 실패 ${fail})`)
  if (fail > 0) process.exit(1)
}

main().catch(e => {
  console.error('오류:', e.message)
  process.exit(1)
})
