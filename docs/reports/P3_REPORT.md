# P3 — shared AI and changes (historical report)

2026-10-21. Review branches feat/p3-ai-and-changes / feat/p3-platform-ai over P2 (228e1be/d6aad38). Public provider017e54168f87ea5a0d5b97adfbb2314673bc298d, pinned HTTPS/integrity; joint consumer9697b5829baa60c0cde48d80b5eea35457f17670. P2/P3 were not merged into main. Owner explicitly requested P3 with #55 visible.

Delivered provider/contracts/model filtering, turn/task runtime, session credential broker, scoped persistent usage and disconnect/cancellation/epochs; tool registry/validation, diff/hashes/human gates and journal receipts/pending operations. Engine consumes these while retaining game tools/instructions/PMD, reconciliation and application/rollback/resources. Hosted model/limits persist but connection must be retested after reopening. Hub exposed available credential and reported/unknown usage.

Local Platform 21/21, no skipped joint tests. Three real-process AI integration journeys cover manual/AI approval/diff/Apply/reopen/two projects, cancelled late response/provider429 and stale review/concurrent MAIN/edited proposal without overwrite. Generic tests cover endpoint/size/redaction, cancelled turns, scoped/restarted ledger/late shutdown, registry and journal. Existing13 P1/P2 tests remained. Engine check445/445 and focused assistant/work-order/workspace95/95 passed with the public installed package; saving limits without selecting a model/reopen without requests was verified.

P3 browser: create/edit/save, shared host connection with cleared key, human plan approval, isolated tools, Review and human Apply persisting X=2; Hub reported fixture250 tokens, no pageErrors. Controlled AI HTTP/Null; not real key/bill/model quality/GPU. Unknown usage stays unknown; OPENAI_API_KEY is stripped from children, previous journals/preferences preserved.

Remote Platform acceptance8 (39640460620) and docs10 (39640460471) passed. Final Engine CI336 (39640404321) passed43/46, with browser M18.3.11 and M17 plus aggregate gate failing. These are not resolved by local acceptance. #55/#47/#51/dense physics/native GitHub/real model remain tracked. Original-language detail is retained in archive/original-language.
