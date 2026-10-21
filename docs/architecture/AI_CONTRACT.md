# AI integration and domain operations

P3 extracts provider/model contracts, turn runtime, cancellation/usage, in-memory session credential broker, persistent secret-free ledger, tool registry, review hashes/gates and journal codec. Game Engine retains instructions/context, PMD content, semantic handlers, acceptance and transactional application/rollback/resources. Legacy tool names remain in product-specific registries; no cross-product tool namespace or automation is silently introduced.

Each tool describes its version, input/output schema, capability, scope, effect class, preconditions and validation/recovery strategy. Unregistered operations cannot run. UI and agent invoke the same domain rules where applicable; transient UI interaction can remain product-specific. Structured results and evidence are required, not simulated clicks as the primary API.

Capture base revision → isolated proposal → domain operations → validation → diff/evidence → human accept/reject → compare current base → transactional apply → receipt/history. If MAIN or proposal changes, require conflict handling and fresh review. Cancellation/close invalidates late tool execution. Partial failure requires tested rollback or explicit recovery.

Reading, local editing and external publication are distinct permissions. Shared account availability never grants Apply or publication authority. External writes use operation IDs and receipts; ambiguous outcomes require reconciliation instead of blind retry. Local rollback cannot remove a remote commit.

Usage reports actual provider tokens or explicit unknown usage; it is not billing or an account-level spending limit. Project model/limits/confirmations remain independent. Listing models generates no text; connection testing makes one small billable request. A saved model is not a tested connection on reopening.

Evidence records actor, tool/version, project/revisions, result, checks, usage and redacted references. Controlled HTTP and Null acceptance remain distinct from real provider quality/cost and actual GPU rendering. P4 adds an account connection/settings UI, not new domain autonomy.
