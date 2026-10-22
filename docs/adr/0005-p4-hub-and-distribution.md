# ADR-P0005 — P4 Hub, project management and prepared distribution

2026-10-21. Implemented review candidate over P3; owner explicitly requested the Hub/Settings/startup redesign and continuation of P4.

Use one project catalog with active-session information and icon actions. New/Add are distinct flows; remove the duplicate Open section. Separate routed Settings with sidebar navigation for General, Appearance, GitHub Account and AI Agent. Account icons share Engine assets/state conventions. Disconnected GitHub import shows no repository fields. English is the development/UI/maintained-documentation language; retain historical source snapshots separately.

Keep domain validation in Engine: starter 3D content and revision-aware atomic rename belong to its adapter/store. Platform manages catalog removal and separately reviewed permanent deletion of a closed project's canonical folder. Require typed current name, short-lived fingerprinted plan, bounded ordinary files and current-root containment; reject changed files or nested registered projects.

Distribute a relocatable prepared Windows ZIP with sibling products and built editor. Relative .cmd/PowerShell bootstrap uses compatible installed runtimes or locally downloaded official Node 24/.NET 10 archives with hashes, npm lockfile install and automatic default-browser opening. On failure keep the console via .cmd pause. No silent global runtime replacement.

Register compatible product versions side by side; validate adapter handshake before activation. Queue activation while sessions are live; keep previous version for rollback. No document conversion or process hot swap. The fingerprint covers descriptor/entry, not full provenance. Trusted local prepared packages only; signed online registry/updater remains future scope.

Extract only small proven UI helpers: accessible icon buttons, stable option replacement and theme selection. Engine consumes the common option primitive via its pinned package/build; specialized editor/dock composition stays in Engine. Tests include real lifecycle/rename/install/rollback plus browser settings/management and controlled error paths. Native Windows dialog operation and fresh-machine downloads are reported separately from mocked or preinstalled-runtime evidence.
