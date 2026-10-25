# Current extension — Platform 0.1.9

[Provider/account/background-installation guide](PROVIDERS_AND_INSTALLATION_JOBS.md) supersedes the historical session-only account policy and explicit-only experimental activation default below. Installation jobs now offer automatic activation/scheduling (checked by default), which the user can disable. Stable/experimental publications remain separately identified and verified. Version inbox reads are persistent and repository-scoped; missing files reconcile before refresh. Closed/merged-PR candidates stop being offered, while already installed packages remain usable until explicitly removed. Newest publication time orders the picker.

Earlier contract snapshots follow for provenance.

---

# Current release channel extension — Platform0.1.8

[Experimental installation/source guide](EXPERIMENTAL_INSTALLATIONS.md) supersedes earlier stable-only catalog statements below. Experimental identity includes the complete commit, independent of numeric version. Removing an installation preserves projects and uses reviewed native recycling. Sources are configurable per product in persistent General settings. Protocol/API and existing stable manifests remain compatible.

---

# Product releases, accounts and diagnostics — Platform0.1.7

Owner-approved post-MVP maintenance/expansion, 2026-10-22. P0–P5 remain closed. Game Engine0.0.56 is the reference consumer; the native game document format remains1 and scripting SDK remains8.

## Authority and settings

Platform alone connects, verifies and disconnects OpenAI/GitHub accounts. Product IPC cannot supply credentials or change the account. Product process environments strip the standard OpenAI/GitHub/Hub token variables (case-insensitively); GitHub transport also validates its fixed request origin before attaching a credential. Project repository/branch/publication preferences and AI model/reasoning overrides stay in the owning project. Empty model and reasoning `platform` mean **Same as Hub**. Effective values are visible; unsupported reasoning on a different model falls back to provider default. Project task budgets, domain instructions and approval rules remain product-owned. Shared transport limits are enforced by Platform; they are not silently converted into project budgets.

An inherited account is ready as soon as the Hub has verified it. A project model test is a separate optional billable request, never a second login. Account changes invalidate ongoing requests through the existing epoch/cancellation contract; each task captures its effective model/reasoning at creation. Products receive account state and a session capability, never the credential. Standalone Engine authoring is retained; account operations require opening through Platform. Raw product HTTP connect/disconnect routes are refused.

## Discovery and trust

The official sources are public Krozzeo/AxiomPlatform, Krozzeo/AxiomGameEngine and Krozzeo/AxiomMathLab. No account token is required or forwarded for update checks. CLI startup checks in the background; periodic checks run every30 minutes, with a10-minute in-memory cache and manual refresh. Installed versions remain usable if discovery is offline or rate limited. Invalid release manifests are reported rather than executed. Only stable `vMAJOR.MINOR.PATCH` releases with `axiom-release.json` are offered. Source tags, old source-only releases and prereleases are not prepared installations.

The manifest schema is1: productId, version, platformApiRange and artifacts. Each artifact declares platform (`win32`, `linux`, `darwin`), architecture (`x64`, `arm64`), ZIP asset name, exact bytes and SHA256. Product/manifest/tag/repository/asset ownership must agree. Platform API0.1/protocol1 is currently supported. No compatible artifact means unavailable on this machine, not silently installable. Current automated prepared publishing targets Windows x64 only.

`Installations` displays a red count per installed product when a newer compatible published or locally registered version is available than its active version. A scheduled activation remains pending until sessions close; already installed versions can be activated without another download. Uninstalled products appear in the catalog but do not count as pending updates. **Add installation** lists published versions and also accepts a prepared local folder. Platform's own update appears in a separate persistent banner linked to its release/download page; self replacement is manual.

## Installation transaction

Project storage and product storage persist separately in the local profile. Changing either default does not move existing files. Registered projects retain their original storage grant and remain visible/openable; arbitrary unregistered locations remain denied. Project deletion rechecks registered neighbors, all storage roots and installation locations even after review, and refuses to recycle protected content. Default product storage is the profile's `products` directory. Installations are named by product/version; existing version folders are never overwritten. Download bytes/hash are verified, ZIP entries are validated before writes, and extraction uses a new staging directory. Traversal, Windows reserved paths/streams, links, duplicate case paths, corruption and resource-limit violations are rejected. Product descriptor and adapter handshake must match before activation. A failed probe cannot replace the active product; retained candidate files allow diagnosis.

An open product keeps its running installation. Activation waits until its sessions close; the previous version is retained for explicit rollback. Startup registration of a bundled older installation never overrides a saved selection. Existing project format validation refuses unknown formats without writing; no new document migration is introduced in0.0.56. A format-changing future release requires a separate reviewed migration/backup contract before it can be accepted. Installation is explicitly requested by the user; discovery never installs or runs a downloaded product automatically.

## Publishing and reproducibility

`scripts/prepare-release.mjs <product-root> <output>` builds a prepared ZIP from tracked sources plus the product's locked installed dependencies and built editor. Runtime sources and distributable assets are included; Git metadata, user projects, profile credentials and caches are excluded. Package/product versions must agree. The release workflow verifies the exact package/tag, runs checks and publishes ZIP plus `axiom-release.json`. Engine CI must build the Wasm editor before packaging. Publish immutable new versions; never replace previous recovery tags/assets. A package existing locally is distinct from a completed GitHub release. A new source revision alone is not an update until its prepared release succeeds.

## Diagnostics and verification

Settings → General exports a native Save dialog report through the existing download service. The authenticated report contains host/runtime versions, OS/architecture, installation availability, active/pending state, session state and account connection booleans. It omits credentials, authenticated URLs, project contents, project identities and private file paths. Product domain errors remain in their own diagnostic tools; this report is not a full log dump.

`tests/product-authority.test.mjs` exercises two real Engine processes, inheritance/overrides, project testing, account mutation denial and reopen. `tests/releases.test.mjs` verifies bounded official discovery, caching/offline behavior, checksums, extraction and persistent installation. `tests/browser-products.mjs` covers Hub badges/banner/settings, real Engine account UI, deferred activation and rollback with a controlled future release. Fixtures do not certify live account quality, physical GPU behavior or an unpublished GitHub release. Run it with AXIOM_ENGINE_PATH and the Engine Playwright browser path.

References: [GitHub releases API](https://docs.github.com/en/rest/releases/releases), [OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning), [MVP scope](MVP_CLOSURE.md).
