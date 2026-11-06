# DESIGN.md — 건물은 학생을 만드는가 · 발표 덱 디자인 가이드

> 25분 학술제 발표용 HTML 모션 그래픽 슬라이드 덱.
> 기준: `npx getdesign@latest add apple` 템플릿(아이폰 광고/키노트 무대 스타일) + 딥 블랙 덱 커스터마이즈.

---

## 1. 설계 원칙 (3줄 요약)

1. **무대는 검다.** 배경은 딥 블랙 `#000000`. 내용물(숫자·차트)만 빛난다.
2. **타이포가 곧 디자인이다.** SF Pro 계열(San Francisco)의 굵고 빡빡한 헤드라인. 음수 자간(-0.02em ~ -0.03em), 무게는 600. 무게 500 금지.
3. **모션은 애플 키노트처럼.** 텍스트는 Scale Up(1.07→1) + Fade In + 상승(46px→0)으로 "꽂히듯" 등장. 차트는 anime.js로 스크롤/클릭 없이 자동으로 그려진다.

## 2. 디자인 토큰 (apple.css 참조)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--canvas` | `#000000` | 딥 블랙 무대 |
| `--tile-1/2/3` | `#1d1d1f` `#151516` `#0a0a0b` | 카드/타일 표면 |
| `--hairline` | `rgba(255,255,255,.12)` | 유일한 경계선 |
| `--primary` | `#2997ff` | 유일한 액센트(스카이 블루) — 링크·강조·포인트 |
| `--bio` / `--econ` | `#DD8452` / `#4C72B0` | 생물관 / 경통관 시그니처 (seaborn deep 팔레트) |
| `--body-muted/-faint` | `#cccccc` / `#86868b` | 보조 텍스트 |

**금지:** 장식용 그라데이션, 카드 그림자, 두 번째 액센트 컬러. (Apple 원칙: 그림자는 제품 이미지에만.)

## 3. 타이포그래피 스케일

| 클래스 | 크기 | 무게 | 용도 |
|---|---|---|---|
| `.t-hero` | 44~104px | 600 | 타이틀 |
| `.t-display` | 30~64px | 600 | 챕터 헤드라인 |
| `.t-head` | 24~40px | 600 | 슬라이드 제목 |
| `.t-lead` | 18~28px | 400 | 핵심 문장 (회색 `#cccccc`) |
| `.t-body` | 17px | 400 | 본문 — 16px가 아닌 17px |
| `.t-caption` / `.t-fine` | 14 / 12px | 400 | 캡션·출처 |
| `.t-kicker` | 14px, +0.12em 자간, 대문자 | 600 | 섹션 라벨 (액센트 블루) |

한글 폰트: **Pretendard** (CDN) → `-apple-system`/SF Pro 우선 폴백. 숫자는 `tabular-nums`(`.num`, `.stat-num`).

## 4. 슬라이드 아나토미 (PPT 양식 대응)

- **kicker** → 발표 섹션명 (PPT의 상단 소제목 밴드)
- **t-head/t-display** → 장 제목
- **card / tile** → 콘텐츠 박스 (PPT 도형). `border-radius: 18px`, hairline 테두리
- **stat-num** → 대형 숫자 (PPT의 강조 숫자)
- **chart-wrap + chart** → seaborn 스타일 SVG 차트
- **footnote** → 출처·읽는 법 (슬라이드 하단 고정, PPT의 각주)
- **chrome** → 진행 바(상단)·슬라이드 카운터(우하단)·타이틀(좌하단)·화살표(좌우) — 발표 운영 UI

레이아웃: 1200px 콘텐츠 폭, `.grid-2/3`, `.row`, 세로 정렬 `justify-content:center`.

## 5. 모션 시스템 (anime.js)

- **텍스트 등장**: `translateY 46→0 · scale 1.07→1 · opacity 0→1`, 950ms, `easeOutExpo`, `stagger 110ms`.
- **차트**: 막대는 바닥에서 자라나고(`height`/`y` 동시 애니메이션), 숲 그림 CI는 선 그리기(`stroke-dashoffset`), 분포 곡선도 왼쪽→오른쪽 그리기, 점은 `easeOutBack` 팝.
- **네비게이션**: 키보드(←→, Space, PageUp/Down, Home/End), 휠(900ms 스로틀), 좌우 화살표, URL 해시 `#N`.
- **재진입 시**: `.fx`와 차트는 항상 리셋 후 다시 재생된다.

## 6. 차트 사양 (charts.js — seaborn 스타일)

- 팔레트: seaborn `deep` (#4C72B0, #DD8452, #55A868, #C44E52 …) — 다크 무대용 whitegrid 아날로그(그리드 `rgba(255,255,255,.07)`, 축 `rgba(255,255,255,.28)`).
- 폰트·라벨은 SVG 내부에서 10.5~14px, 회색 `#86868b`.
- **데이터 규율**: 모든 수치는 원고 보고값. 예시(개념도) 차트 — `bimodal` — 는 봉우리 위치=보고된 집단 평균, 폭=보고된 전체 SD 재현치로, 차트 하단에 "개념 예시도, 원자료 아님"을 명시. **이 라벨은 절대 지우지 않는다.**
- 차트 종류: barDomain / forest / gapCompare / anscombe / bimodal / yearDots / gLadder / needs.

## 7. 반응형

- 833px 이하: 그리드 1열, row 세로화.
- 419px 이하: 화살표 숨김, 히어로 40px.

## 8. 수정 가이드

- 수치를 바꿀 때는 `index.html` 텍스트와 `assets/js/charts.js`의 데이터 배열을 **함께** 수정하고, 원고 PDF와 대조한다.
- `data/survey_data.csv`의 정제 로그 주석은 데이터 판단을 바꿀 때마다 갱신한다.
- `notebooks/analysis.ipynb`는 요약 통계 재현용 — 개인 단위 데이터를 지어 넣지 않는다.
