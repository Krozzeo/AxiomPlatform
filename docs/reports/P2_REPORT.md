# P2 — persistent catalog and shared services (historical report)

2026-10-21. Review branches feat/p2-shared-services / feat/p2-platform-services, based on integrated Platform0a0471b/Engine400fec0. Joint workflow pinned Engined6aad384d2a0f06ac841e7e56b2eab79bfdd766a, consuming public Platform78d219b04d16b13074d76414483bc121cef32be9 by HTTPS/integrity. Starting P3/P4 does not integrate P2.

Prior acceptance: owner ran P1 check6/6, browser passed:true with no pageErrors and confirmed manual tests. Platform Windows/Linux/product/browser and Engine CI332 passed before merging Platform PR1/EnginePR53 (includesP0). Recovery refs were retained.

P2 delivered persistent settings/catalog/registration, native folder selection, folder/file opening, source-preserving local import and product-validated GitHub listing/import. One host session owns GitHub credential via IPC; repository/preferences/history/publication stay product-specific. Engine reexports the installed pinned public provider rather than copying source or using a checkout link.

Local evidence: Platform 13 tests (P1 contracts, settings corruption/locks, bounded/link-safe copying, picker/cancel, account epochs/revocation and three real-process integration journeys). Covered catalog/root restart, unchanged source, two connected editors with isolated destinations/preferences, close without disconnecting the other, global disconnect, stale review invalidation, restart without token and uncertain commit reconciliation without duplicate/divergence writes. P1/P2 browsers passed without pageErrors. Engine npm run check444/444, including legacy native preference/history adoption. A lost storage-change race found by UI testing was fixed by serializing explicit actions and capturing values before refresh.

Limits: controlled HTTP and native chooser results, no real PAT/publication/manual Windows selection. Null does not prove GPU. Profiles/projects have separate locks; do not auto-reset corruption or remove live/stale locks without inspecting owners and copying data. Root changes do not move documents; duplicate identities reuse/reject existing entries. In-flight remote effects need journal reconciliation. Developer-style install remained until P4.

Remote checks are independent of local evidence. Engine CI334 later failed M18.3.11 drag cleanup (#55), despite the local browser pass. #47/#51/dense physics/model quality/shaders/GPU remain separate. Original-language detail is retained in archive/original-language.
