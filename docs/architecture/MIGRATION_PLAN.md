# Gradual extraction and recovery

P0 inspected Engine `871a72f6d2c720e99e0a8d1598c0f35af69c4d78`, with recovery/pre-restructure-stable-2026-10-20 retained. The AxiomGameEngine rename preserves commits, tags, issues and recovery. Do not rewrite historical evidence or move protected references.

For each batch, record exact revisions, choose a concrete ownership boundary, inventory imports/state/effects, define public ports/adapters, add contract and real consumer tests, publish a compatible provider first, pin it in the product lockfile, run joint regression, review and integrate through PR. Retire duplicate source only when the consumer is proven. Two repositories have no atomic Git transaction: never require simultaneous merges to obtain a usable system.

P1 demonstrates lifecycle without document migration. P2 extracts storage/catalog/OS/GitHub infrastructure while product bundles and validation stay local. P3 extracts generic AI/review, retaining domain tools and Apply. P4 introduces verified presentation primitives and prepared distribution. P5 tests a small second-domain consumer.

Before a batch retain test project copies, versions/SHAs and open/save evidence. If a gate fails, keep the candidate unmerged or disable the new path, restore the previous pinned version and reopen intact saved data. An incompatible data migration needs a recoverable copy or proven inverse migration; do not open newer documents blindly with older binaries. Reconcile remote publications separately.

P0/P1 are integrated. P2/P3/P4 are stacked candidates; earlier CI failures remain tracked independently. Platform phases do not renumber Engine M19–M40 or credit Unity/shader/GPU coverage. Engine M19 need not wait for P5 unless a technical dependency is demonstrated.
