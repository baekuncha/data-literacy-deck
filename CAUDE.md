# CAUDE.md — 프로젝트 운영 가이드

## 1. 프로젝트 개요

부산대학교 사회학과 학술제 발표 덱: **"건물은 학생을 만드는가 — 단과대학 건물 인프라 차이와 학생의 만족도, 삶의 질"**

- 발표 시간: 25분 / 슬라이드: 15장 / 규격: 16:9 (1280×720)
- 연구 설계: 혼합방법 (실측 17개 지표 · 설문 88명 · 심층 인터뷰 6명)
- 배포: GitHub Pages

## 2. Orca Agent 설정

Orca Agent가 이 저장소에서 작업할 때 준수할 규칙:

```yaml
agent:
  name: orca
  role: "데이터 분석가 겸 프론트엔드 개발자"
  context_files:
    - DESIGN.md          # 디자인 토큰 및 슬라이드 양식 (Apple 분석 + Discord 다크 어댑테이션)
    - data/survey_data.csv
  rules:
    - "제공된 g 값(1.41/0.15/0.36/0.51/2.55/0.72)과 점수(0.80/1.20), n(88/6/17) 외 수치를 임의 생성하지 않는다"
    - "결측치를 조용히 평균 대체하거나 이상치를 기계적으로 삭제하지 않는다"
    - "요약 시 평균만 제시하지 않고 중앙값·n·SD를 함께 보고한다"
    - "히스토그램은 '보고된 g 기반 개형 개념도'임을 각주로 명시한다"
    - "인터뷰 인용은 원문 확보 전 placeholder 유지"
    - "HTML/CSS/JS 코드에 불필요한 주석을 추가하지 않는다"
  verification:
    - "index.html 로컬 오픈 시 15개 슬라이드 모두 렌더링되는지 확인"
    - "charts.js가 SC.bar / SC.forest / SC.histPair / SC.splitHist를 노출하는지 확인"
```

## 3. Supabase 설정 (설문 원자료 적재용)

원자료(설문 88명) 입수 시 Supabase에 적재해 분석 노트북과 연동한다. **원자료가 없으면 이 섹션을 실행하지 않는다.**

환경 변수 (`.env`, 절대 커밋 금지):

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
```

테이블 스키마 예시 (원자료 구조 확정 후 수정할 것):

```sql
create table survey_responses (
  id          uuid primary key default gen_random_uuid(),
  building    text not null check (building in ('생물관', '경제통상관')),
  grade       int  not null check (grade between 1 and 4),
  facility_sat      numeric,   -- 시설 만족도
  college_life_sat  numeric,   -- 대학생활 만족
  life_sat          numeric,   -- 삶의 만족
  stay_time_hours   numeric,   -- 수업 외 체류 시간
  building_identity numeric,   -- '우리 건물' 소속감
  interview_id      text,      -- 심층 인터뷰 참여자 연계(6명, nullable)
  created_at timestamp default now()
);
```

데이터 리터러시 원칙:

- 결측치는 `null` 유지 — 평균 대체 금지
- 집단 비교는 Hedges' g (pingouin `compute_effsize(eftype="hedges")`)
- 보고 시 `n / mean / median / sd` 동시 출력

## 4. 로컬 실행 & 검증

```powershell
# 슬라이드 확인 (루트에서)
Start-Process index.html          # 또는 npx serve .
node --check assets/js/charts.js  # JS 문법 검사
```

## 5. GitHub Pages 배포

```powershell
gh auth login
git config --global user.name "baekuncha"
git config --global user.email "makeouthill@pusan.ac.kr"
git add -A
git commit -m "feat: 학술제 발표 덱 (15장)"
gh repo create data-literacy-deck --public --source=. --remote=origin --push
gh api repos/{OWNER}/data-literacy-deck/pages -X POST -f "source[branch]=main" -f "source[path]=/"
# 접속: https://{OWNER}.github.io/data-literacy-deck/
```

## 6. 폴더 구조

```
/                        # GitHub Pages 루트 (main 브랜치)
├── assets/
│   ├── images/          # Claude in Chrome / Google Flow 캡처 등 발표 보조 에셋
│   ├── css/apple.css    # getdesign "apple" 디자인 시스템 구현체
│   ├── css/minim.css    # minim 라이브러리 + PPT 양식 프레임워크
│   └── js/
│       ├── anime.min.js # 모션 그래픽 (anime.js 3.2.2)
│       └── charts.js    # seaborn 스타일 SVG 차트 빌더
├── data/survey_data.csv # 보고된 요약 통계치만 (원자료 대체 예정)
├── notebooks/analysis.ipynb
├── index.html           # 15장 슬라이드 덱
├── DESIGN.md
└── CAUDE.md
```
