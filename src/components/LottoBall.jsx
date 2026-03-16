export const BALL_COLORS = ['#E8B800','#1255A8','#C01A1A','#374151','#166534']

export function ballColor(n) {
  if (n <= 10) return BALL_COLORS[0]
  if (n <= 20) return BALL_COLORS[1]
  if (n <= 30) return BALL_COLORS[2]
  if (n <= 40) return BALL_COLORS[3]
  return BALL_COLORS[4]
}

export default function LottoBall({ number, size = 40, dim = false, bonus = false }) {
  const col = dim ? '#3d4151' : ballColor(number)
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: col,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: dim ? '#6b7280' : '#fff',
      fontWeight: 700,
      fontSize: size * 0.32,
      boxShadow: dim ? 'none' : `0 2px 8px ${col}66`,
      flexShrink: 0,
      outline: bonus ? `2px solid #f59e0b` : 'none',
      outlineOffset: 2,
      transition: 'all 0.15s',
    }}>
      {number}
    </div>
  )
}
