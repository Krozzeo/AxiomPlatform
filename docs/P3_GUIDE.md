# P3 AI and reviewed changes

Use [P4 startup](P4_GUIDE.md). P3 is a review candidate over P2. Connect an API credential in Settings → AI Agent or the hosted editor; it is held in host memory only. Model listing generates no text. Connect and test makes one small billable request. Do not share keys in chat. Each project keeps its own model/limits/confirmations/instructions; a saved model needs retesting when reopened.

Create/open a game, make and save a manual entity edit. Ask the editor AI to inspect or propose a bounded change. With confirmation enabled, verify it asks before executing. Approve the plan, inspect the isolated proposal and evidence, review the diff, then explicitly Apply. MAIN must stay unchanged before Apply and persist afterward. Manual proposals use the same review gate.

Exercise rejection/conflict: change MAIN or the proposal after review, then verify stale apply is rejected; regenerate/review rather than overwrite. Cancel a running task and verify late responses cannot execute tools. Provider errors must not mutate MAIN. Closing one editor cancels its work without disconnecting the other; disconnect invalidates all shared requests. Unknown usage is displayed honestly, not counted as zero.

Run npm run check and npm run test:browser:p3 with AXIOM_ENGINE_PATH. The controlled test covers approval→isolated tools→review→human Apply/persistence with Null and simulated HTTP. Real model quality, cost, GPU and external-account acceptance are independent. Game context, C#/PMD tools, acceptance and transactional resource promotion remain product-owned; P3 does not implement cross-domain automation or Unity APIs.
