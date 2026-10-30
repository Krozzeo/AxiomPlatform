# Version-owned demos and project recognition — Platform 0.1.11

## Product demo contract

IPC1 and Platform API0.1 retain their existing required lifecycle. Products may opt into capability `project.demos` and a manifest `demos` array of unique `{id,name}` records, at most32. The installed product's version and immutable build identity determine the catalog. Platform never imports a product factory or infers demos from arbitrary project scripts. Unregistered code cannot become a demo provider.

Platform sends `project.demos` with a fresh empty `destination`, selected declared `demoIds` and a human `operationId`, after initializing the selected installation with the authorized Project Storage root and no shared account services. The adapter returns `{productVersion,projects:[{demoId,path,...}]}` for precisely those IDs. Product identity/version/capability handshake, output boundaries and native `project.detect` validation are checked before one atomic catalog registration. Failed generation removes only its new owned destination. Existing user project files are never replaced.

The first implementation is a new experimental **Game Engine0.0.60 build** declaring only **M20 Object Lifecycle Lab**. Its earlier0.0.60 ZIP and previous releases remain immutable. Numeric version alone does not identify an experimental build: use the new commit/PR label and verify that Load Demos appears. Math Lab demo generation is deferred. Future versions/products explicitly maintain their own catalog and generators; keeping old CLI demo scripts in a repository does not add them to this catalog.

## Hub workflow

1. Install a demo-capable product build. Each installation card has a folder icon and, when declared, **Load Demos**.
2. Click Load Demos. Its spinner remains while the host job runs. Navigation may continue; completion/failure is recorded in persistent notifications and shown as a toast.
3. Generated projects are created under Settings → General → Project Storage and automatically appear in Projects. Their source installation is recorded. Opening one uses that installed build without changing the globally active version. If that build was removed, reinstall it before opening its pinned demo.
4. Repeating Load Demos for the same installed build/storage preserves existing project edits and avoids duplicates, including across restart. A removed list entry can be registered again; a missing saved demo can be regenerated. A corrupt or changed identity produces an explicit error instead of overwriting it. Changed project storage provides a new generation destination; previous projects retain their own authorized storage root.
5. A loading installation cannot be removed until the job finishes. Closing the host stops an unfinished generation; completed projects remain saved.

For M20, select Object Lifecycle Controller, Play and wait at least12 frames: Passed32/Failed0. Stop restores the authored scene. This is the existing M20.2 behavior lab, not new Unity API implementation or complete M20 certification.

## Add project

Local Add project grants read-only detection to installed product adapters, regardless of the current product tab. Exactly one product must recognize the selected folder/file and its declared format. A mixed-product folder asks for the exact project file; unknown/unsupported formats and unavailable adapters produce explicit errors. Sources outside project storage are imported using the detected product's established copy/validation path. Successful local and GitHub adds select the resulting product tab. GitHub project discovery uses installed adapters declaring `project.github.list`, rather than the hidden New project selector. Existing source files remain unchanged.

## Installation completion

While running, downloads show actual progress. Completion replaces the dialog progress bar with **Download and installation completed**. The main Installations completion indicator disappears after approximately6 seconds (next UI refresh); notification history remains. Failed indicators report the error and expire after approximately15 seconds. Closing the dialog does not stop the background installation.

## Acceptance

Contract tests cover real Game/Math detection with incorrect product hints, source preservation, ambiguous/unknown files, folder opening, version-specific generation, installation pinning while another version is active, edited-demo preservation, repeated loads across restart, busy removal, invalid output cleanup and notification persistence. The browser profile covers spinner/navigation, configured storage, automatic tab selection, actual editable M20 C#/Wasm32 checks, completion text and expiring main-list indicators. HTTP/release data are controlled fixtures; no user account or profile is used. Exact-commit CI and published-package verification remain separate delivery gates.
