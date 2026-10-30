# Axiom Platform

**Platform 0.1.12 / latest builds, installation history and Engineer CAD readiness.** A local browser workspace for the Axiom family: project/product Hub, authorized local services and shared AI integration. Axiom Game Engine and independent Axiom Math Lab are the reference products; [Axiom Engineer CAD](https://github.com/Krozzeo/AxiomEngineerCAD) is registered as a planned product with no executable release yet. The P0–P5 feature scope is implemented; [closure evidence and remaining operational checks](docs/MVP_CLOSURE.md) distinguish development completion from live-account/hardware acceptance.

Extract the complete prepared bundle and double-click **Axiom Hub** (or **Start Axiom.cmd**). It prepares missing dependencies and opens your browser; errors remain visible in the console. Keep all three folders together. [Startup and final test guide](docs/MVP_GUIDE.md).

- [Build history, Engineer CAD and startup refresh](docs/CATALOG_HISTORY_AND_ENGINEER_CAD.md).
- [Demo loading and project recognition](docs/PRODUCT_DEMOS.md).
- [0.1.10 catalog recovery](docs/RELEASE_DISCOVERY.md).
- [0.1.9 guide and validation](docs/PROVIDERS_AND_INSTALLATION_JOBS.md).
- [Master plan](docs/MASTER_PLAN.md), [P0–P5 roadmap](docs/ROADMAP.md), [handoff](docs/AI_HANDOFF.md), [documentation map](docs/index.md).
- [Architecture](docs/architecture/ARCHITECTURE.md), [ownership](docs/architecture/OWNERSHIP_MATRIX.md), [compatibility](docs/architecture/RELEASE_AND_COMPATIBILITY.md).
- [MVP closure decision](docs/adr/0007-mvp-closure.md).
- [Game Engine](https://github.com/Krozzeo/AxiomGameEngine) and [Math Lab](https://github.com/Krozzeo/AxiomMathLab).

Platform owns infrastructure/contracts, not product semantics. Engine keeps scenes, Unity-compatible scripting, rendering/shaders/physics/audio/animation and standalone game export. Its M19–M40 roadmap is unchanged. The still-missing game exporter is explicitly product-owned rather than an unfinished Platform MVP gate. Math Lab owns bounded calculation documents and reviewed AI edits, not a full mathematical suite.

OpenAI, Anthropic, Google and loopback local runtimes share one validated AI service. Authentication and model tests are separate. Windows can remember account tokens using DPAPI user encryption; other operating systems currently use session-only credentials; defaults and project overrides remain independent. All AI Apply/publication decisions remain human-owned. Modern Windows dialogs, recoverable deletion, notifications and one reconnecting editor per project are included.

Development/UI/current docs are English. [Contributing](CONTRIBUTING.md). Run `npm run check` with both product paths for joint tests, `npm run test:browser:mvp` for final UI acceptance and `python scripts/check_docs.py` for documentation. See the guide for regression/browser prerequisites.

[MIT](LICENSE); third-party licenses remain applicable. Commercial decisions remain deferred. Future work is maintenance or separately scoped expansion, not additional hidden MVP phases.

[Product release/account/storage/diagnostic contract](docs/PRODUCT_RELEASES.md): public prepared GitHub releases feed Installations and update indications without editing Platform for each product revision. Product account changes are refused; projects inherit Hub defaults or use explicit overrides.

[Experimental installation and configurable source guide](docs/EXPERIMENTAL_INSTALLATIONS.md).
