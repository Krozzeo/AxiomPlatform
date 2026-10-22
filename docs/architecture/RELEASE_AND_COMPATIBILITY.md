# Versions, installation and distribution

Platform, products, native documents and Game Engine scripting SDK have independent versions. A product declares the supported Platform API range and project formats. Pin the tested provider HTTPS archive and lockfile integrity; never depend on a moving remote main. During 0.x, document incompatible minor changes; stable incompatible contracts require major versions. Retire contracts only after consumer evidence and a deprecation period.

## MVP0.1.5 prepared distribution

The current bundle has three sibling folders: AxiomPlatform, AxiomEngine and AxiomMathLab, with built Engine assets, source/integrity locks, launchers, English guides and exact revision/file hashes. Platform0.1.5 and Math0.1.1 are integrated into main; the separately reviewed Engine0.0.55 consumer remains versioned/pinned. The MVP tag adds a recovery point without moving older protected refs. Automatic ports use a browser-safe private high range. See [current guide](../MVP_GUIDE.md) and [closure](../MVP_CLOSURE.md).

## Historical P4 prepared distribution

The combined Windows ZIP contains sibling AxiomPlatform/AxiomEngine folders, sources, locked dependencies metadata, built editor/Wasm, launchers and version/hash manifest. It excludes credentials, user projects, .git, node_modules and local caches. The root launcher derives paths from its own location. Keep both folders together when relocating.

Start-Axiom.cmd invokes the relative PowerShell bootstrap. It checks Node.js 24+ and .NET 10 with wasm-tools; missing compatible runtimes are downloaded from official HTTPS metadata into the local .axiom runtime folder. Node ZIP SHA256 and .NET ZIP SHA512 are verified before bounded extraction. npm ci installs the exact lockfile. A prepared bundle requires no Rust build; a source-only checkout without built output needs Rust 1.90/wasm target and reports this explicitly. First setup needs Internet and may take several minutes. No global runtime replacement or administrator installation is requested.

The host starts on a free loopback port and opens the default browser automatically. The console remains attached to the host; errors print diagnostics and the .cmd wrapper pauses. Ctrl+C stops the host. Profile data normally lives in APPDATA/AxiomPlatform, independent of the extracted ZIP. Existing PerfilPruebas profiles are recognized for compatibility. Projects default to the user's Documents/Axiom Projects.

## Product installations and rollback

Register an explicitly prepared product folder containing platform/product.json (or product.json). Validate descriptor, protocol/API range, capabilities and adapter containment. The local installation ID fingerprints the canonical descriptor and entry file; it is a change detector, not an authenticity signature or a complete recursive package attestation. Only register trusted local product packages.

Install versions side by side. Adding does not activate. Activate immediately only when that product has no starting/ready sessions; otherwise queue until sessions close. Existing sessions retain the original process/version. Keep the previous registration for rollback, and reopen saved projects using the selected compatible version. Missing/changed installations stay visible with errors for recovery. Do not delete prior program folders until no session uses them. Project files are never moved by activation.

This is local package registration and activation, not a signed registry, background downloader or universal installer. Future online product distribution needs an additional ADR and acceptance. Incompatible document migrations remain opt-in with backups.

Local authoring requires no account/cloud. AI/GitHub/runtime downloads expose their network requirements separately. Windows is the first distribution acceptance platform; cross-platform contract tests do not certify macOS/Linux installers. Standalone exported games remain independent of Platform/editor/AI. Both repositories are MIT; dependencies retain their licenses and historical tags are unchanged. Commercial decisions remain open.
