# Signal Sum

GitHub Pages Plus의 실제 데이터·함수 연결을 검증하는 공개 미니게임입니다.

- 정적 원본: GitHub Pages
- 애플리케이션 주소: <https://minigame-dev.euno.work/>
- GitHub Pages 원본: <https://jhl-labs.github.io/github-pages-plus-minigame/>
- 함수 API: `/_fn/signal-game/{challenge,leaderboard,submit}`
- 영속 데이터: PostgreSQL의 일일 실행권과 최고 기록

## 동작 방식

1. 브라우저가 `challenge` 함수를 호출하면 서버가 UTC 날짜 기반 퍼즐과 10분짜리 일회용 실행권을 만듭니다.
2. 플레이어는 2–4개의 셀을 골라 목표 합을 맞춥니다.
3. `submit` 함수는 답을 서버에서 다시 계산하고, 실행권을 한 번만 소비하며, 서버 시각으로 경과 시간을 계산합니다.
4. 더 좋은 기록만 PostgreSQL에 남고 `leaderboard`에서 상위 10개를 조회합니다.

새 전용 함수 이미지가 아직 롤아웃되지 않은 dev 전환 구간에는 이미 배포된
`reactions` 함수와 PostgreSQL 카운터를 사용해 일일 퍼즐 완료 횟수를 저장합니다.
전용 함수가 보이면 클라이언트가 자동으로 서버 검증 리더보드 모드로 전환합니다.

GitHub Pages 원본 주소에서는 정적 UI만 미리 볼 수 있습니다. 쓰기 요청은 CSRF 방어를 유지하기 위해 Pages Plus 주소에서 same-origin으로만 수행합니다.

## 로컬 검증

```bash
npm test
npm run check
python3 -m http.server 4173
```
