// Zeitplan des Montags-Artikels (n8n „LIAR-2026-10 Plan-Artikel“).
// WICHTIG: Die n8n-Instanz rechnet Zeitauslöser in Europe/Berlin (geprüft 26.10.2026: $now.zoneName),
// NICHT in UTC. Ein Auslöser um 07:00 ist also 07:00 Berliner Zeit – Sommer wie Winter.
// planGate() wird in den Code-Knoten „Berliner Zeit 07 Uhr?“ eingefügt (Schutz gegen Fehlstarts).

const INSTANCE_TZ = 'Europe/Berlin';
const PLAN_HOUR = 7;

function planScheduleRule() {
  return { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: PLAN_HOUR, triggerAtMinute: 0 }] };
}

function planGate(src, berlinHour) {
  const body = src && src.body;
  const viaHook = !!(body && typeof body === 'object' && ('test' in body || 'start' in body));
  if (viaHook) return { run: true, is_test: !!body.test };
  return { run: Number(berlinHour) === PLAN_HOUR, is_test: false };
}

// Wie viele Auslöser einer Regel kommen durch den Filter? (Instanz-Zeit = Berliner Zeit)
function firingRuns(rule) {
  return rule.interval.filter(i => planGate({}, i.triggerAtHour).run).length;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { INSTANCE_TZ, PLAN_HOUR, planScheduleRule, planGate, firingRuns };
}
