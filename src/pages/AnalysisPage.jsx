import { useMemo, useState } from 'react'
import { analyzeGapPattern, analyzeSectionCycle, analyzePairOccurrence,
         analyzeSumBand, analyzeBonusPattern } from '../lib/analysis'

export default function AnalysisPage({ draws }) {
  const [period, setPeriod] = useState(3)

  const filtered = useMemo(() => {
    if (!period) return draws
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - period)
    return draws.filter(d => new Date(d.date) >= cutoff)
  }, [draws, period])

  const gap1 = useMemo(() => analyzeGapPattern(filtered, 1), [filtered])
  const gap2 = useMemo(() => analyzeGapPattern(filtered, 2), [filtered])
  const sections = useMemo(() => analyzeSectionCycle(filtered), [filtered])
  const pairs = useMemo(() => analyzePairOccurrence(filtered, 15), [filtered])
  const sumBand = useMemo(() => analyzeSumBand(filtered), [filtered])
  const bonus = useMemo(() => analyzeBonusPattern(filtered), [filtered])

  const lastDraw = draws[draws.length - 1]

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <span className="card-title">패턴 분석 리포트</span>
          <div className="btn-group">
            {[3,6,12,0].map(m => (
              <button key={m} className={`seg-btn ${period===m?'active':''}`}
                onClick={()=>setPeriod(m)}>
                {m===0?'전체':m+'개월'}
              </button>
            ))}
          </div>
        </div>
        <p style={{fontSize:13,color:'#94a3b8',margin:'0 0 16px'}}>
          분석 기간: {filtered.length}회차 ({period===0?'전체':period+'개월'})
        </p>
      </div>

      {/* 패턴 A: 갭 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">패턴 A — 갭 분석</span>
          <span className={`badge ${gap1.rate > 65 ? 'badge-green' : 'badge-yellow'}`}>
            {gap1.rate > 65 ? '현재 강한 패턴' : '보통'}
          </span>
        </div>
        <div className="analysis-grid">
          <div className="an-item">
            <span className="an-label">갭±1 적중률</span>
            <span className="an-val" style={{color:gap1.rate>65?'#10b981':'#f59e0b',fontSize:28,fontWeight:700}}>
              {gap1.rate}%
            </span>
            <span className="an-sub">{gap1.count}/{gap1.total}회 적중</span>
          </div>
          <div className="an-item">
            <span className="an-label">갭±2 적중률</span>
            <span className="an-val" style={{color:'#60a5fa',fontSize:28,fontWeight:700}}>
              {gap2.rate}%
            </span>
            <span className="an-sub">{gap2.count}/{gap2.total}회 적중</span>
          </div>
        </div>
        <div style={{marginTop:12}}>
          <span className="an-label">이번 주 갭±1 후보 번호</span>
          <div className="candidate-chips">
            {gap1.candidates.slice(0,12).map(n => (
              <span key={n} className="chip">{n}</span>
            ))}
          </div>
          <span style={{fontSize:11,color:'#6b7280'}}>
            기준: {lastDraw.draw_no}회 ({gap1.lastNums?.join(', ')})
          </span>
        </div>
      </div>

      {/* 패턴 B: 구간 사이클 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">패턴 B — 구간 사이클</span>
        </div>
        {sections.map(s => (
          <div key={s.section} className="section-detail-row">
            <span className="sec-label">{s.section}</span>
            <div className="sec-bars">
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,color:'#6b7280',width:60}}>최근 {period||'전체'}</span>
                <div className="mini-bar-bg">
                  <div className="mini-bar" style={{
                    width:`${s.recentRate*3.5}%`,
                    background: s.status==='rising'?'#10b981':s.status==='falling'?'#ef4444':'#6b7280'
                  }}/>
                </div>
                <span style={{fontSize:12,fontWeight:600,width:40}}>{s.recentRate}%</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,color:'#6b7280',width:60}}>1년 평균</span>
                <div className="mini-bar-bg">
                  <div className="mini-bar" style={{width:`${s.longtermRate*3.5}%`,background:'#374151'}}/>
                </div>
                <span style={{fontSize:12,color:'#6b7280',width:40}}>{s.longtermRate}%</span>
              </div>
            </div>
            <span className={`sec-status ${s.status}`} style={{minWidth:80}}>
              {s.status==='rising'?`↑ +${s.trend}%p`:s.status==='falling'?`↓ ${s.trend}%p`:'→ 안정'}
            </span>
          </div>
        ))}
      </div>

      {/* 패턴 C: 동반 출현 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">패턴 C — 동반 출현 강도</span>
          <span className="badge">상위 15쌍</span>
        </div>
        <div className="pair-list">
          {pairs.map((p, i) => (
            <div key={i} className="pair-row">
              <span className="pair-rank">#{i+1}</span>
              <span className="pair-nums">{p.a} · {p.b}</span>
              <div className="pair-bar-bg">
                <div className="pair-bar" style={{width:`${Math.min(p.rate,100)}%`}} />
              </div>
              <span className="pair-rate">{p.rate}%</span>
              <span style={{fontSize:11,color:'#6b7280'}}>{p.count}회</span>
            </div>
          ))}
        </div>
      </div>

      {/* 패턴 D: 합계 밴드 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">패턴 D — 합계 밴드</span>
        </div>
        <div className="analysis-grid">
          {[
            {label:'최근 평균',val:sumBand.recentAvg,color:'#f59e0b'},
            {label:'역대 평균',val:sumBand.allAvg,color:'#6b7280'},
            {label:'이번주 타깃',val:`${sumBand.targetMin}~${sumBand.targetMax}`,color:'#10b981'},
            {label:'추세',val:sumBand.trend==='high'?'↑ 높음':sumBand.trend==='low'?'↓ 낮음':'→ 보통',
             color:sumBand.trend==='high'?'#ef4444':sumBand.trend==='low'?'#3b82f6':'#6b7280'},
          ].map(item => (
            <div key={item.label} className="an-item">
              <span className="an-label">{item.label}</span>
              <span className="an-val" style={{color:item.color,fontSize:22,fontWeight:700}}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 패턴 E: 보너스 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">패턴 E — 보너스 번호 동향</span>
          <span className="badge badge-purple">2등 전략 핵심</span>
        </div>
        <div style={{marginBottom:12}}>
          <span className="an-label">최근 보너스 번호</span>
          <div className="candidate-chips">
            {bonus.recentBonuses.map((n,i) => <span key={i} className="chip chip-bonus">{n}</span>)}
          </div>
        </div>
        <div>
          <span className="an-label">이번주 보너스 후보</span>
          <div className="candidate-chips">
            {bonus.candidates.map(n => <span key={n} className="chip chip-purple">{n}</span>)}
          </div>
        </div>
        <div style={{marginTop:12}}>
          <span className="an-label">오래 안 나온 번호 (콜드)</span>
          <div className="candidate-chips">
            {bonus.coldNums.map(n => <span key={n} className="chip chip-cold">{n}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}
