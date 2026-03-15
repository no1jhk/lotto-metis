import { useState, useEffect } from 'react'

const BALL_COLORS = ['#E8B800','#1255A8','#C01A1A','#374151','#166534']
function ballColor(n) {
  if (n <= 10) return BALL_COLORS[0]
  if (n <= 20) return BALL_COLORS[1]
  if (n <= 30) return BALL_COLORS[2]
  if (n <= 40) return BALL_COLORS[3]
  return BALL_COLORS[4]
}
function LottoBall({ number, size = 34, dim }) {
  const col = dim ? '#4b5563' : ballColor(number)
  return (
    <div style={{
      width:size,height:size,borderRadius:'50%',background:col,
      display:'flex',alignItems:'center',justifyContent:'center',
      color:'#fff',fontWeight:700,fontSize:size*0.32,
      boxShadow:`0 2px 6px ${col}55`,flexShrink:0,
      opacity: dim ? 0.45 : 1
    }}>{number}</div>
  )
}

function rankLabel(rank) {
  if (!rank) return null
  const map = {1:'1등',2:'2등',3:'3등',4:'4등',5:'5등'}
  const col = {1:'#f59e0b',2:'#a78bfa',3:'#34d399',4:'#60a5fa',5:'#94a3b8'}
  return <span style={{background:col[rank]+'22',color:col[rank],padding:'2px 8px',borderRadius:4,fontSize:12,fontWeight:700}}>{map[rank]}</span>
}

export default function PurchasePage({ draws }) {
  const [purchases, setPurchases] = useState([])
  const [manualNums, setManualNums] = useState(['','','','','',''])
  const [targetDraw, setTargetDraw] = useState('')
  const [checkedAll, setCheckedAll] = useState(false)

  const lastDrawNo = draws[draws.length - 1]?.draw_no || 0

  useEffect(() => {
    loadPurchases()
  }, [])

  function loadPurchases() {
    // 로컬스토리지에서 로드 (Supabase 미연결 시 폴백)
    const raw = JSON.parse(localStorage.getItem('lm_purchases') || '[]')
    // 당첨 결과 자동 매칭
    const withResults = raw.map(p => {
      const draw = draws.find(d => d.draw_no === p.draw_no)
      if (!draw || p.matched_count !== undefined) return p
      const winNums = [draw.n1,draw.n2,draw.n3,draw.n4,draw.n5,draw.n6]
      const matched = p.numbers.filter(n => winNums.includes(n)).length
      const hasBonus = p.numbers.includes(draw.bonus)
      let rank = null
      if (matched===6) rank=1
      else if (matched===5&&hasBonus) rank=2
      else if (matched===5) rank=3
      else if (matched===4) rank=4
      else if (matched===3) rank=5
      return {...p, matched_count:matched, rank}
    })
    // 업데이트 저장
    localStorage.setItem('lm_purchases', JSON.stringify(withResults))
    setPurchases(withResults.reverse())
  }

  function handleManualSave() {
    const nums = manualNums.map(Number).filter(n => n >= 1 && n <= 45)
    if (nums.length !== 6) return alert('번호 6개를 입력해주세요 (1~45)')
    const unique = [...new Set(nums)]
    if (unique.length !== 6) return alert('중복 번호가 있습니다')

    const drawNo = parseInt(targetDraw) || lastDrawNo + 1
    const existing = JSON.parse(localStorage.getItem('lm_purchases') || '[]')
    existing.push({
      numbers: nums.sort((a,b)=>a-b),
      draw_no: drawNo,
      source: 'manual',
      created_at: new Date().toISOString()
    })
    localStorage.setItem('lm_purchases', JSON.stringify(existing))
    setManualNums(['','','','','',''])
    setTargetDraw('')
    loadPurchases()
  }

  function checkAllResults() {
    loadPurchases()
    setCheckedAll(true)
    setTimeout(()=>setCheckedAll(false), 2000)
  }

  // 통계
  const total = purchases.length
  const won5 = purchases.filter(p=>p.rank===5).length
  const won4 = purchases.filter(p=>p.rank===4).length
  const won3 = purchases.filter(p=>p.rank===3).length
  const won2 = purchases.filter(p=>p.rank===2).length
  const anyWin = won5+won4+won3+won2
  const winRate = total > 0 ? Math.round(anyWin/total*1000)/10 : 0

  return (
    <div className="page">
      {/* 통계 요약 */}
      <div className="kpi-row">
        {[
          {label:'총 구매',val:total+'게임'},
          {label:'당첨 횟수',val:anyWin+'회'},
          {label:'당첨률',val:winRate+'%'},
          {label:'최고 등수',val:won2>0?'2등':won3>0?'3등':won4>0?'4등':won5>0?'5등':'없음'},
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-val">{k.val}</span>
          </div>
        ))}
      </div>

      {/* 수동 입력 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">번호 직접 입력</span>
          <span style={{fontSize:12,color:'#94a3b8'}}>구매한 번호를 수동으로 등록</span>
        </div>
        <div className="manual-input-row">
          {manualNums.map((v,i) => (
            <input key={i} type="number" min="1" max="45"
              className="num-input" value={v}
              placeholder={i+1}
              onChange={e => {
                const arr = [...manualNums]
                arr[i] = e.target.value
                setManualNums(arr)
              }}
            />
          ))}
        </div>
        <div className="manual-meta-row">
          <label style={{fontSize:13,color:'#94a3b8'}}>구매 회차</label>
          <input type="number" className="draw-input" placeholder={lastDrawNo+1}
            value={targetDraw} onChange={e=>setTargetDraw(e.target.value)} />
          <button className="save-btn-primary" onClick={handleManualSave}>저장</button>
        </div>
      </div>

      {/* 자동 결과 확인 */}
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
        <button className="check-btn" onClick={checkAllResults}>
          {checkedAll ? '✓ 결과 업데이트 완료' : '당첨 결과 자동 확인'}
        </button>
      </div>

      {/* 구매 이력 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">구매 이력</span>
        </div>
        {purchases.length === 0 ? (
          <div className="empty-msg">아직 등록된 구매 내역이 없습니다</div>
        ) : (
          <div className="purchase-list">
            {purchases.map((p, idx) => {
              const draw = draws.find(d => d.draw_no === p.draw_no)
              const winNums = draw ? [draw.n1,draw.n2,draw.n3,draw.n4,draw.n5,draw.n6] : []
              return (
                <div key={idx} className={`purchase-row ${p.rank?'hit':''}`}>
                  <div className="purchase-meta">
                    <span className="draw-no-tag">{p.draw_no}회차</span>
                    <span style={{fontSize:11,color:'#94a3b8'}}>{p.source==='app'?'앱생성':'수동입력'}</span>
                    {p.rank && rankLabel(p.rank)}
                  </div>
                  <div className="ball-row" style={{gap:6}}>
                    {p.numbers.map(n => (
                      <LottoBall key={n} number={n} size={34}
                        dim={winNums.length > 0 && !winNums.includes(n)} />
                    ))}
                  </div>
                  {winNums.length > 0 && p.matched_count !== undefined && (
                    <span className="matched-info">{p.matched_count}개 일치</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
