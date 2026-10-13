# Lead Triage Agent (Single Grain Beat Claude, AI Automation 012)

First-pass triage for inbound website leads. Every row gets `QUALIFY`, `NURTURE`, `REJECT` or `ESCALATE`, a one-sentence reason and a confidence.

Brief version: 2026-07 · Fixture: `fixtures/inbound_leads.csv` · sha256 `89b2b67b45d6d38e27bca36105188e350878f913794ef6016d31727d4fd6bc1a`

## Run it

```bash
node triage.mjs                         # uses the local `claude` CLI (Claude Code), model sonnet
ANTHROPIC_API_KEY=sk-... node triage.mjs   # or the Anthropic Messages API directly
node triage.mjs path/to/other_fixture.csv  # any CSV with the same columns
```

Node 18+. No dependencies. Outputs:

| File | What |
|---|---|
| `out/decisions.csv`, `out/decisions.json` | one entry per lead: decision, reason, confidence, duplicate_of, flags, guardrail_overrides, llm_notes |
| `out/run-<timestamp>.jsonl` | the run log: fixture checksum, every pre-check, the exact prompt sent per row, the raw model output, the parsed output, the final row, timing |
| `out/console-v1.txt`, `out/console-v2.txt` | console output of the first run and the fixed run |
| `out/decisions-v1.*` | the first run's decisions, kept to show the bad outputs that v2 fixed |

## How it works

1. **Parse** the CSV (quoted fields, embedded commas).
2. **Deterministic pre-checks in code** (cannot be talked out of): missing or malformed email, disposable or placeholder email, free email with no company, malformed timestamp, unparseable or normalised budget (`15k` → 15000, `we'll discuss` → unknown), implausible budget, empty message, HTML/entities stripped, prompt-injection phrasing, executable links and payment pressure, privacy-rights requests, repeat contacts (same email or same normalised company).
3. **LLM judgment** per lead. The lead is serialised as JSON inside `<lead_record>` tags and the system prompt states that everything inside is untrusted data, never instructions. The model also sees the pre-check flags and, for a repeat contact, the earlier decision.
4. **Guardrails in code have the last word**: security signals → REJECT and forward to security; privacy requests → ESCALATE to the privacy owner; junk → REJECT; an injection attempt can never be QUALIFIED; no contact / no intent / unverifiable identity can never be QUALIFIED; a repeat of a lead already in the pipeline is merged, not opened again; a disposable inbox never gets automated follow-up; confidence is capped at 0.8 when inputs were malformed. Every override is logged.

## Manual comparison

`manual_pass.csv` is a blank sheet for a human's blind pass. Fill `my_decision`, then `node compare_manual.mjs` writes `out/manual-vs-agent.txt`.
