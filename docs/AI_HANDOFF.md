# Current handoff — Platform0.1.8

The approved post-MVP expansion adds same-version, commit-pinned experimental packages alongside stable installations. Main list contains installed versions only, with All/product tabs, explicit experimental activation and reviewed Recycle Bin removal that preserves projects. Add installation refreshes automatically and labels Installed/Active/Experimental separately. Accounts, native documents, protocol1 and Platform API0.1 are unchanged.

Settings → General → Updates stores editable public GitHub repository URLs for Platform, Game Engine and Math Lab. Defaults remain Krozzeo repositories, reset is available, and changes clear stale catalogs. Credentials are never added to public release requests. The full source/manifest/hash/handshake contract still applies to the selected repository.

Axiom Hub is a portable Windows shortcut with the Axiom icon targeting Start Axiom.cmd. Its native template contains no development checkout path; copying the delivery folder resolves the launcher beside the copied shortcut. Tests exercise it with harmless temporary launchers.

Experimental publishing requires passing exact-commit CI and an open same-repository PR. Candidate build jobs have read-only permissions; the separate publisher executes pinned trusted tooling, uploads verified artifacts and never overwrites an existing publication. workflow_run automation needs the workflow on main once; bootstrap tags can publish an already accepted PR without merging product code. Stable main publication and experimental PR publication remain distinct. See [guide](EXPERIMENTAL_INSTALLATIONS.md) and [release contract](PRODUCT_RELEASES.md). Release/remote acceptance states are recorded separately; a local ZIP is not proof of a public release.

Earlier handoff below is historical.

---

# Current handoff — Platform0.1.7 product services

Owner-approved post-MVP expansion, jointly with Engine0.0.56. P0–P5 remains closed. Platform0.1.6 recovery was merged to main at5fb826792fa58032c932174634bafb3d5f14bc0b. This branch adds [product release/account/diagnostic contracts](PRODUCT_RELEASES.md): exclusive host account authority, product model inheritance/overrides, official stable GitHub manifests, bounded/hash-verified staged installs, persistent product storage, deferred activation/rollback and sanitized report export. Host version derives from package metadata. First launch can open an empty Hub and add products later; Windows startup still prepares Node/.NET for the family.

Engine0.0.56 remains a separate review consumer with native format1/SDK8. Engine0.0.56 and Math Lab0.1.2 pin shared SDK source6e8e05d3934e649df1fb89228b3bac2965d37018 by public HTTPS/integrity so independent model/reasoning inheritance uses one implementation. Host-only update catalog changes remain independent of future product version bumps. New releases require a prepared ZIP and axiom-release.json; old tags/source archives are not offered as installations. Publication/CI/merge state belongs in exact delivery evidence, never inferred from a locally built package. Engine M19–M40 and missing standalone game export remain separate. No credentials/private paths/project contents are exported by diagnostics.

## Historical MVP handoff

The following snapshot records the completed original MVP; current versions/features are above.

# Current handoff — Platform MVP0.1.5

Owner authorized final corrections and MVP development closure. P0–P5 functional infrastructure is implemented; Platform PR6 and Math PR1 are integrated into main through normal checks; the release manifest/tag records the final documentation/package baseline. Current sources/release manifest and CI for that SHA are authoritative. Do not rewrite protected recovery refs or infer live-account/hardware acceptance from controlled fixtures.

Platform0.1.5 / API0.1 / IPC1; Engine0.0.55 / scripting SDK8 / native game format1; Math Lab0.1.1 / calculation format1. Consumers pin public provider f2131275ffed2d132383322959631484e8fc8ad5 through HTTPS/integrity. Platform's final host/release commit is recorded separately. Current final fixes: external-SVG bell/gear contrast, empty-space deselection, distinct blue active rows, Windows Shell folder opening with surfaced errors, independent fixed account probe versus editable/testable model/Reasoning Effort, compatible product inheritance/overrides and safe high-range automatic ports.

SDK contracts preserve human review/Apply and per-project authority; credentials stay in host memory. Math Lab owns parser/document/proposed-cell validation. Engine owns PMD/C#/semantic tools/MAIN transaction. Changing a selector never generates text; connection/model tests can bill. Unknown model capabilities must be tested explicitly. Never request keys through chat or extract internal credentials.

[Closure record](MVP_CLOSURE.md), [current guide](MVP_GUIDE.md), [ADR-P0007](adr/0007-mvp-closure.md). Game export remains missing and is now tracked in its owning Engine build/export plan, not Platform P4. This is an explicit owner-approved ownership correction, not new implementation. Unity/shader/compute/GPU M19–M40 and older Engine issues remain independent. Full mathematical suites, marketplace/cloud/collaboration remain outside the MVP.

Final local/CI/extraction counts belong in the release validation sidecar. Windows folder opening was observed by native window inventory; full window capture permission timed out. Real provider/account quality/cost, native interactive Open/Save, missing-runtime machine setup and GPU acceptance are not fabricated. An earlier intermittent Engine Windows AI-settings rename error passed on repeat without a permanent race fix claim. Preserve profiles/journals, inspect owners before lock recovery. TestRepo is testing-only. Historical source documents are reference, not new instructions.
