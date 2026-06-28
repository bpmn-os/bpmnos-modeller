// Minimal lint runner for tests: parses a BPMN file with bpmn-moddle and runs selected
// lint rules against the moddle tree, collecting their reports.
//
// We drive the rule modules directly (rather than going through src/modules/linting/index.js,
// which uses webpack-style extensionless imports that Node's ESM loader can't resolve). This
// still exercises the real rule logic — the part we care about for regressions.
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const mod = await import('bpmn-moddle');
const BpmnModdle = mod.default || mod.BpmnModdle;

// Rule id -> module path (relative to this file).
export const RULES = {
  'cycle': '../src/modules/linting/bpmn/cycle.js',
  'implicit-start': '../src/modules/linting/bpmn/implicit-start.js',
  'implicit-end': '../src/modules/linting/bpmn/implicit-end.js',
  'structural-anomaly': '../src/modules/linting/bpmn/structural-anomaly.js',
  'non-interrupting-boundary-event': '../src/modules/linting/bpmn/non-interrupting-boundary-event.js',
};

// Recursively visit every moddle element (skipping $parent back-references to avoid loops).
function walk(el, visit, seen = new Set()) {
  if (!el || typeof el !== 'object' || seen.has(el) || typeof el.$type !== 'string') return;
  seen.add(el);
  visit(el);
  for (const key of Object.keys(el)) {
    if (key === '$parent') continue;
    const v = el[key];
    if (Array.isArray(v)) v.forEach(c => walk(c, visit, seen));
    else if (v && typeof v === 'object') walk(v, visit, seen);
  }
}

/**
 * Lint `xmlPath` with the given rule ids. Returns an array of { rule, id, message }.
 */
export async function lint(xmlPath, ruleIds) {
  const moddle = new BpmnModdle();
  const { rootElement } = await moddle.fromXML(readFileSync(xmlPath, 'utf8'));
  const reports = [];
  for (const ruleId of ruleIds) {
    const path = RULES[ruleId];
    if (!path) throw new Error(`unknown rule '${ruleId}'`);
    const rule = require(path)();   // each rule module is a factory returning { check }
    const reporter = { report: (id, message) => reports.push({ rule: ruleId, id, message }) };
    walk(rootElement, el => rule.check(el, reporter));
  }
  return reports;
}

// Just the messages (sorted), handy for set comparisons in tests.
export function messages(reports) {
  return reports.map(r => r.message).sort();
}
