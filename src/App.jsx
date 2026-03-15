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

export default function App() {
  const [tab, setTab] = useState('generator')
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // draws.json 로드 (크롤러 실행 후 생성됨)
    fetch('/draws.json')
      .then(r => r.json())
      .then(data => { setDraws(data); setLoading(false) })
      .catch(() => {
        console.warn('draws.json 없음 — 크롤러를 먼저 실행하세요')
        setLoading(false)
      })
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">◆</span>
            <span className="logo-text">Lotto<strong>Metis</strong></span>
            {draws.length > 0 && (
              <span className="draw-badge">{draws.length}회차 학습 완료</span>
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
          </nav>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>당첨번호 데이터 로딩 중...</p>
            <small>draws.json이 없다면 <code>python3 scripts/crawl_draws.py</code> 먼저 실행해주세요</small>
          </div>
        ) : draws.length === 0 ? (
          <div className="empty-state">
            <h2>데이터가 없습니다</h2>
            <p>터미널에서 아래 명령어를 실행해 당첨번호를 수집하세요:</p>
            <code>python3 scripts/crawl_draws.py</code>
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
