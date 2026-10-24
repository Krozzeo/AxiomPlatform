# Platform0.1.8 — Experimental installations and update sources

## From the Hub

Open **Installations**. Only installed versions appear. **All** shows every product; product tabs filter the installed list and the available-version selector. Click **Add installation**: the release list refreshes automatically. The refresh icon repeats the check. Published versions show **Installed**, **Active** and **Experimental** as appropriate. An experimental build includes its PR and exact commit, so revisions with the same numeric version remain separate.

Select a compatible version and choose **Download and install**. Checksums, descriptor/provenance and the adapter handshake are checked. Experimental downloads retain the selected stable installation; click **Activate** explicitly to test one. If a product session is open, activation is scheduled until it closes. Installed versions coexist, and rollback remains available. Stable publication and an experimental build are distinct channels; discovery never installs anything by itself.

The trash icon beside each installed version opens a confirmation. Confirming moves only that installation folder to the Recycle Bin and removes its registration. Projects and their catalog entries remain. Close sessions using that installation first. Protected storage, registered neighboring installations/projects and project documents inside the folder prevent removal. No permanent-delete fallback is used. Removing an active installation leaves that product unavailable until another version is activated; no project migration or deletion is implied.

## Configurable sources

**Settings → General → Updates** lists Platform, Game Engine and Math Lab repository addresses. Changes save automatically, survive restart, and clear the previous catalog before the next check. **Restore default sources** restores Krozzeo/AxiomPlatform, Krozzeo/AxiomGameEngine and Krozzeo/AxiomMathLab. Accept either an HTTPS github.com repository URL or its api.github.com releases URL. The implementation currently supports public GitHub repositories, not arbitrary download servers or private-account credentials. Package metadata must still identify the correct product and API version. Choose only sources you trust: a prepared product executes locally after you request its installation.

The catalog follows release pages (up to1,000 publications with an explicit limit notice), ignores drafts/source-only recovery tags, and distinguishes published stable vX.Y.Z releases from immutable experimental-pr-PR-SHA prereleases. A branch alone is not an installable package. Network failures retain the current source's cached results and existing installations; a source change does not reuse another repository's cache. Platform's self-update banner tracks stable releases; updating Platform itself remains an explicit download/restart.

## Publishing

After accepted CI on an open, same-repository PR, the workflow builds an experimental package from that exact commit. The package and manifest retain numeric product version, channel, full commit, branch, PR and acceptance run. Windows x64 is the current prepared platform. Future ordinary candidates become visible without changing Platform or editing a game project. Fork PRs and obsolete PR heads do not publish. Publication is separate from merging: testing an experimental build grants no main approval.

A successful main CI publishes a new stable numeric version, without overwriting prior releases. The workflow must first exist on the default branch for workflow_run events to fire. The initial workflow-enabled candidate may be bootstrapped with a matching experimental tag only after its exact CI passed. Build and publish jobs are separated; candidate code does not receive a release-write token. Pinned tooling validates upload bytes/provenance. Publication stays draft until all assets exist, then becomes visible to the Hub. Preserve recovery refs and old artifacts.

## Delivery shortcut and validation

Extract the whole prepared delivery, then double-click **Axiom Hub**. Its Axiom icon and launcher resolve within that folder. **Start Axiom.cmd** remains available. Keep the startup console open; its errors remain visible. Neither shortcut creation nor release discovery connects accounts or changes projects.

`npm run check` covers source settings, release provenance, installation transactions and protected/reviewed removal. `npm run test:browser:installations` exercises the actual Hub with a real Engine project plus controlled release fixtures. The Windows shortcut test executes only a disposable script. Public release discovery/download acceptance is recorded separately from controlled fixtures and from main merge.
