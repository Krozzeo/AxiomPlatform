# Axiom Platform MVP — closure record

Platform0.1.5 / API0.1 / IPC1. Reference products: Game Engine0.0.55 / scripting SDK8 / native game format1, Math Lab0.1.1 / native calculation format1. Public MIT; commercial planning deferred.

## Completed development scope

P0 ownership/contracts/documentation; P1 real product lifecycle; P2 persistent catalog/storage/import/shared GitHub; P3 shared AI transport/review primitives; P4 Hub/settings/distribution/installations/rollback; P5 independent Math Lab consumer and editor isolation/reconnection. Final user-reported Hub fixes are included. Future maintenance may fix regressions; new family products and additional Platform features belong to later planning, not an unfinished MVP phase.

OpenAI account connection uses a fixed small probe. Default model and Reasoning Effort remain editable after connection, save automatically without the key, and have a separate exact-configuration test. Model test failure does not silently discard a valid account merely because one model denies access. Products can inherit defaults or keep their own override; Math Lab proves inheritance, separate project testing and reasoning forwarding. Engine keeps its existing project model/reasoning configuration. No setting grants AI Apply/publication authority.

Bell/gear icons work in dark/light themes. Empty-space click clears selection. Active rows have a distinct blue tint below the selected state. Open folder resolves the canonical project directory and asks Windows Shell to open its associated UI; it no longer hides an Explorer process or treats process creation as sufficient success. Native launch errors surface as transient notices. Automatic local HTTP ports use the private high range and retry collisions, preventing Chromium service-port blocks such as6666.

## Evidence and practical limits

Release evidence includes Platform unit/integration tests with real products, Math domain/boundary tests, full local Engine checks, browser P1–P5 plus final MVP settings/selection/theme/folder dispatch acceptance. Windows IFileOperation actually recycles only its own disposable test folder. Native folder opening was executed outside the restricted runner and Windows inventory showed the named verification folder. The initial direct Explorer spawn showed no window; Windows Shell opening fixed it. Full Computer Use window capture required a separate app permission that timed out, so no captured native-dialog walkthrough is claimed.

Controlled AI/GitHub transports never use the owner's live credentials. Real-account/model-quality/cost, interactive native Open/Save and a machine without installed runtimes remain explicitly unperformed operational acceptance. Tests distinguish those from source feature completion. An earlier Engine full run had an intermittent Windows EPERM on AI settings rename; later full runs passed without claiming that separate filesystem risk eliminated. Current remote status belongs to each release/PR SHA, not a historical green run.

The prepared ZIP includes built editor assets, all three source folders, a double-click launcher, English guides, exact commit references and file hashes. No user projects, secrets, caches, node_modules or Git databases are included. The release validation sidecar records final counts/CI/relocated-extraction results. Main integration/release is performed only through normal checks; any blocked protection is reported, never bypassed.

## Required work owned by products

Standalone game export remains missing in Game Engine and is retained in its build/export roadmap. ADR-P0007 transfers its ownership from the earlier Platform P4 gate; it does not mark game export implemented. Engine Unity/shader/compute/GPU M19–M40 and older product issues remain independent. Math Lab remains a bounded real-calculation proof of concept, not symbolic algebra, matrices, plotting or a full MATLAB replacement.

See [the current test guide](MVP_GUIDE.md), [closure ADR](adr/0007-mvp-closure.md), [roadmap](ROADMAP.md) and [historical P5 report](reports/P5_REPORT.md).
