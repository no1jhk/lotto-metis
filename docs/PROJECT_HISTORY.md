# PROJECT_HISTORY.md — LottoMetis

---

## 2026-03-16 (Day 1)

### 기획 확정

- 앱 이름: **LottoMetis** (Quant Metis 시리즈 확장)
- 포지셔닝: "무작위가 아님을 데이터로 증명하는 앱"
- 레퍼런스 분석: LottoPick.kr 비교 분석 완료
  - LottoPick: 통계 분석 도구 (단방향)
  - LottoMetis 차별점: 구매 이력 저장 + 자동 당첨 확인 + 성과 추적

### 핵심 기능 스펙 확정

패턴 분석 5가지:
1. 갭 패턴 — 전주 번호 ±N 이내 출현율
2. 구간 사이클 — 십단위 구간별 상승/하강 추세
3. 동반 출현 쌍 — 함께 자주 나오는 번호 조합
4. 합계 밴드 — 당첨번호 합계 범위 트래킹
5. 보너스 번호 동향 — 2등 전략 특화

### 개발 완료 목록

- React + Vite 프로젝트 구성
- 분석 엔진 `src/lib/analysis.js` (패턴 5종)
- 번호 생성기 `GeneratorPage.jsx` — 근거 설명 카드 포함
- 구매 기록 `PurchasePage.jsx` — 수동 입력 + 자동 당첨 확인
- 성과 분석 `DashboardPage.jsx` — 히트맵, 구간 사이클, ROI
- 패턴 리포트 `AnalysisPage.jsx` — 5가지 패턴 상세
- 다크 테마 CSS 전체 구성

### 인프라 완료

- Supabase 프로젝트 생성 (Seoul 리전, ap-northeast-2)
- DB 테이블 3개: `draws`, `generated_sets`, `purchases`
- RLS 정책 설정 (allow all)
- `.env.local` 연결 완료
- `.gitignore` 설정 (.env.local, node_modules, public/draws.json)
- GitHub 레포: github.com/no1jhk/lotto-metis (Public)
- Vercel 배포 완료 (환경변수 포함)

### 현재 상태

| 항목 | 상태 |
|------|------|
| 로컬 실행 | ✅ localhost:5174 정상 |
| Vercel 배포 | ✅ 완료 |
| 번호 생성 기능 | ✅ 정상 작동 확인 |
| 실제 데이터 | ⏳ 샘플 1215회차 (랜덤) |
| Supabase 연동 | ⏳ 로컬스토리지 폴백 중 |

### 미완료 항목

- [ ] 실제 로또 당첨번호 수집
  - 동행복권 사이트 간소화 운영 중 → Python 크롤링 차단
  - 해결: 로그인 후 엑셀 다운로드 → JSON 변환
- [ ] 각 탭 기능 상세 테스트
- [ ] UI/UX 개선 (디자인 토큰 기반)
- [ ] 히트맵 시각화 고도화
- [ ] OCR 스캔 입력 기능
- [ ] 주간 자동 업데이트 (GitHub Actions cron)
- [ ] 3D 비주얼 히어로 (GLB 파일 연결)

---

## 버전 히스토리

| 버전 | 날짜 | 내용 |
|------|------|------|
| v0.1.0 | 2026-03-16 | 초기 베타 — 기능 구조 완성, 샘플 데이터 |
