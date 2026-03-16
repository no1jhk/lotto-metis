# DESIGN_TOKENS.md — LottoMetis

> **참고 기준:** `/Documents/multi-angle-generator/docs/DESIGN_TOKENS.md` (Runway ML 스타일)
> LottoMetis는 멀티앵글 디자인 시스템을 베이스로 하되, 다크 테마 + 골드 액센트로 변형 적용

---

## 상태: v0.1 초안
기능 검증 후 UI 개선 단계에서 세부값 확정 예정

---

## 1. 멀티앵글과의 차이점

| 항목 | 멀티앵글 (Light) | LottoMetis (Dark) | 이유 |
|------|-----------------|-------------------|------|
| 테마 | 라이트 (#FFFFFF 배경) | 다크 (#0F1117 배경) | 숫자/데이터 집중, 긴장감 |
| 액센트 | 바이올렛 (#7C6BF0) | 골드 (#F59E0B) | 로또/황금 이미지 |
| 폰트 | Inter | Pretendard / Inter | 한국어 대응 |
| 느낌 | 프로덕트 도구 | 데이터 분석 대시보드 |

그 외 철학 (절제, 얇은 보더, 넉넉한 여백, 600 이하 weight) 동일 적용

---

## 2. Color Tokens

### 배경
| Token | Value | 용도 |
|-------|-------|------|
| `--bg-primary` | `#0F1117` | 앱 전체 배경 |
| `--bg-secondary` | `#1A1D26` | 카드 배경 |
| `--bg-tertiary` | `#252836` | 인풋, 호버 배경 |
| `--bg-overlay` | `rgba(0,0,0,0.5)` | 모달 오버레이 |

### 보더
| Token | Value | 용도 |
|-------|-------|------|
| `--border` | `#2D3142` | 기본 구분선 |
| `--border-hover` | `#3D4155` | 호버 상태 |
| `--border-focus` | `#F59E0B` | 포커스 링 |

### 텍스트
| Token | Value | 용도 |
|-------|-------|------|
| `--text-primary` | `#F1F5F9` | 제목, 핵심 텍스트 |
| `--text-secondary` | `#94A3B8` | 서브텍스트, 라벨 |
| `--text-muted` | `#64748B` | 힌트, placeholder |
| `--text-inverse` | `#0A0600` | 버튼 위 텍스트 |

### 액센트
| Token | Value | 용도 |
|-------|-------|------|
| `--gold` | `#F59E0B` | CTA 버튼, 로고, 주요 강조 |
| `--gold-hover` | `#FBBF24` | 버튼 호버 |
| `--gold-subtle` | `rgba(245,158,11,0.08)` | 선택 카드 배경 |
| `--gold-border` | `rgba(245,158,11,0.22)` | 활성 보더 |

### 시맨틱
| Token | Value | 용도 |
|-------|-------|------|
| `--green` | `#10B981` | 상승, 당첨, 성공 |
| `--blue` | `#3B82F6` | 정보, 차트 |
| `--red` | `#EF4444` | 하락, 에러 |
| `--purple` | `#8B5CF6` | 패턴 분석, 쌍 분석 |

---

## 3. 로또 볼 색상 (동행복권 기준)

| 구간 | 색상 | Hex |
|------|------|-----|
| 1~10 | 노란색 | `#E8B800` |
| 11~20 | 파란색 | `#1255A8` |
| 21~30 | 빨간색 | `#C01A1A` |
| 31~40 | 진회색 | `#374151` |
| 41~45 | 초록색 | `#166534` |

---

## 4. Typography

멀티앵글과 동일 체계 적용

| 용도 | 폰트 | 크기 | 굵기 |
|------|------|------|------|
| 앱 전체 | Pretendard, Inter, system-ui | — | — |
| 카드 타이틀 | — | 15px | 600 |
| KPI 수치 | — | 22px | 700 (예외적 허용) |
| 본문 | — | 14px | 400 |
| 라벨/뱃지 | — | 11~12px | 500 |

> 멀티앵글과 동일: **600이 최대 원칙** (KPI 수치만 700 허용)

---

## 5. Spacing (멀티앵글과 동일)

| Token | Value | 용도 |
|-------|-------|------|
| `space.2` | `8px` | 아이콘-텍스트 간격 |
| `space.3` | `12px` | 컴포넌트 내부 |
| `space.4` | `16px` | 인풋 패딩, 요소 간 |
| `space.5` | `20px` | 카드 패딩 |
| `space.6` | `24px` | 섹션 간 |
| `space.10` | `40px` | 페이지 패딩 |

---

## 6. Border Radius (멀티앵글과 동일)

| Token | Value | 용도 |
|-------|-------|------|
| `radius.sm` | `6px` | 뱃지, 작은 버튼 |
| `radius.md` | `8px` | 인풋, 카드 |
| `radius.lg` | `10px` | 큰 카드 |
| `radius.xl` | `12px` | CTA 버튼 |

---

## 7. Animation (멀티앵글과 동일)

| Token | Value | 용도 |
|-------|-------|------|
| `duration.fast` | `150ms` | 호버, 토글 |
| `duration.normal` | `200ms` | 패널 전환 |
| `duration.slow` | `400ms` | 번호 등장 |
| `easing.default` | `ease-out` | 기본 |

---

## 8. Anti-Patterns (멀티앵글과 동일)

- ❌ 그래디언트 배경 버튼
- ❌ 글로우/네온 효과
- ❌ 과도한 border-radius (20px+)
- ❌ font-weight 700+ (KPI 제외)
- ❌ 복잡한 shimmer/pulse 애니메이션
- ❌ 배경색으로 영역 구분 (→ border 사용)
- ❌ 이모지 아이콘 남발
