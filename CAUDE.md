# CAUDE.md — 에이전트·설정 가이드 (Orca Agent, Supabase 등)

이 파일은 이 저장소에서 작업하는 AI 에이전트(Orca/Claude 등)와 배포 환경을 위한 지침이다.

## 1. 프로젝트 개요

부산대학교 사회학과 학술제 발표(25분)용 HTML 모션 그래픽 슬라이드 덱.
연구: "건물은 학생을 만드는가: 단과대학 건물 인프라 차이와 학생의 만족도, 삶의 질"
원고: `학술제_최종원고_v8.pdf` (진실의 원천. 모든 수치는 이 파일에서만 취할 것)

## 2. 폴더 구조

```
/
├── /assets
│   ├── /images        # 원고 그래프 추출본(fig2~6, figA1, figA2) + 참고 에셋
│   ├── /css
│   │   ├── apple.css  # 아이폰 광고 스타일 토큰·키네틱 타이포
│   │   └── minim.css  # 미니멀 리셋 + 덱 운영 유틸
│   └── /js
│       ├── anime.min.js  # v3.2.2 로컬 사본
│       └── charts.js     # 개념도 차트 3종(bimodal/gLadder/needs) + 예비 차트
├── /data
│   └── survey_data.csv   # 요약 데이터 원본 (정제 로그 포함, 개인 응답 없음)
├── /notebooks
│   └── analysis.ipynb    # 요약 통계 재현 노트북 (Colab-ready)
├── index.html            # 20장 슬라이드 덱 메인
├── DESIGN.md             # 디자인 가이드
└── CAUDE.md              # 본 파일
```

### 원고 그래프 추출 레시피 (PDF → PNG)

원고의 Figure는 전부 **래스터 이미지**로 삽입되어 있다(그래서 텍스트 추출에 안 잡힘). 재추출 절차:

1. `pdfjs-dist@3.11.174` + `@napi-rs/canvas`로 페이지 렌더.
2. `getOperatorList()`에서 `OPS.paintImageXObject` 인자는 `[name, w, h]`뿐이므로, `OPS.save/restore/transform`으로 **CTM을 추적**해 이미지 사각형을 계산한다.
3. 캡션·주석 텍스트의 baseline 좌표와 대조해 크롭 영역을 확정(여백 ±4pt).
4. 검증: 크롭 상하 6px 행의 잉크율 = 0% (캡션·잘림 없음), 전체 잉크율 4~70% 범위.
5. 원고가 갱신되면 같은 절차로 `assets/images/fig*.png`를 갱신한다. **다시 그리지 않는다.**

## 3. 에이전트 규칙 (필수)

### 데이터 무결성 (최우선)
- **수치 조작 금지.** 새 수치를 만들거나 "있을 법한" 값을 지어내지 않는다. 차트·슬라이드의 모든 숫자는 원고 PDF의 보고값과 `data/survey_data.csv`에 기록된 값만 사용.
- **결측치 기계적 정제 금지.** 실측 3개 지표(주차, 책걸상 훼손, 휴게 면적)는 미측정이며 대체하지 않았다. 평균 대체는 표준편차를 줄여 데이터를 고르게 보이게 하는 왜곡이다.
- **정제는 판단.** 제외/처리 규칙을 바꿀 때는 `survey_data.csv` 상단 정제 로그에 날짜·사유를 기록한다.
- **예시 차트 라벨 유지.** `bimodal`(이봉 분포)은 개념 예시도이며 개인 응답이 아니다. `charts.js` 안의 "개념 예시도" 주석과 차트 하단 라벨을 삭제하지 않는다.
- 통계 보고: 평균·중앙값, n, SD를 함께. g는 Hedges' g, CI는 부트스트랩 5,000회 95%.

### 디자인
- 딥 블랙(#000) 무대, 단일 액센트(#2997ff), 무게 600 헤드라인, 무게 500·장식 그라데이션·카드 그림자 금지. 상세는 `DESIGN.md`.

### 코드
- 수정 시 `index.html` 본문 수치 ↔ `charts.js` 데이터 배열 ↔ `survey_data.csv`를 함께 맞춘다.
- 검증 명령:
  - `node --check assets/js/charts.js`
  - 슬라이드 수(20)/차트 id/이미지 경로 확인: `index.html`의 `spec` 배열과 `<section class="slide">` 개수, `assets/images/fig*.png` 존재
  - 로컬 미리보기: `npx serve .` 또는 브라우저에서 `index.html` 직접 열기

## 4. Supabase 설정 (설문 조사 백엔드)

이 저장소에는 키·시크릿을 넣지 않는다. 설문 수집용 Supabase를 연결하려면 `.env.local`(gitignore 대상)에만 기록한다.

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>          # 클라이언트용 공개 키
SUPABASE_SERVICE_ROLE_KEY=<secret>    # 서버 전용 — 절대 커밋 금지
```

원고 기준 데이터 사양:
- 테이블: `survey_responses` (문항 Q3~Q58, 원고 Appendix A 참조), `interview_transcripts` (비공개)
- RLS: 응답 테이블은 INSERT만 허용(anon), 조회는 service role 전용
- 정제 규칙(102→88건)은 서버 사이드에서 사전등록 기준으로 적용하고, 그 판단은 정제 로그에 기록

## 5. GitHub Pages 배포

```powershell
git add .
git commit -m "학술제 발표 덱: 18장 모션 슬라이드 + seaborn 차트"
git push origin main
# GitHub 저장소 Settings → Pages → Source: "Deploy from a branch" → main / root
```

- 배포 경로: 저장소 루트의 `index.html`이 그대로 서빙된다(폴더 구조의 `/data-literacy-deck` = 저장소 루트로 해석).
- 배포 주소: `https://<user>.github.io/<repo>/`
- 표시 확인: 18/18 카운터, 진행 바, 키보드/휠 네비게이션, 8개 차트 재생.

## 6. 에셋 정책

- `/assets/images`의 `fig*.png`는 원고 그래프 추출본이다. 원고가 갱신되면 위 레시피로 재추출한다.
- `/assets/images`는 Claude in Chrome 캡처·Google Flow 다이어그램 등 참고 에셋을 추가로 둘 수 있다.
- 참고용 아이폰 광고 스크린샷(`다운로드*.jpg/png`)은 `.gitignore` 대상이며 커밋하지 않는다.
- 인터뷰 음성·원자료·개인정보는 이 저장소에 절대 커밋하지 않는다.
