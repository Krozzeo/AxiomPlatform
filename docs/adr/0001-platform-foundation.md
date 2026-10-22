# ADR-P0001 — Axiom Platform foundation

2026-10-21. Accepted by owner for planning; subsequently implemented in staged P1–P4 candidates.

The existing Engine mixes shared infrastructure and game behavior. The owner approved a family of local browser applications with full manual operation and semantic AI tools, separated gradually into two repositories.

Choose Axiom Platform for Hub/services/SDK and Axiom Game Engine for its domain/adapter. Keep independent versions, direct technical startup, standalone exported games, layered configuration, session credentials, explicit effect scope and specialized formats. Use P0–P5 for extraction while retaining Engine M19–M40. The later owner instruction adopts MIT for both and renames AxiomEngine to AxiomGameEngine; this supersedes no-license/earlier licensing proposals without rewriting old releases/notices. Commercial decisions remain deferred.

Alternatives considered: one monorepo, product forks/copies, a universal kernel before consumers, immediate full extraction or repository-per-library. Two repos and contracts minimize speculative coupling and enable gradual review at the cost of compatibility/joint tests. Platform cannot import game classes. P0 did not rewrite daemons or formats.

Deferred: commercial model/support (owner); exact SDK/IPC (P1, now implemented); secure persistent credentials (requires separate opt-in OS facility, current memory-only); packaging/integrity/updates (P4); small second consumer (scope before P5); third-party marketplace/cloud (new scope). Explicitly deferred decisions do not fabricate implemented capabilities.
