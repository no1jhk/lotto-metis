# LottoMetis 🎱

> 데이터 기반 로또 번호 예측 엔진

## 빠른 시작

### 1. 의존성 설치
```bash
cd /Users/jhkim/Documents/lotto-metis
npm install
```

### 2. 당첨번호 수집 (최초 1회)
```bash
python3 scripts/crawl_draws.py
```
→ `public/draws.json` 생성 (전 회차 약 1,177개)

### 3. 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:5173

---

## Supabase 연결 (선택, 나중에)

1. [supabase.com](https://supabase.com) → 프로젝트 생성
2. SQL Editor에서 아래 실행:

```sql
-- 당첨번호 원본
create table draws (
  draw_no int primary key,
  date text,
  n1 int, n2 int, n3 int, n4 int, n5 int, n6 int,
  bonus int,
  prize_1st bigint,
  winners_1st int
);

-- 앱 생성 번호
create table generated_sets (
  id uuid primary key default gen_random_uuid(),
  numbers int[],
  bonus_candidate int,
  strategy text,
  period_months int,
  draw_no_target int,
  created_at timestamptz
);

-- 구매 이력
create table purchases (
  id uuid primary key default gen_random_uuid(),
  numbers int[],
  draw_no int,
  source text,
  generated_set_id uuid references generated_sets(id),
  matched_count int,
  rank int,
  prize_amount bigint,
  checked_at timestamptz,
  created_at timestamptz
);
```

3. `.env.example` → `.env.local` 복사 후 키 입력
4. 크롤러 재실행 → Supabase 자동 업로드

---

## 기능

| 탭 | 기능 |
|---|---|
| ⚡ 번호 생성 | 패턴 분석 기반 번호 생성 + 근거 설명 |
| 📋 구매 기록 | 수동 입력 + 자동 당첨 결과 확인 |
| 📊 성과 분석 | 히트맵, 구간 사이클, ROI 추이 |
| 🔍 패턴 리포트 | 갭/구간/쌍/합계/보너스 상세 분석 |
