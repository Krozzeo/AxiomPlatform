# Optional product editor presentation — 0.1.13

The active product iframe may brand its containing browser tab with public display metadata. Platform owns the tab and session lease. Products own the public logo and display name. Older products/hosts remain compatible with a generic tab; IPC1/API0.1/native formats do not change.

On an active iframe load the shell sends `{kind:"axiom.platform.presentation.request",nonce}` to that exact iframe origin. The product replies to the requesting parent origin with `{kind:"axiom.platform.presentation",nonce,title,iconPng}`. Never include a token, path, geometry or document metadata. The challenge is fresh for every load and invalidated when the shell blocks/disconnects. Only the current iframe WindowProxy and origin are accepted.

The title is nonempty text up to128 characters without controls. Icons are PNG data URLs up to16384 characters, with PNG signature/IHDR and positive dimensions no larger than128x128. SVG/HTML/network URLs and unknown fields are refused. The browser decodes the image as an image; no script interpretation. CSP permits data images only; scripts, connections, frame isolation and credentials are unchanged. Invalid input preserves the last valid presentation. Blocking a lease removes product branding.

Local acceptance:89 contract tests (73 pass,16 optional product/native fixture skips), no failures; real Engineer browser branding, foreign/stale/invalid image rejection and simulated connection-loss/recovery passed. Reproduce with `AXIOM_ENGINEER_PATH` and optional `AXIOM_CHROME` using `node tests/browser-editor-presentation.mjs`. [Joint result](reports/PLATFORM_0_1_13_PRESENTATION.json). Exact-head CI/public artifacts remain delivery gates.

Validation: input/size/dimension/stale challenge unit cases and real Engineer CAD joint browser acceptance. This bridge grants presentation only and must never become an authorization or navigation channel.
