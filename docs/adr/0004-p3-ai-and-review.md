# ADR-P0004 — Generic AI/review with domain adapters

2026-10-21. P3 review branches based on Platform 228e1be and Engine d6aad38; proceeding does not integrate P2.

Extract OpenAI HTTP/model/limits/usage, turn execution and task lifecycle into services/ai. Product adapters supply context, tool normalization, freshness guards, instructions and acceptance. Do not move OpenAiAssistant whole: C#/scene/PMD rules are domain code. Count actual late response usage while refusing tool execution after cancellation.

Hosted AiAccount owns one credential. SharedAiProvider uses session/project IPC; epoch changes invalidate old connections and cancellation bypasses the request queue. Global disconnect affects all; closing one product cancels its work only. Remove OPENAI_API_KEY from children. Persist only scoped usage counters, redact returned errors and mark pending usage unknown at host close. Late shutdown responses cannot overwrite a new session's ledger.

ToolRegistry validates each product's existing names without globally combining registries. Host/adapter, not model arguments, fix identity/revision/capabilities. Manual and AI proposals use the same extracted diff/hashes/human review gate. Journal codec retains receipts/pending calls; payload selection/reconciliation and MAIN resource transaction stay in the product. Deterministic game autonomy remains domain implementation.

Publish a compatible pinned provider before the consumer, retaining project documents/SDK 8. Saved model/limits are preferences, not proof of a live connection; retest on opening. P3 local evidence: Platform 21, Engine 445 plus browser P1/P2/P3 with controlled HTTP/Null. No real keys or model-quality claim; #55 and new CI are separate. [Guide](../P3_GUIDE.md).

Provider contract uses [official Responses behavior](https://developers.openai.com/api/docs/guides/migrate-to-responses): store:false, typed output and call_id-associated results. No endpoint/model migration or streaming change was part of P3.
