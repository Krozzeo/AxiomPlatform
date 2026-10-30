# Platform 0.1.12 — Build history, Engineer CAD and startup refresh

## Default version list and history

Installations → Add installation opens **Latest versions** every time. All stable releases remain selectable. Experimental releases are grouped by repository, product ID and PR number; only the most recently published build in each group appears by default. Publication time wins over the numeric version; deterministic version/commit tie-breaks handle equal or missing dates.

**Build history** lists the earlier experimental builds for the selected product tab, with their PR/commit and Installed/Active labels. They can be downloaded, activated and removed using the existing verified installation workflow. Switching views never deletes artifacts, installed versions or projects. The main Installations list continues to show every locally installed version.

Only latest builds and stable releases can be new updates. Historical builds never inflate the sidebar/product-tab/Add installation counters, even if never read. Read IDs remain repository-scoped and persistent. A newer build is new independently of its predecessor's read state. The complete validated catalog is retained for history/offline recovery; closed or merged PR publications retain the existing removal-from-discovery policy.

## Automatic startup refresh

Normal launcher/CLI startup automatically reconciles installations and checks configured release repositories, without opening the Add installation dialog or even requiring a browser connection. It removes registrations for manually deleted version folders, validates remaining product handshakes and activates a valid pending installation once no session for that product is running. Projects and their files are preserved.

GitHub discovery waits for saved account restoration and forces a fresh metadata check even when the saved catalog is warm. Conditional requests, unchanged-manifest reuse, persisted rate-limit/transient backoff and the last validated offline catalog remain in force. The Hub stays usable during this background work. Failures retain their specific discovery status; local refresh failures create a recoverable notification. Tests and embedded consumers can explicitly disable real remote checks; the ordinary launcher enables them.

## Axiom Engineer CAD registration

- Product ID: `axiom.engineer-cad`.
- Display name: **Axiom Engineer CAD**.
- Default repository: <https://github.com/Krozzeo/AxiomEngineerCAD>.
- Source URL: editable/resettable in Settings → General → Updates, like the other products.
- Current state: design only; no executable CAD installation or functional CAD capability is supplied by Platform.

Engineer CAD appears in Projects and Installations product tabs before installation. Creation remains disabled until an actual compatible installation exists. Its successful empty release query explicitly says no versions have been published. No placeholder process, invented project detector, file extension, geometry kernel or fake project is registered.

When a valid release appears, the normal refresh/install/activate flow recognizes it automatically, without another Platform update. The planned label does not prevent installing a validated publication. Host-owned accounts, authorized paths, project/session leases, native dialogs and shared AI/GitHub services remain generic SDK infrastructure; CAD geometry/document/solver semantics stay in the CAD repository.

## Contract for the first executable CAD release

The CAD implementation must supply its real `platform/product.json` and local adapter using the published product contract: [product IPC](architecture/PRODUCT_CONTRACT.md), [release compatibility](architecture/RELEASE_AND_COMPATIBILITY.md) and [AI authority](architecture/AI_CONTRACT.md). Advertise only implemented lifecycle/optional methods. `axiom.engineer-document` is the design's reserved format ID; its actual schema/version/physical encoding still require acceptance in the CAD project. Platform does not freeze the provisional `.axcad` extension.

Pin a verified Platform release/commit and SDK integrity when CAD implementation starts. Prepare the product with `scripts/prepare-release.mjs`; Engineer CAD archives receive the `AxiomEngineerCAD-<version>...zip` prefix. Publish `axiom-release.json` plus checksum/size-matching archives in the configured GitHub repository. Stable tags and experimental PR/build provenance follow the same validation as the other products. An open PR without an accepted prepared release is not offered as executable software.

No CAD repository source was modified for this registration. Its [approved master design](https://github.com/Krozzeo/AxiomEngineerCAD/blob/main/MASTER_DESIGN.md) remains authoritative for CAD development.

## Acceptance

`npm run check` covers product/PR grouping, read-state counters, installed history and restart, planned/future CAD release registration, startup removal of missing versions, pending activation and a warm-cache discovery of a new publication. Future CAD install acceptance uses an explicitly controlled IPC fixture, not a CAD engine.

`npm run test:browser:catalog` exercises the actual Hub and installer with controlled release HTTP: latest/history filtering, installing an earlier build, reopening with latest selected, CAD disabled/empty states and persistent configurable repository sources. `npm run test:browser:installations`, `npm run test:browser:discovery` and the existing product/demo profiles retain their regression roles. No live model request or user account/profile is used.

Local acceptance: **87/88 passed, zero failed, one existing opt-in native Recycle Bin skip** against both the CI-pinned reference Engine and current M20 Engine; **12/12 browser profiles** passed without page errors. [Retained results](reports/PLATFORM_0_1_12_ACCEPTANCE.json). Remote CI/public-package acceptance is reported separately by the release workflow.
