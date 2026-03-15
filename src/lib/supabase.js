// Supabase 미연결 시 로컬스토리지 폴백 모드
export const supabase = null

export async function fetchAllDraws() { return [] }
export async function fetchRecentDraws() { return [] }
export async function saveGeneratedSet(data) {
  const key = 'lm_generated'
  const list = JSON.parse(localStorage.getItem(key) || '[]')
  const item = { ...data, id: Date.now(), created_at: new Date().toISOString() }
  list.push(item)
  localStorage.setItem(key, JSON.stringify(list))
  return item
}
export async function savePurchase(data) {
  const key = 'lm_purchases'
  const list = JSON.parse(localStorage.getItem(key) || '[]')
  const item = { ...data, id: Date.now(), created_at: new Date().toISOString() }
  list.push(item)
  localStorage.setItem(key, JSON.stringify(list))
  return item
}
export async function fetchPurchases() {
  return JSON.parse(localStorage.getItem('lm_purchases') || '[]')
}
export async function updatePurchaseResult(id, data) {
  const key = 'lm_purchases'
  const list = JSON.parse(localStorage.getItem(key) || '[]')
  const idx = list.findIndex(p => p.id === id)
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; localStorage.setItem(key, JSON.stringify(list)) }
}
export async function checkUncheckedPurchases() { return [] }
