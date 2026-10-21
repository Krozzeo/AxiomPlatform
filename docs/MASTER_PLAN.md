# Axiom Platform — master plan

Updated 2026-10-21. Canonical name: **Axiom**. Public MIT repositories: AxiomPlatform and AxiomGameEngine. P0/P1 are integrated; P2/P3/P4 are review candidates. Commercial decisions remain deferred.

## Purpose

Build a family of specialized local applications for games and engineering. People use full manual browser interfaces; AI agents use validated semantic domain operations. Platform supplies the shared environment and services. Game Engine is the first real consumer. A parametric CAD, mathematical environment and animation application are possibilities, with no approved full product scope or delivery date.

A person opens Platform, creates/adds a project, opens the compatible product, edits manually, optionally requests an isolated AI proposal, reviews evidence and applies it without overwriting concurrent work. Session accounts are shared while repository, publication and AI preferences remain project-specific. Incompatibility is diagnosed before writes. Exported games run without the development environment.

## Accepted decisions

1. Two repositories initially; no repository per helper library. Both are MIT by the owner's later instruction, superseding the initial no-license proposal. Preserve third-party notices and historical releases.
2. Platform owns the Hub, shared services and integration SDK; specialized domains remain in products. No universal renderer, geometry kernel or scene format is assumed.
3. Independently versioned products. Platform is the ordinary entry point; direct product startup remains available for development and automation. Exported runtimes remain independent.
4. Extract gradually behind public ports/adapters. No stack rewrite, permanent source copies, submodules or simultaneous-only merges as the integration mechanism.
5. Separate Platform, product, project and session configuration. Credentials stay outside projects and repositories; current credentials live in memory.
6. Shared AI provides transport, turn execution, cancellation, usage, tool validation and review gates. Domain tools, context, PMD content, acceptance and transactional application remain product-owned.
7. Native formats remain specialized, with explicit exchange contracts. A CAD does not become a Game Engine entity graph by default.
8. Official integrations first. Marketplace, third-party extensions, real-time collaboration, private cloud and cross-product automation are future scope.
9. Updates do not interrupt active tasks. Declare compatibility, retain the prior installation and require recoverable copies and consent for incompatible data migrations.
10. MIT is the current licensing decision; it does not decide future support or monetization.

## Current vertical slices

P1: descriptor/IPC host, real product lifecycle and direct startup. P2: persistent catalog/preferences, authorized storage/import and shared GitHub account/transport. P3: shared AI/runtime/usage/tool/review contracts, with product application and recovery. P4: unified project/session Hub, separate Settings, reusable UI primitives, relocatable Windows launcher, installation registration/deferred activation/rollback, guarded rename/removal/deletion and seeded Game Engine projects. See [P4](P4_GUIDE.md) and [roadmap](ROADMAP.md).

This is a prepared local distribution, not a signed online product marketplace or automatic Internet updater. P5 validates the contracts through the owner-approved minimal Axiom Math Lab. Calculation documents, a bounded evaluator and reviewed AI proposals are independent of Game Engine. See [P5 scope](adr/0006-p5-second-consumer-and-editor-shell.md).

## Product roadmap remains independent

Game Engine retains the functional implementation of the selected Unity API, graphics shaders, compute and GPU physics in M19–M40. Platform restructuring earns no Unity/API/performance coverage. M19 can advance without waiting for P5 if no technical dependency exists. Complete runtime/editor inventory, audited denominators and measured priorities remain M19 work.

## Baseline and evidence

P0 inspected Engine `871a72f6d2c720e99e0a8d1598c0f35af69c4d78`. The consolidation candidate passed CI 329, but a later run of that base failed M17 (44/46), recorded in Engine #51. P1 subsequently integrated after CI and user acceptance. P2/P3 are not integrated by starting P4. Inspector #47, M17 #51, drag cleanup #55, dense physics performance, real-account/native-dialog acceptance and real-model quality/cost must retain separate evidence. [Current handoff](AI_HANDOFF.md).

Browser/daemon Node, Rust/Wasm, WebGPU/Null and C# remain the stack. The Rust daemon has a narrower scope than the production Node daemon; this separation does not silently replace it. Never describe a historical green run as acceptance of a later commit.
