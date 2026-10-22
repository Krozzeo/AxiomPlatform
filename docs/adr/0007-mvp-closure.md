# ADR-P0007 — MVP closure and product export ownership

Owner decision, 2026-10-21: implement the final Hub/AI corrections and finish the Axiom Platform MVP. The preceding proposal to move the game-export requirement into Game Engine planning was accepted as part of that closure.

The Platform MVP covers the P0–P5 infrastructure scope: local browser Hub, versioned adapters/lifecycle, authorized project storage/import/catalog, shared session accounts, AI transport/review contracts, reusable presentation, prepared Windows distribution, local installation selection/rollback and two independent products. Its functional implementation is complete at0.1.5; close development after automated acceptance and normal protected-branch integration. Manual account/model-quality and fresh-machine acceptance are operational checks and must never be represented as already performed.

Transfer the earlier Platform P4 standalone exported-game gate to Game Engine build/export acceptance. Keep it required and explicitly unimplemented there. Direct editor startup and Math document export do not satisfy it. No Unity/shader/compute/GPU coverage or Engine milestone completion follows from this ownership correction. Engine M19–M40 remains independent.

Separate OpenAI account connection from model configuration: a fixed small gpt-4.1-nano connection probe never changes preferences. Model/Reasoning Effort can change and be tested separately after connecting. Persist only nonsecret defaults; products retain project overrides and human Apply authority. Known nonreasoning families expose provider default; unknown/new capabilities require a successful explicit model test. No automatic generation merely because a selector changes.

MVP fixes also cover visible theme-safe bell/gear icons, outside-click deselection, a stronger blue active-session tint, shell-associated Windows folder opening with surfaced failures and safe automatic high-range loopback ports. The latter avoids browser-restricted ports exposed by the final Windows regression. Public provider source is immutable/integrity-pinned; consumer and host release heads are recorded separately. No recovery refs are rewritten.
