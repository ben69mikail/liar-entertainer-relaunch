// Regression: Montags-Artikel (LIAR-2026-10 Plan-Artikel) startete am 26.10.2026 nicht.
// Ursache: n8n rechnet Zeitauslöser in der Instanz-Zeitzone Europe/Berlin (nicht UTC).
// Auslöser 05:00 + 06:00 → Filter „nur 07 Uhr Berlin“ verwarf beide Läufe still.
// Aufruf: node --test ops/n8n/plan-schedule.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { INSTANCE_TZ, planScheduleRule, planGate, firingRuns } = require('./plan-schedule-lib.cjs');

test('n8n-Instanz rechnet in Europe/Berlin', () => {
  assert.equal(INSTANCE_TZ, 'Europe/Berlin');
});

test('Zeitauslöser: genau einmal montags um 07:00 (Instanz-Zeit)', () => {
  const r = planScheduleRule();
  assert.equal(r.interval.length, 1);
  assert.deepEqual(r.interval[0], { field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: 7, triggerAtMinute: 0 });
});

test('Auslöser + Filter ergeben genau EINEN Lauf (Sommer- und Winterzeit)', () => {
  assert.equal(firingRuns(planScheduleRule()), 1);
});

test('alter Auslöser (05 + 06 Uhr) hätte nie gestartet – genau der Fehler vom 26.10.', () => {
  const alt = { interval: [5, 6].map(h => ({ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: h, triggerAtMinute: 0 })) };
  assert.equal(firingRuns(alt), 0);
});

test('Filter: Zeitauslöser nur um 07 Uhr Berlin, Webhook immer', () => {
  assert.deepEqual(planGate({}, 7), { run: true, is_test: false });
  assert.deepEqual(planGate({}, 6), { run: false, is_test: false });
  assert.deepEqual(planGate({ body: { test: true } }, 15), { run: true, is_test: true });
  assert.deepEqual(planGate({ body: { start: true } }, 15), { run: true, is_test: false });
});

test('Workflow-Quelle nutzt genau diese Regel (kein zweiter Auslöser, 07 Uhr)', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('./plan-artikel.sdk.js', import.meta.url), 'utf8');
  const hours = [...src.matchAll(/triggerAtHour:\s*(\d+)/g)].map(m => Number(m[1]));
  assert.deepEqual(hours, [7]);
});
