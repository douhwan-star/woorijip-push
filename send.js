// 우리가족 일정 — 알림 보내기 프로그램 (GitHub 에서 5분마다 저절로 돌아요)
// 1) 가족·일정·체크·채팅을 읽고  2) logic.js 로 보낼 알림을 정하고  3) 구글 FCM 으로 폰에 보내요.
// 관리자 열쇠(서비스 계정)는 GitHub 의 비밀 칸(FIREBASE_SERVICE_ACCOUNT)에만 있어요. 이 파일에는 없어요.
'use strict';
const admin = require('firebase-admin');
const { plan } = require('./logic');

async function main() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  // 아직 비밀 열쇠를 안 넣었으면 실패로 끝내지 않고 조용히 넘어가요 (실패 메일이 5분마다 가지 않게)
  if (!raw) { console.log('FIREBASE_SERVICE_ACCOUNT 비밀 값이 아직 없어요. GitHub 저장소 → Settings → Secrets and variables → Actions 에 넣어 주세요. (이번에는 건너뜀)'); return; }
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  const db = admin.firestore(); const fcm = admin.messaging();

  const list = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const stateRef = db.collection('pushState').doc('main');
  const since = Date.now() - 40 * 864e5;
  const [members, tasks, checks, tokens, stateSnap] = await Promise.all([
    db.collection('members').get().then(list),
    db.collection('tasks').get().then(list),
    db.collection('checks').where('at', '>=', since).get().then(list),
    db.collection('pushTokens').get().then(list),
    stateRef.get()
  ]);
  const state = stateSnap.exists ? stateSnap.data() : {};
  // 한 번 완료한 "날짜 일정" 체크는 오래돼도 남아 있어야 해서 따로 읽어요
  const onceChecks = await db.collection('checks').where('period', '==', 'once').get().then(list);
  const msgQ = state.lastMsgAt != null
    ? db.collection('messages').where('at', '>', state.lastMsgAt).orderBy('at').limit(50)
    : db.collection('messages').orderBy('at', 'desc').limit(1);
  const messages = await msgQ.get().then(list);

  const result = plan({ now: Date.now(), members, tasks, checks: [...checks, ...onceChecks], messages, state });
  const byOwner = new Map();
  for (const t of tokens) { if (!byOwner.has(t.owner)) byOwner.set(t.owner, []); byOwner.get(t.owner).push(t.id); }

  let sent = 0, failed = 0; const dead = new Set();
  for (const s of result.sends) {
    const toks = byOwner.get(s.to) || []; if (!toks.length) continue;
    // 알림 내용은 "data" 로만 보내고, 폰의 앱(sw.js)이 직접 띄워요
    const res = await fcm.sendEachForMulticast({
      tokens: toks,
      data: { title: s.title, body: s.body, tag: s.tag || '', silent: s.silent ? '1' : '0', url: '/' },
      webpush: { headers: { Urgency: 'high', TTL: '3600' } }
    });
    res.responses.forEach((r, i) => {
      if (r.success) sent++;
      else { failed++; const c = r.error && r.error.code; if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token' || c === 'messaging/invalid-argument') dead.add(toks[i]); }
    });
  }
  // 더 이상 안 쓰는 폰(앱 삭제·알림 끔)의 주소는 지워요
  await Promise.all([...dead].map(t => db.collection('pushTokens').doc(t).delete().catch(() => {})));
  await stateRef.set(result.state);
  console.log(`가족 ${members.length}명 · 알림 받는 폰 ${tokens.length}대 · 보낼 알림 ${result.sends.length}개 → 보냄 ${sent}, 실패 ${failed}, 지운 주소 ${dead.size}`);
}

main().catch(e => { console.error('알림 보내기 실패:', e.message); process.exit(1); });
