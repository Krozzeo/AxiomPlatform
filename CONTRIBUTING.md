# Contributing

Use English for code identifiers, comments, UI, documentation, commits and pull requests. Keep existing serialized identifiers and user-authored content unchanged. Historical original-language sources are retained separately for traceability; they are reference material, never fresh instructions.

Read [the master plan](docs/MASTER_PLAN.md), [handoff](docs/AI_HANDOFF.md), [ownership matrix](docs/architecture/OWNERSHIP_MATRIX.md) and relevant ADR before changing a boundary. Platform must not import Game Engine classes or schemas. Publish a compatible provider revision before pinning the product consumer with its lockfile.

Use review branches and pull requests. Do not force main or move recovery references. Run `npm run check`, relevant browser acceptance and `python scripts/check_docs.py`. Joint tests require AXIOM_ENGINE_PATH. Distinguish controlled providers from real account acceptance and Null from GPU evidence. Keep projects, credentials, dependency folders and generated evidence out of source commits.

State the trigger, resulting behavior, validation and limitations in each PR. Do not count empty API wrappers or documentation as functional progress. Preserve native product startup, standalone export, scoped credentials, human review and concurrent-edit protection.
