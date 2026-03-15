import { useState } from 'react'
import { generateNumbers, generateWeeklyReport } from '../lib/analysis'
import { savePurchase } from '../lib/supabase'

const BALL_COLORS = ['#E8B800','#1255A8','#C01A1A','#374151','#166534']
function ballColor(n) {
  if (n <= 10) return BALL_COLORS[0]
  if (n <= 20) return BALL_COLORS[1]
  if (n <= 30) return BALL_COLORS[2]
  if (n <= 40) return BALL_COLORS[3]
  return BALL_COLORS[4]
}

function LottoBall({ number, size = 40 }) {
  const col = ballColor(number)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: col, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff', fontWeight: 700,
      fontSize: size * 0.32, boxShadow: `0 2px 8px ${col}66`,
      flexShrink: 0
    }}>
      {number}
    </div>
  )
}

export default function GeneratorPage({ draws }) {
  const [periodMonths, setPeriodMonths] = useState(3)
  const [gamesCount, setGamesCount] = useState(5)
  const [useGap, setUseGap] = useState(true)
  const [useSection, setUseSection] = useState(true)
  const [usePairs, setUsePairs] = useState(true)
  const [useSumBand, setUseSumBand] = useState(true)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [savedGames, setSavedGames] = useState({})

  const lastDraw = draws[draws.length - 1]
  const report = generateWeeklyReport(draws, periodMonths)

  function handleGenerate() {
    setLoading(true)
    setTimeout(() => {
      const res = generateNumbers(draws, {
        periodMonths, gamesCount, useGap,
        useSectionCycle: useSection, usePairs, useSumBand
      })
      setResult(res)
      setLoading(false)
    }, 100)
  }

  async function handleSavePurchase(game, idx) {
    try {
      await savePurchase({
        numbers: game.numbers,
        draw_no: lastDraw.draw_no + 1,
        source: 'app',
        generated_set_id: null
      })
      setSavedGames(p => ({ ...p, [idx]: true }))
    } catch (e) {
      // Supabase 미연결 시 로컬스토리지 폴백
      const key = 'lm_purchases'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      existing.push({
        numbers: game.numbers,
        draw_no: lastDraw.draw_no + 1,
        source: 'app',
        created_at: new Date().toISOString()
      })
      localStorage.setItem(key, JSON.stringify(existing))
      setSavedGames(p => ({ ...p, [idx]: true }))
    }
  }

  return (
    <div className="page">
      {/* 주간 브리핑 */}
      <div className="card briefing-card">
        <div className="card-header">
          <span className="card-title">이번 주 분석 브리핑</span>
          <span className="badge badge-gold">{lastDraw.draw_no + 1}회차 예측</span>
        </div>
        <div className="briefing-grid">
          <div className="briefing-item">
            <span className="bi-label">갭 패턴 적중률</span>
            <span className="bi-value" style={{color: report.gap1Rate > 65 ? '#10b981' : '#f59e0b'}}>
              {report.gap1Rate}%
            </span>
          </div>
          <div className="briefing-item">
            <span className="bi-label">상승 구간</span>
            <span className="bi-value">{report.risingSection.join(', ') || '없음'}</span>
          </div>
          <div className="briefing-item">
            <span className="bi-label">합계 타깃</span>
            <span className="bi-value">{report.sumTarget}</span>
          </div>
          <div className="briefing-item">
            <span className="bi-label">갭 후보 번호</span>
            <span className="bi-value">{report.gap1Candidates.slice(0,6).join(', ')}</span>
          </div>
        </div>
        <div className="last-draw-row">
          <span className="bi-label">지난 회차 ({lastDraw.draw_no}):</span>
          <div className="ball-row">
            {[lastDraw.n1,lastDraw.n2,lastDraw.n3,lastDraw.n4,lastDraw.n5,lastDraw.n6].map(n =>
              <LottoBall key={n} number={n} size={32} />
            )}
            <span style={{color:'#94a3b8',margin:'0 4px'}}>+</span>
            <LottoBall number={lastDraw.bonus} size={32} />
          </div>
        </div>
      </div>

      {/* 설정 패널 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">생성 설정</span>
        </div>
        <div className="settings-grid">
          <div className="setting-row">
            <label>분석 기간</label>
            <div className="btn-group">
              {[3,6,12,0].map(m => (
                <button key={m} className={`seg-btn ${periodMonths===m?'active':''}`}
                  onClick={()=>setPeriodMonths(m)}>
                  {m===0?'전체':m+'개월'}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row">
            <label>게임 수</label>
            <div className="btn-group">
              {[1,5,10].map(n => (
                <button key={n} className={`seg-btn ${gamesCount===n?'active':''}`}
                  onClick={()=>setGamesCount(n)}>
                  {n}게임
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row">
            <label>적용 패턴</label>
            <div className="toggle-group">
              {[
                {key:'gap', label:'갭 패턴', val:useGap, set:setUseGap},
                {key:'sec', label:'구간 사이클', val:useSection, set:setUseSection},
                {key:'pair', label:'동반 출현', val:usePairs, set:setUsePairs},
                {key:'sum', label:'합계 밴드', val:useSumBand, set:setUseSumBand},
              ].map(({key,label,val,set}) => (
                <button key={key} className={`toggle-btn ${val?'on':''}`} onClick={()=>set(!val)}>
                  {val ? '✓' : ''} {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? '분석 중...' : '번호 생성'}
        </button>
      </div>

      {/* 생성 결과 */}
      {result && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">생성된 번호</span>
            <span className="badge">{periodMonths===0?'전체':periodMonths+'개월'} 분석 · {result.analysis.drawCount}회차</span>
          </div>
          <div className="games-list">
            {result.games.map((game, idx) => (
              <div key={idx} className="game-row">
                <span className="game-no">#{idx+1}</span>
                <div className="ball-row">
                  {game.numbers.map(n => <LottoBall key={n} number={n} size={38} />)}
                </div>
                <div className="game-meta">
                  <div className="score-bar">
                    <div className="score-fill" style={{width:`${game.score}%`}} />
                  </div>
                  <span className="score-num">{game.score}점</span>
                </div>
                <button
                  className={`save-btn ${savedGames[idx]?'saved':''}`}
                  onClick={() => handleSavePurchase(game, idx)}
                  disabled={savedGames[idx]}
                >
                  {savedGames[idx] ? '✓ 저장됨' : '구매 등록'}
                </button>
              </div>
            ))}
          </div>

          {/* 분석 근거 */}
          {result.analysis && (
            <div className="reason-box">
              <div className="reason-title">이 번호들의 근거</div>
              <div className="reason-list">
                <div className="reason-item">
                  <span className="ri-dot" style={{background:'#10b981'}} />
                  갭+1 패턴 적중률 {result.analysis.gap1.rate}%
                  {result.analysis.gap1.rate > 65 ? ' ← 현재 강한 패턴' : ''}
                </div>
                {result.analysis.sections.filter(s=>s.status==='rising').map(s => (
                  <div key={s.section} className="reason-item">
                    <span className="ri-dot" style={{background:'#f59e0b'}} />
                    {s.section} 구간 상승 사이클 (최근 대비 +{s.trend}%p)
                  </div>
                ))}
                <div className="reason-item">
                  <span className="ri-dot" style={{background:'#3b82f6'}} />
                  합계 타깃 {result.analysis.sumBand.targetMin}~{result.analysis.sumBand.targetMax}
                  (최근 평균 {result.analysis.sumBand.recentAvg})
                </div>
                {result.analysis.pairs[0] && (
                  <div className="reason-item">
                    <span className="ri-dot" style={{background:'#8b5cf6'}} />
                    동반 출현 최강 쌍: {result.analysis.pairs[0].a}·{result.analysis.pairs[0].b}
                    ({result.analysis.pairs[0].rate}%)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
