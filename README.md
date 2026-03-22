# FrontEnd
# 🎸 BandPick — Client

> 밴드 동아리 공연 매칭 시스템 **프론트엔드**  
> 부원의 희망 곡·포지션·합주 가능 시간을 수집하고, 기획자가 팀 매칭 및 합주 스케줄을 관리하는 웹 애플리케이션
<br/>

## 📌 프로젝트 개요

정기공연을 준비할 때마다 기획자 1명이 30명 가까운 부원들의 희망 곡, 포지션, 스케줄을 수작업으로 정리하던 문제를 해결하기 위해 시작된 프로젝트

- 부원이 직접 희망 곡·포지션·합주 가능 시간을 입력
- 수집된 데이터를 기반으로 자동 팀 매칭 및 합주 스케줄 생성
- 기획자가 시각적으로 확인하고 수동으로 조정 가능
<br/>

## 🛠 기술 스택

ENVIRONMENT

<img src="https://img.shields.io/badge/visual studio code-007ACC?style=for-the-badge&logo=visualstudio&logoColor=white"> <img src="https://img.shields.io/badge/git-F05032?style=for-the-badge&logo=git&logoColor=white"> <img src="https://img.shields.io/badge/github-181717?style=for-the-badge&logo=github&logoColor=white">

FRONTEND

<img src="https://img.shields.io/badge/Nuxt.js-00DC82?style=for-the-badge&logo=nuxtdotjs&logoColor=white"> <img src="https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white"> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"> <img src="https://img.shields.io/badge/Tailwind CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">

LIBRARIES

RELEASE

<img src="https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white">

COMMUNICATION

<img src="https://img.shields.io/badge/notion-000000?style=for-the-badge&logo=notion&logoColor=white">
<br/>

## 📁 프로젝트 구조
```
미정
```
<br/>

## ⚙️ 시작하기

### 설치 및 실행

```bash
# 1) 저장소 클론 (실제 팀 저장소 URL로 바꿔 주세요)
git clone https://github.com/<조직 또는 사용자>/BandPick.git
cd BandPick/Client

# 2) 의존성 설치
npm install

```bash
# 3) 개발 서버 (기본 http://localhost:3000)
npm run dev
```

### 빌드

모든 명령은 **`Client` 폴더**에서 실행합니다.

```bash
# Nuxt 프로덕션 빌드 (SSR, .output 생성)
npm run build

# 정적 사이트 생성 (Render Static Site 등 SSG 배포용)
npm run generate

# 빌드 결과 미리보기
npm run preview
```

**SSR 빌드 후 Node로 직접 띄우기** (`npm run build` 실행 후):

```bash
node .output/server/index.mjs
```

<br/>


## 📱 주요 화면

### 부원 화면

| 단계 | 경로 | 설명 |
|------|------|------|
| STEP 1 | `/member` | 이름 및 고유코드 입력 |
| STEP 2 | `/member` | 희망 곡·포지션 선택 (드래그로 순위 설정) |
| STEP 3 | `/member` | 합주 가능 시간대 선택 |
| 수정 | `/member/edit` | 고유코드로 본인 데이터 조회 및 수정 |

### 관리자 화면

| 경로 | 설명 |
|------|------|
| `/admin` | 대시보드 — 입력 현황, 미작성 부원, 빠른 실행 |
| `/admin/members` | 전체 부원 데이터 테이블 조회 |
| `/admin/teams` | 자동 팀 매칭 실행 및 수동 재배치 |
| `/admin/schedule` | 합주 스케줄 타임테이블 — Drag&Drop 수동 조정 |
| `/admin/settings` | 공연 곡·마감시간·매칭 파라미터 설정 |

<br/>

## 🤝 기여 가이드

### 브랜치 전략

```
main          # 프로덕션 배포 브랜치
└── dev       # 개발 통합 브랜치
    ├── feat/member-form
    ├── feat/admin-schedule
    └── fix/...
```

### 커밋 메시지 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
style: 코드 포맷, 세미콜론 등 (로직 변경 없음)
refactor: 코드 리팩토링
chore: 빌드 설정, 패키지 업데이트 등
docs: 문서 수정
```

### PR 규칙

- `dev` 브랜치로 PR 생성
- 최소 1명 이상 코드 리뷰 후 머지
- PR 제목은 커밋 컨벤션과 동일한 형식 사용
