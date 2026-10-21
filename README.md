# Axiom Platform

A local browser workspace for the Axiom family: a product/project Hub, shared local services and semantic AI integration. Axiom Game Engine is the first working product. CAD, mathematics and animation applications remain future directions.

**Current candidate: 0.1.3 / P4.** P1 is integrated and manually accepted. P2, P3 and P4 are stacked review candidates; local acceptance does not merge them or resolve earlier Game Engine CI failures.

Extract the prepared combined bundle and double-click **Start Axiom.cmd**. It checks dependencies, prepares missing local runtimes and opens the browser. A source checkout uses `Start-Axiom.cmd` with the sibling `AxiomEngine` folder, or an explicit EnginePath. [Startup and P4 acceptance](docs/P4_GUIDE.md).

- [Master plan](docs/MASTER_PLAN.md) and [documentation map](docs/index.md).
- [Roadmap P0–P5](docs/ROADMAP.md) and [current handoff](docs/AI_HANDOFF.md).
- [Architecture](docs/architecture/ARCHITECTURE.md), [ownership](docs/architecture/OWNERSHIP_MATRIX.md) and [compatibility](docs/architecture/RELEASE_AND_COMPATIBILITY.md).
- [P4 evidence and limits](docs/reports/P4_REPORT.md).
- [Axiom Game Engine](https://github.com/Krozzeo/AxiomGameEngine).

Platform owns infrastructure and contracts. Game Engine owns scenes, Unity-compatible scripting, rendering, shaders, physics, audio, animation and export. Its M19–M40 roadmap is unchanged. Exported games do not require Platform.

Development, UI and maintained documentation use English. Historical original-language snapshots are retained as reference, not current instructions. [Contributing](CONTRIBUTING.md).

Run `npm run check` with AXIOM_ENGINE_PATH set for joint tests; `npm run test:browser:p4` checks the Hub with controlled account/picker fixtures. `python scripts/check_docs.py` verifies documentation links and required deliverables.

[MIT](LICENSE). Dependencies retain their licenses. Commercial services and monetization remain undecided.
