// 인터넷 없이 logic.js 시험: node test.js
'use strict';
const assert = require('assert');
const { plan } = require('./logic');

// 2026-11-22(일) 한국 시각을 UTC ms 로
const at = (h, m, day = 22) => Date.UTC(2026, 10, day, h - 9, m);
const members = [
  { id: 'dad', name: '아빠', role: 'parent' }, { id: 'mom', name: '엄마', role: 'parent' },
  { id: 'kid', name: '민준', role: 'child' }, { id: 'kid2', name: '서준', role: 'child' }
];
const tasks = [
  { id: 'e1', title: '태권도', type: 'event', kind: 'once', date: '2026-11-22', time: '15:10', assignee: 'kid' },
  { id: 'e2', title: '엄마 생일', type: 'event', kind: 'yearly', date: '1980-11-22', assignee: 'mom' },
  { id: 'e3', title: '할머니 생신', type: 'event', kind: 'yearly', date: '1950-11-23', assignee: 'all' },
  { id: 'e4', title: '피아노', type: 'event', kind: 'weekly', dow: 0, time: '17:00', assignee: 'kid2' },
  { id: 't1', title: '줄넘기', kind: 'daily', assignee: 'all' },
  { id: 't2', title: '수학 숙제', kind: 'once', date: '2026-11-22', time: '15:00', assignee: 'kid' },
  { id: 't3', title: '분리수거', kind: 'weekly', dow: 6, time: '15:05', assignee: 'dad' }
];
let r;

// 1) 오후 2:55 — 태권도(15:10)는 15분 뒤 → 민준·아빠·엄마에게, 서준에게는 안 감. 수학 숙제(15:00, 민준) 5분 뒤.
r = plan({ now: at(14, 55), members, tasks, checks: [], messages: [], state: {} });
const titles = to => r.sends.filter(s => s.to === to).map(s => s.title);
assert.deepStrictEqual(titles('kid'), ['⏰ 5분 뒤 · 수학 숙제', '⏰ 15분 뒤 · 태권도']);
assert.ok(titles('dad').includes('⏰ 15분 뒤 · 태권도'));
assert.ok(!titles('kid2').some(t => t.includes('태권도')), '서준에게 민준 태권도가 가면 안 돼요');
assert.ok(!r.sends.some(s => s.title.includes('분리수거')), '토요일 할일은 일요일에 안 와요');
// 같은 시각에 또 돌아도 다시 안 보내요
let r2 = plan({ now: at(14, 58), members, tasks, checks: [], messages: [], state: r.state });
assert.ok(!r2.sends.some(s => s.title.includes('태권도')), '한 번 보낸 건 다시 안 보내요');

// 2) 이미 체크한 할일은 안 알려요
r = plan({ now: at(14, 55), members, tasks, checks: [{ taskId: 't2', period: 'once' }], messages: [], state: {} });
assert.ok(!r.sends.some(s => s.title.includes('수학 숙제')));

// 3) 아침 7:05 요약 — 엄마 생일 + 내일 할머니 생신, 하루 한 번
r = plan({ now: at(7, 5), members, tasks, checks: [], messages: [], state: {} });
const momSum = r.sends.find(s => s.to === 'mom' && s.tag === 'fam-today');
assert.ok(momSum && momSum.title.startsWith('오늘은 엄마 생일이에요!'), momSum && momSum.title);
assert.ok(momSum.body.includes('🎂 내일 할머니 생신'));
const kidSum = r.sends.find(s => s.to === 'kid' && s.tag === 'fam-today');
assert.ok(kidSum.body.includes('오후 3:10 태권도'), kidSum.body);
assert.ok(!kidSum.body.includes('피아노'), '아이는 동생 일정을 요약에 안 받아요');
r2 = plan({ now: at(8, 0), members, tasks, checks: [], messages: [], state: r.state });
assert.ok(!r2.sends.some(s => s.tag === 'fam-today'), '요약은 하루 한 번');
// 밤에는 요약 안 보내요
assert.ok(!plan({ now: at(22, 0), members, tasks, state: {} }).sends.some(s => s.tag === 'fam-today'));

// 4) 채팅: 처음 실행은 기준만, 그다음 새 글은 쓴 사람 빼고 모두에게
r = plan({ now: at(12, 0), members, tasks: [], messages: [{ id: 'm0', from: 'mom', text: '예전 글', at: at(11, 0) }], state: {} });
assert.strictEqual(r.sends.length, 0);
r2 = plan({ now: at(12, 5), members, tasks: [], messages: [{ id: 'm1', from: 'mom', text: '저녁 7시 외식!', at: at(12, 3), taskTitle: '외식' }], state: r.state });
assert.deepStrictEqual(r2.sends.map(s => s.to).sort(), ['dad', 'kid', 'kid2']);
assert.strictEqual(r2.sends[0].title, '💬 엄마');
assert.ok(r2.sends[0].body.includes('📅 일정에 올렸어요: 외식'));
const r3 = plan({ now: at(12, 10), members, tasks: [], messages: [], state: r2.state });
assert.strictEqual(r3.sends.length, 0, '같은 글은 다시 안 보내요');

// 5) 받침: "할머니 생신" → 이에요, "아빠 파티" → 예요
r = plan({ now: at(7, 5, 23), members, tasks, state: {} });
assert.ok(r.sends.find(s => s.to === 'dad' && s.tag === 'fam-today').title.startsWith('오늘은 할머니 생신이에요!'));

console.log('logic.js 시험 모두 통과 ✅');
