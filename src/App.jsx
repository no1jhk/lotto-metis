import { useState, useEffect } from 'react'
import GeneratorPage from './pages/GeneratorPage'
import PurchasePage from './pages/PurchasePage'
import DashboardPage from './pages/DashboardPage'
import AnalysisPage from './pages/AnalysisPage'
import './App.css'

const TABS = [
  { id: 'generator', label: '번호 생성', icon: '⚡' },
  { id: 'purchase',  label: '구매 기록', icon: '📋' },
  { id: 'dashboard', label: '성과 분석', icon: '📊' },
  { id: 'analysis',  label: '패턴 리포트', icon: '🔍' },
]

const CACHE_KEY   = 'lm_draws_cache'
const CACHE_VER   = 'lm_draws_ver'

async function loadDraws(setStatus) {
  // 1. 캐시 확인
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const draws = JSON.parse(cached)
    setStatus(`캐시 데이터 로드 (${draws.length}회차)`)
    return draws
  }

  // 2. API에서 전체 수집
  const TOTAL = 1215
  const BATCH = 50
  const all = []

  for (let start = 1; start <= TOTAL; start += BATCH) {
    const end = Math.min(start + BATCH - 1, TOTAL)
    setStatus(`동행복권에서 수집 중... ${end}/${TOTAL}회차`)

    const res = await fetch(`/api/lotto?from=${start}&to=${end}`)
    if (!res.ok) throw new Error(`API 오류: ${res.status}`)
    const data = await res.json()
    all.push(...(data.draws || []))

    await new Promise(r => setTimeout(r, 100))
  }

  // 3. 캐시 저장
  localStorage.setItem(CACHE_KEY, JSON.stringify(all))
  localStorage.setItem(CACHE_VER, new Date().toISOString())
  return all
}

export default function App() {
  const [tab, setTab] = useState('generator')
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadStatus, setLoadStatus] = useState('데이터 로딩 중...')
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDraws(setLoadStatus)
      .then(data => {
        setDraws(data)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setError(e.message)
        setLoading(false)
      })
  }, [])

  async function handleRefresh() {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_VER)
    setLoading(true)
    setError(null)
    try {
      const data = await loadDraws(setLoadStatus)
      setDraws(data)
    } catch(e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const lastDraw = draws[draws.length - 1]
  const cacheDate = localStorage.getItem(CACHE_VER)
    ? new Date(localStorage.getItem(CACHE_VER)).toLocaleDateString('ko-KR')
    : null

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">L</div>
            <span className="logo-text">Lotto<strong>Metis</strong></span>
            {draws.length > 0 && (
              <span className="draw-badge">{lastDraw?.draw_no}회차 반영</span>
            )}
          </div>
          <nav className="tab-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
            {draws.length > 0 && (
              <button className="tab-btn" onClick={handleRefresh} title="최신 데이터로 갱신">
                <span className="tab-icon">🔄</span>
                <span className="tab-label">갱신</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>{loadStatus}</p>
            <small style={{color:'var(--text3)'}}>동행복권 공식 API에서 직접 수집 중입니다</small>
          </div>
        ) : error ? (
          <div className="empty-state">
            <h2>데이터 로드 실패</h2>
            <p style={{color:'var(--red)'}}>{error}</p>
            <button className="generate-btn" style={{maxWidth:200}} onClick={handleRefresh}>
              다시 시도
            </button>
          </div>
        ) : (
          <>
            {tab === 'generator' && <GeneratorPage draws={draws} />}
            {tab === 'purchase'  && <PurchasePage draws={draws} />}
            {tab === 'dashboard' && <DashboardPage draws={draws} />}
            {tab === 'analysis'  && <AnalysisPage draws={draws} />}
          </>
        )}
      </main>
    </div>
  )
}
