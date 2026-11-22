// 우리가족 일정 — "무엇을 누구에게 보낼지" 정하는 부분 (인터넷 없이 시험할 수 있게 따로 뺐어요)
// 앱(index.html)의 규칙과 똑같이 계산해요: 한국 시간 기준, 할일/일정, 매일·매주·매달·매년 반복.
'use strict';

const DOW = '일월화수목금토';
const pad = n => String(n).padStart(2, '0');

// 한국 시간으로 본 "지금" (연·월·일·요일·분)
function kstNow(ms = Date.now()) {
  const d = new Date(ms + 9 * 3600e3); // UTC 에 9시간을 더해서 getUTC* 로 읽으면 한국 시각
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, day: d.getUTCDate(), dow: d.getUTCDay(), min: d.getUTCHours() * 60 + d.getUTCMinutes(), hour: d.getUTCHours(), ms };
}
const ymdOf = k => `${k.y}-${pad(k.m)}-${pad(k.day)}`;
// 한국 날짜에 n일 더하기
function addDaysK(k, n) { const d = new Date(Date.UTC(k.y, k.m - 1, k.day + n)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, day: d.getUTCDate(), dow: d.getUTCDay(), min: 0, hour: 0 }; }
// 그 주 월요일 (앱의 weekKey 와 같아요)
function weekKeyOf(k) { return 'W' + ymdOf(addDaysK(k, -((k.dow + 6) % 7))); }

const isEvent = t => t && t.type === 'event';
const isTodo = t => !isEvent(t);

function yearlyOn(t, k) {
  if (!t.date) return false;
  const [, M, D] = t.date.split('-').map(Number);
  if (k.m !== M) return false;
  const leap = (k.y % 4 === 0 && k.y % 100 !== 0) || k.y % 400 === 0;
  if (M === 2 && D === 29 && !leap) return k.day === 28;
  return k.day === D;
}
function onDay(t, k) {
  const key = ymdOf(k);
  return t.kind === 'daily' ||
    (t.kind === 'once' && t.date === key) ||
    (t.kind === 'weekly' && t.dow != null && Number(t.dow) === k.dow) ||
    (t.kind === 'monthly' && t.dom != null && Number(t.dom) === k.day) ||
    (t.kind === 'yearly' && yearlyOn(t, k));
}
function periodKey(t, k) {
  if (t.kind === 'daily') return 'D' + ymdOf(k);
  if (t.kind === 'weekly') return weekKeyOf(k);
  if (t.kind === 'monthly') return `M${k.y}-${pad(k.m)}`;
  if (t.kind === 'yearly') return 'Y' + k.y;
  return 'once';
}
// checks: 체크 기록 목록 [{taskId, period}]
function isDone(t, k, checks) {
  const p = t.kind === 'once' ? 'once' : periodKey(t, k);
  return checks.some(c => c.taskId === t.id && c.period === p);
}
const fmtTime = t => { if (!t) return ''; const [H, M] = t.split(':').map(Number); return `${H < 12 ? '오전' : '오후'} ${H % 12 || 12}:${pad(M)}`; };
const byTime = (a, b) => (a.time || '99') < (b.time || '99') ? -1 : (a.time || '99') > (b.time || '99') ? 1 : 0;
const icon = t => /생일|생신|돌잔치/.test(t.title || '') ? '🎂' : t.kind === 'yearly' ? '🎉' : '📅';
const ieyo = s => { const c = String(s).trim().slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 === 0 ? '예요' : '이에요'; };

// 이 사람에게 알릴 일인가: 부모는 가족 모두의 것, 아이는 자기 것과 "가족 모두"
const forMember = (t, m) => m.role === 'parent' || t.assignee === m.id || t.assignee === 'all';

/**
 * 이번에 보낼 알림 목록을 만들어요.
 * @param {object} p
 *   now: ms, members: [{id,name,role}], tasks: [...], checks: [...], messages: [{id,from,text,at,taskTitle}],
 *   state: { lastMsgAt?: number, sent?: {key: ymd}, summaryDay?: {email: ymd} }
 * @returns {{ sends: [{to, title, body, tag, silent}], state }}
 */
function plan({ now = Date.now(), members, tasks, checks = [], messages = [], state = {} }) {
  const k = kstNow(now); const today = ymdOf(k); const tm = addDaysK(k, 1);
  const st = { lastMsgAt: state.lastMsgAt, sent: { ...(state.sent || {}) }, summaryDay: { ...(state.summaryDay || {}) } };
  for (const key in st.sent) if (st.sent[key] < today) delete st.sent[key]; // 지난 기록은 정리
  const sends = [];
  const nameOf = id => id === 'all' ? '가족 모두' : (members.find(m => m.id === id)?.name || '가족');
  const todays = tasks.filter(t => onDay(t, k)).sort(byTime);

  for (const m of members) {
    // 1) 곧 시작: 시간이 정해진 일정·할일, 20분 안에 시작하면 한 번 (GitHub 가 몇 분 늦게 돌 수 있어서 넉넉히)
    for (const t of todays) {
      if (!t.time || !forMember(t, m) || (isTodo(t) && isDone(t, k, checks))) continue;
      const [H, M] = t.time.split(':').map(Number); const diff = H * 60 + M - k.min;
      if (diff < -3 || diff > 20) continue;
      const key = `r|${t.id}|${today}|${m.id}`; if (st.sent[key]) continue;
      st.sent[key] = today;
      sends.push({
        to: m.id,
        title: diff > 0 ? `⏰ ${diff}분 뒤 · ${t.title}` : (isEvent(t) ? `📅 지금 · ${t.title}` : `✅ 할 시간이에요 · ${t.title}`),
        body: `${fmtTime(t.time)} · ${nameOf(t.assignee)}${t.memo ? '\n' + t.memo : ''}`,
        tag: `r10|${t.id}|${today}`, silent: false
      });
    }
    // 2) 아침 7시~11시 사이 첫 실행 때 오늘 요약 (하루 한 번)
    if (k.hour >= 7 && k.hour < 11 && st.summaryDay[m.id] !== today) {
      st.summaryDay[m.id] = today;
      const mine = todays.filter(t => forMember(t, m));
      const lines = [];
      for (const t of mine.filter(t => t.kind === 'yearly')) lines.push(`${icon(t)} 오늘 ${t.title}`);
      for (const t of tasks.filter(t => t.kind === 'yearly' && onDay(t, tm) && forMember(t, m))) lines.push(`${icon(t)} 내일 ${t.title}`);
      const evs = mine.filter(t => isEvent(t) && t.kind !== 'yearly');
      for (const t of evs.slice(0, 3)) lines.push(`📅 ${t.time ? fmtTime(t.time) : '하루 종일'} ${t.title} · ${nameOf(t.assignee)}`);
      if (evs.length > 3) lines.push(`📅 외 ${evs.length - 3}개`);
      const left = mine.filter(t => isTodo(t) && (t.assignee === m.id || t.assignee === 'all') && !isDone(t, k, checks));
      lines.push(left.length ? `✅ 내 할일 ${left.length}개 남았어요` : '✅ 오늘 할일이 없어요');
      const bday = mine.find(t => t.kind === 'yearly');
      sends.push({ to: m.id, title: bday ? `오늘은 ${bday.title}${ieyo(bday.title)}! · ${k.m}월 ${k.day}일 ${DOW[k.dow]}요일` : `오늘 · ${k.m}월 ${k.day}일 ${DOW[k.dow]}요일`, body: lines.join('\n'), tag: 'fam-today', silent: false });
    }
  }

  // 3) 새 채팅 글 (처음 실행 때는 기준만 잡고 보내지 않아요)
  const latest = messages.reduce((a, x) => Math.max(a, x.at || 0), st.lastMsgAt || 0);
  if (st.lastMsgAt != null) {
    const fresh = messages.filter(x => (x.at || 0) > st.lastMsgAt).sort((a, b) => a.at - b.at).slice(-5);
    for (const x of fresh) for (const m of members) {
      if (m.id === x.from) continue;
      sends.push({ to: m.id, title: `💬 ${nameOf(x.from)}`, body: String(x.text || '').replace(/\s+/g, ' ').slice(0, 120) + (x.taskTitle ? `\n📅 일정에 올렸어요: ${x.taskTitle}` : ''), tag: `m|${x.id}`, silent: false });
    }
  }
  st.lastMsgAt = latest;
  return { sends, state: st };
}

module.exports = { plan, kstNow, ymdOf, onDay, isDone };
