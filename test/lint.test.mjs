import test from 'node:test';
import assert from 'node:assert/strict';
import { lint, messages } from './lint-runner.mjs';

const fx = f => new URL(`./fixtures/${f}.bpmn`, import.meta.url).pathname;

// [fixture, rules, expected messages] — each fixture is an example of a case where the
// linter should (or should not) report. Not exhaustive; a representative regression set.
const cases = [
  // --- cycle (replaces the old self-loop "loop" rule) ---
  ['cycle-self-loop',                ['cycle'], ['Use loop activities instead of cycles']],
  ['cycle-backedge',                 ['cycle'], ['Use loop activities instead of cycles']],
  ['acyclic-ok',                     ['cycle'], []],

  // --- implicit-end (now also flags start events without an outflow) ---
  ['implicit-end-start-no-outflow',  ['implicit-end'], ['Implicit end']],
  ['implicit-end-dangling',          ['implicit-end'], ['Implicit end']],
  ['implicit-end-ok',                ['implicit-end'], []],

  // --- implicit-start ---
  ['implicit-start-no-inflow',       ['implicit-start'], ['Implicit start']],

  // --- non-interrupting boundary events ---
  ['boundary-non-interrupting',      ['non-interrupting-boundary-event'], ['Non-interrupting boundary events can cause races']],
  ['boundary-interrupting-ok',       ['non-interrupting-boundary-event'], []],

  // --- structural anomaly: sound models report nothing ---
  ['struct-valid-parallel',          ['structural-anomaly'], []],
  ['struct-valid-exclusive',         ['structural-anomaly'], []],

  // --- structural anomaly: gateway mismatches ---
  // exclusive fork -> parallel join: the join waits for a token that may never come (deadlock)
  ['struct-deadlock',                ['structural-anomaly'], ["Not symmetric with 'PJ'", "Not symmetric with 'XF'"]],
  // parallel fork -> exclusive join: the join fires per token (race)
  ['struct-race-parallel-exclusive', ['structural-anomaly'], ["Not symmetric with 'PG'", "Not symmetric with 'XG'"]],
];

for (const [f, rules, expected] of cases) {
  test(`${f} (${rules.join(', ')})`, async () => {
    const reports = await lint(fx(f), rules);
    assert.deepEqual(messages(reports), [...expected].sort());
  });
}

// Known gap: a race where one concurrent branch can escape (here via an error boundary) is
// not yet detected — the reducer dissolves the exclusive merge before validating its parallel
// block. Asserts the DESIRED behaviour; marked todo until the reducer is fixed, at which point
// this should start passing and the todo flag can be removed.
test('struct-escape-race should report a race (known gap)', { todo: true }, async () => {
  const reports = await lint(fx('struct-escape-race'), ['structural-anomaly']);
  assert.ok(reports.length > 0, 'expected a race/anomaly report for the escape variant');
});
