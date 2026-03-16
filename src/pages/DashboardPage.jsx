// DashboardPage.jsx
import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { analyzeSectionCycle } from '../lib/analysis'

const BALL_COLORS = ['#E8B800','#1255A8','#C01A1A','#374151','#166534']
function ballColor(n) {
  if (n <= 10) return BALL_COLORS[0]
  if (n <= 20) return BALL_COLORS[1]
  if (n <= 30) return BALL_COLORS[2]
  if (n <= 40) return BALL_COLORS[3]
  return BALL_COLORS[4]
}

function DashboardPage({ draws }) {
  const purchases = JSON.parse(localStorage.getItem('lm_purchases') || '[]')

  // 번호별 출현 빈도 (전체)
  const freqData = useMemo(() => {
    const counts = {}
    for (let n = 1; n <= 45; n++) counts[n] = 0
    draws.forEach(d => {
      [d.n1,d.n2,d.n3,d.n4,d.n5,d.n6].forEach(n => counts[n]++)
    })
    return Object.entries(counts).map(([n,c]) => ({ n: Number(n), count: c }))
  }, [draws])

  // 최근 52주 구간 사이클
  const sections = useMemo(() => analyzeSectionCycle(draws), [draws])

  // ROI 추이 (구매 이력 있을 때)
  const roiData = useMemo(() => {
    let cumCost = 0, cumPrize = 0
    return purchases.slice().reverse().map((p, i) => {
      cumCost += 1000
      cumPrize += p.rank === 5 ? 5000 : p.rank === 4 ? 50000 : p.rank === 3 ? 150000 : 0
      return {
        name: `${i+1}`,
        roi: Math.round((cumPrize - cumCost) / cumCost * 100)
      }
    })
  }, [purchases])

  // 전략별 성과
  const stratStats = useMemo(() => {
    const app = purchases.filter(p => p.source === 'app')
    const manual = purchases.filter(p => p.source === 'manual')
    function winRate(list) {
      if (!list.length) return 0
      return Math.round(list.filter(p => p.rank).length / list.length * 1000) / 10
    }
    return [
      { name: '앱 생성', total: app.length, rate: winRate(app), color: '#10b981', src: 'app' },
      { name: '수동 입력', total: manual.length, rate: winRate(manual), color: '#3b82f6', src: 'manual' },
    ]
  }, [purchases])

  return (
    <div className="page">
      {/* KPI */}
      <div className="kpi-row">
        {[
          { label: '학습 회차', val: draws.length + '회' },
          { label: '분석 기간', val: '2002~현재' },
          { label: '구매 등록', val: purchases.length + '게임' },
          { label: '데이터 상태', val: '정상' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-val">{k.val}</span>
          </div>
        ))}
      </div>

      {/* 번호별 출현 빈도 히트맵 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">번호별 출현 빈도</span>
          <span className="badge">전체 {draws.length}회차</span>
        </div>
        <div className="heatmap">
          {freqData.map(({ n, count }) => {
            const maxC = Math.max(...freqData.map(d => d.count))
            const intensity = count / maxC
            const col = ballColor(n)
            return (
              <div key={n} className="heatmap-cell" title={`${n}번: ${count}회`}
                style={{
                  background: col,
                  opacity: 0.25 + intensity * 0.75,
                }}>
                <span className="hm-num">{n}</span>
                <span className="hm-cnt">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 구간 사이클 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">구간 사이클 현황</span>
          <span className="badge">최근 8주 vs 1년 평균</span>
        </div>
        <div className="section-chart">
          {sections.map(s => (
            <div key={s.section} className="section-row">
              <span className="sec-label">{s.section}</span>
              <div className="sec-bar-wrap">
                <div className="sec-bar-bg">
                  <div className="sec-bar-fill" style={{
                    width: `${s.recentRate * 3}%`,
                    background: s.status === 'rising' ? '#10b981' : s.status === 'falling' ? '#ef4444' : '#6b7280'
                  }} />
                </div>
                <span className="sec-rate">{s.recentRate}%</span>
              </div>
              <span className={`sec-status ${s.status}`}>
                {s.status === 'rising' ? '↑ 상승' : s.status === 'falling' ? '↓ 하락' : '→ 안정'}
                {s.trend !== 0 && ` ${s.trend > 0 ? '+' : ''}${s.trend}%p`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 전략별 성과 */}
      {purchases.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">전략별 성과</span>
          </div>
          <table className="stats-table">
            <thead>
              <tr><th>구분</th><th>게임수</th><th>5등</th><th>당첨률</th></tr>
            </thead>
            <tbody>
              {stratStats.map(s => (
                <tr key={s.name}>
                  <td><span style={{color:s.color,fontWeight:600}}>{s.name}</span></td>
                  <td>{s.total}</td>
                  <td>{purchases.filter(p=>p.source===s.src&&p.rank===5).length}</td>
                  <td style={{color:s.rate>7?'#10b981':'#f59e0b',fontWeight:700}}>{s.rate}%</td>
                </tr>
              ))}
              <tr style={{borderTop:'1px solid #374151',fontStyle:'italic',color:'#6b7280'}}>
                <td>자동번호 (대조군)</td>
                <td>-</td><td>-</td>
                <td>~5.8%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ROI 차트 */}
      {roiData.length > 2 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">누적 ROI 추이</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={roiData}>
              <XAxis dataKey="name" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} unit="%" />
              <Tooltip formatter={v=>[v+'%','ROI']} />
              <Line type="monotone" dataKey="roi" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
