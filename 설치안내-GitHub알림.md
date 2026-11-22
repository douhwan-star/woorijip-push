# 앱을 닫아도 오는 알림 — GitHub 연결 안내

**무엇을 하나요?** GitHub(무료)가 5분마다 우리 앱 일정을 확인해서, 폰 상단 알림창에 문자·카톡처럼 알림을 보내요.
- ⏰ 곧 시작할 일정·할일 (20분 안)
- 🌅 아침 7시쯤 오늘 요약 (생일·일정·남은 할일)
- 💬 가족이 채팅에 쓴 새 글

**걸리는 시간:** 처음 한 번, 약 20분 · **비용:** 무료 · **필요한 것:** PC, 이메일 주소

> GitHub 가 바쁠 때는 알림이 **몇 분 늦게** 올 수 있어요. 그래서 일정은 20분 전부터 미리 알려요.

---

## 1단계. GitHub 가입 (5분, 이미 있으면 건너뛰기)
1. PC 크롬에서 **github.com** → **Sign up**
2. 이메일 · 비밀번호 · 사용자 이름(영어) 입력 → 이메일로 온 인증 코드 입력

## 2단계. 저장소 만들기 (2분)
1. 오른쪽 위 **+** → **New repository**
2. Repository name: `woorijip-push` (아무 영어 이름이나 괜찮아요)
3. **Public** 선택 ← 꼭 Public! (Private 는 무료 사용 시간이 모자라요)
   - 공개돼도 괜찮아요. 올리는 파일에는 가족 정보·비밀번호가 **하나도 없어요**. 비밀 열쇠는 3단계의 "비밀 칸"에만 넣어요.
4. **Create repository**

## 3단계. 비밀 열쇠 넣기 (5분) ⚠️ 이건 꼭 아빠가 직접
알림 프로그램이 우리 일정을 읽고 알림을 보내려면 Firebase **관리자 열쇠**가 필요해요.
이 열쇠는 비밀번호처럼 중요해서, **GitHub 의 비밀 칸에만** 넣고 다른 곳(카톡·메일·채팅)에는 붙여 넣지 마세요.

1. Firebase 콘솔 → ⚙ **프로젝트 설정** → **서비스 계정** 탭
   https://console.firebase.google.com/project/woorijip-todo/settings/serviceaccounts/adminsdk
2. **새 비공개 키 생성** → **키 생성** → `woorijip-todo-firebase-adminsdk-....json` 파일이 내려받아져요
3. 그 파일을 **메모장**으로 열어서 내용 전체를 복사 (Ctrl+A → Ctrl+C)
4. GitHub 저장소 → **Settings** → 왼쪽 **Secrets and variables** → **Actions** → **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT` (그대로 정확히)
   - Secret: 복사한 내용 붙여넣기 → **Add secret**
5. 내려받은 .json 파일은 **지워 주세요** (휴지통도 비우기). GitHub 에 들어갔으니 더 필요 없어요.

## 4단계. 파일 올리기 (5분)
PC 의 이 폴더에 있는 파일을 올려요: `우리집할일판-앱\push-sender`
1. 저장소 첫 화면 → **uploading an existing file** (또는 **Add file → Upload files**)
2. `push-sender` 폴더 **안의** 파일과 폴더를 모두 끌어다 놓기:
   - `.github` 폴더 (안 보이면: 파일 탐색기 → 보기 → **숨긴 항목** 체크)
   - `logic.js`, `send.js`, `package.json`, `package-lock.json`, `test.js`
3. 아래 **Commit changes** 클릭
4. 올라간 뒤 저장소에 `.github/workflows/push.yml` 이 보이면 성공이에요.
   - 끌어다 놓기로 `.github` 폴더가 안 올라가면: **Add file → Create new file** → 이름 칸에 `.github/workflows/push.yml` 입력 → PC 의 push.yml 내용 붙여넣기 → Commit

## 5단계. 시험해 보기 (3분)
1. 저장소 → **Actions** 탭 → (처음이면 초록 버튼 **I understand my workflows, go ahead and enable them**)
2. 왼쪽 **우리가족 알림 보내기** → 오른쪽 **Run workflow** → **Run workflow**
3. 1분쯤 뒤 초록 ✓ 가 뜨면 성공. 눌러서 `node send.js` 줄을 열면
   `가족 4명 · 알림 받는 폰 1대 · 보낼 알림 …` 같은 기록이 보여요.
   - 빨간 ✗ 면 그 화면을 찍어서 Claude 에게 보여 주세요.
4. 그다음부터는 **5분마다 저절로** 돌아요.

## 6단계. 가족 폰마다 알림 켜기 (1명당 1분)
1. 폰 크롬에서 앱 열기 → **가족** 탭 → **알림** → **📲 앱을 닫아도 알림 받기**
2. "알림 허용?" → **허용**
3. 버튼이 **✓ 앱을 닫아도 알림 받는 중** 으로 바뀌면 끝!
- 아이폰은 사파리에서 **홈 화면에 추가**한 앱으로 열어야 해요 (iOS 16.4 이상).
- 폰마다 따로 켜야 해요. 끄고 싶으면 같은 버튼을 한 번 더 누르면 돼요.

---

## 알아 두면 좋은 점
| 내용 | 설명 |
|---|---|
| 누구에게 가나요? | 부모는 가족 모두의 일정, 아이는 자기 것과 "가족 모두" 일정만 |
| 채팅 알림 | 글 쓴 사람만 빼고 모두에게 |
| 앱을 보고 있을 때 | 앱 안에서 알림이 뜨니까, 같은 알림이 두 번 오지 않게 상단 알림은 생략해요 |
| 비용 | GitHub 공개 저장소의 예약 실행은 무료예요 |
| 멈추지 않게 | GitHub 는 오래 변화가 없는 저장소의 예약 실행을 멈춰요 → 프로그램이 한 달에 한 번 기록을 남겨서 멈추지 않게 해요 |
| 끄고 싶으면 | 저장소 → Actions → 우리가족 알림 보내기 → 오른쪽 ⋯ → **Disable workflow** |

## 문제가 생기면
| 증상 | 해결 |
|---|---|
| Actions 에서 "FIREBASE_SERVICE_ACCOUNT 비밀 값이 없어요" | 3단계 4번의 이름이 정확한지 확인 |
| 초록 ✓ 인데 알림이 안 와요 | 기록에 "알림 받는 폰 0대"면 6단계를 해 주세요. 폰 설정 → 앱 → 크롬 → 알림이 켜져 있는지도 확인 |
| 한참 늦게 와요 | GitHub 가 바쁜 시간대예요. 5~15분 늦을 수 있어요 |
| 관리자 열쇠가 새었을까 걱정돼요 | Firebase 콘솔 → 서비스 계정 → (Google Cloud 콘솔에서) 그 키를 **삭제**하고 3단계를 다시 하면 돼요 |
