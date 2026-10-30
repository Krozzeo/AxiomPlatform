# Platform 0.1.10 — published-version discovery

## Behavior

Add installation shows all validated prepared publications for the selected product (all products in All), with Stable/Experimental and Installed/Active labels. Closed or merged PR candidates are omitted after a successful check. A real successful check returning no prepared publications displays **No published versions available**. Missing metadata or invalid packages produce an explicit validation warning rather than asserting that the repository is empty.

Query states are separate: unchecked, checking, ready, successful empty, failed without cache, and failed with saved versions. The dialog and Installations page explain network errors, GitHub HTTP401 credentials, HTTP403 permissions, HTTP403/429 rate limits, HTTP404 source errors, HTTP5xx service errors, malformed responses and package validation issues. The error is scoped to the product tab; All aggregates product failures. The independent Platform update source does not empty a product list. Saved versions remain selectable during a failed query and are described as potentially out of date. Package size/SHA256, path, provenance and adapter validation remain mandatory during installation.

## Cache and query policy

The profile stores `release-catalog.json` beside platform settings: no account token is serialized. A bounded8MiB cache restores validated metadata only for matching configured product/repository identities. Changing source URLs cannot import entries from the old repository. Malformed/unsafe cache entries are ignored with a recovery warning, without preventing Hub startup. Cache writes are atomic; a write failure is reported separately from discovery. A successful source check replaces its saved catalog, including a genuinely empty list. Transport failure retains that source's last complete catalog.

Opening Add installation reuses successful checks younger than10 minutes, rather than forcing remote requests on every open. The refresh icon explicitly rechecks the physical installation registry and asks GitHub for an update. In-process conditional requests reuse HTTP304 metadata; unchanged release-manifest asset identities reuse already validated manifests across restarts. Checks are serialized per catalog, coalesce overlapping requests and share a GitHub rate-limit cooldown across products. Retry-After/reset is respected, including after restart; other query failures use a60-second cooldown. The UI shows the retry time. A newly connected/different credential can leave the prior credential's cooldown.

After saved-account restoration, GitHub API queries can use the connected account. Authentication is attached only to `https://api.github.com` requests; API redirects are rejected. Download URLs do not receive the account token. There is no requirement to connect an account to browse public releases. This reduces quota pressure without embedding a token in the app or increasing token permissions. GitHub still imposes quotas; refresh cannot override a server cooldown.

## Manual acceptance

1. Start Hub online, open Add installation and confirm versions. Reopen the dialog shortly afterwards: the recent catalog remains available without repeating the full remote check.
2. Close Hub, disconnect the network, restart with the same profile and refresh. Saved versions remain listed; the dialog identifies a failed query and use of cached data.
3. With a fresh profile and unavailable network, expect **Version check failed**, not **No published versions available**. Restore connectivity and retry after the displayed cooldown.
4. A rate-limit error displays GitHub's retry time. Repeated refresh/open operations do not repeatedly consume the same exhausted quota. Connect an eligible account to use its authenticated quota.
5. Test a valid empty repository separately: after a successful check the empty-publication message is appropriate. Change source URLs back to the defaults afterwards.
6. Install a version from the retained list: download integrity and compatibility are checked as usual. Installed projects remain independent of release discovery.

Automated acceptance covers persistent restart/offline recovery, honest empty/error states, rate-limit headers/backoff, conditional metadata, changed manifests, token boundaries, source-bound cache validation, real browser dialog states and the existing product/installation regressions. Tests use disposable profiles and controlled HTTP, not user credentials or a forced real quota exhaustion. Executable signing remains intentionally unchanged.
