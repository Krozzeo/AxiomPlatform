# P5 report — second consumer and Hub refinements

2026-10-21. Owner-approved minimal Axiom Math Lab plus pending Hub changes. Review branches: Platform `feat/p5-math-lab` stacked on P4; Engine `feat/p5-shared-editor-shell` stacked on P4; Math Lab `feat/p5-minimal-lab` over its MIT documentation foundation. No merge, recovery ref movement or Engine API coverage credit is implied.

## Implementation

Platform0.1.4 owns a stable authenticated editor shell, deterministic named windows, browser Web Locks and expiring host leases; session close blocks the iframe and reopening reconnects it. Engine0.0.54 explicitly negotiates its framing origin while independent startup keeps frame-ancestors none. Math Lab0.1.0 uses the same public SDK with its own format/evaluator/editor/validated proposal transaction. Both consumers pin public Platform provider099d0d4c6098f434428793ebbe38d696e61f55c9 over HTTPS with lockfile integrity. The shared folder lease moved to the SDK without copying it into Math Lab.

Modern Windows Common Open/Folder/Save dialogs replace FolderBrowserDialog; path arguments remain data, chooser timeout/cancel is recoverable. Save exports reject linked targets. Reviewed project deletion uses Windows IFileOperation with recycle-only behavior, explicit confirmation and no permanent fallback. Existing canonical-root/fingerprint/nested-project guards remain. Hub selection/double click, active highlights, folder icon, icon-only AI/Settings shortcut and bell/history/toasts are implemented. Ordinary messages expire; global connection failures persist until recovery. Verified AI account hides credentials/test controls and exposes refresh/disconnect; only transport timeout/concurrency/response size are global.

Math Lab calculates sequential finite real arithmetic/variables/functions without eval, owns a native version1 calculation document, supports manual editing/save/reopen/import/export and project model persistence. AI prepares one isolated bounded proposed-cell operation; review binds hashes/revision; human Apply revalidates and atomically saves before replacing MAIN. Cancellation, invalid/nonfinite results, stale review/disk and write failures preserve MAIN. Full MATLAB, symbolic algebra, matrices, plotting and cross-product workflows are outside scope.

## Local evidence

- Platform36/36 with real Engine/Math and explicit disposable Windows recycle integration enabled.
- Math Lab6/6 domain tests plus independent-import boundary check.
- Engine447/447 with build, generated contracts/bindings, schema/architecture/parity and unit/integration tests. An earlier full run hit a transient Windows EPERM while renaming an AI settings file; the repeated full run passed. This does not claim the existing intermittent filesystem risk has been eliminated.
- Browser P1–P5 exercise their real products with controlled account transports and Null; current final evidence is stored under `.axiom/p*-browser` and included in the delivery evidence sidecar. UI checks include simultaneous domains, isolation, manual/AI persistence, one editor/duplicate block/close/reconnect, notifications and host-offline recovery.
- Windows common-dialog interop compiles in Windows PowerShell5; IFileOperation actually recycled a newly created disposable local folder. Interactive Open/Folder/Save choice remains a separate human check.

The ZIP's VERSIONS.json records exact final heads, pinned provider and file hashes. Final CI status must be read on the linked PR heads; local tests are not upstream CI.

## Gates and remaining work

P5 is a review candidate pending human acceptance/integration. P4's standalone exported-game gate remains open: direct editor startup is not a game-export pipeline. Existing Engine #47/#51/#55 and older browser/performance failures remain independently tracked; fresh-machine runtime downloads, native interactive dialogs and real account/model quality/cost are separate. No tokens are included in source, documents or the ZIP. UI/current documentation are English; historical sources remain reference only. Main/recovery refs and the Unity/shader/compute/GPU M19–M40 roadmap remain intact.

Review links: [Platform P5](https://github.com/Krozzeo/AxiomPlatform/pull/5), [Engine P5](https://github.com/Krozzeo/AxiomGameEngine/pull/58), [Math Lab](https://github.com/Krozzeo/AxiomMathLab/pull/1).
