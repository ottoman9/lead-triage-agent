// Compare the agent's decisions with a human's blind manual pass.
// Fill the `my_decision` column of manual_pass.csv first (without looking at out/decisions.csv), then:
//   node compare_manual.mjs
import fs from 'node:fs';
const rows = t => { const [h, ...b] = t.trim().split(/\r?\n/); const H = h.split(','); return b.map(l => { const c = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(x => x.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')); return Object.fromEntries(H.map((k, i) => [k, c[i] || ''])); }); };
const agent = Object.fromEntries(rows(fs.readFileSync('out/decisions.csv', 'utf8')).map(r => [r.lead_id, r]));
const manual = rows(fs.readFileSync('manual_pass.csv', 'utf8')).filter(r => r.my_decision);
let agree = 0; const diffs = [];
for (const m of manual) { const a = agent[m.lead_id]; if (!a) continue; if (a.decision === m.my_decision.trim().toUpperCase()) agree++; else diffs.push(`${m.lead_id}: me ${m.my_decision} vs agent ${a.decision} (${a.reason})`); }
const out = `Manual rows: ${manual.length}\nAgreement: ${agree}/${manual.length}\nDisagreements:\n${diffs.join('\n') || '(none)'}\n`;
fs.writeFileSync('out/manual-vs-agent.txt', out); console.log(out);
