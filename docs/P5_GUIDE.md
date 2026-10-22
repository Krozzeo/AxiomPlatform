> Historical candidate guide. Use [MVP0.1.5 guide](MVP_GUIDE.md) and [closure ADR](adr/0007-mvp-closure.md) for the current account/model workflow and export ownership.

# P5 — Math Lab and Hub acceptance

Candidate: Platform0.1.4, Game Engine0.0.54 / scripting SDK8, Math Lab0.1.0. IPC1 and both native format versions remain1. These are review branches, not a claim of integration into main. [Scope ADR](adr/0006-p5-second-consumer-and-editor-shell.md), [report](reports/P5_REPORT.md).

## Start

Extract the entire prepared ZIP anywhere writable; keep AxiomPlatform, AxiomEngine and AxiomMathLab together. Double-click **Start Axiom.cmd**. The launcher checks/installs locked dependencies, prepares missing official Node24/.NET10 runtimes as needed and opens your default browser. The editor is already built, so ordinary startup needs no Rust. Keep the console open; startup errors remain visible. Close older Platform consoles first to release the profile lock. Existing profile/catalog files are preserved; this is not a reset.

For a clean isolated test profile, from the extracted root use `powershell -NoProfile -ExecutionPolicy Bypass -File .\AxiomPlatform\scripts\windows\Start-Axiom.ps1 -SettingsRoot "$PWD\Test Profile"`. Existing products/projects keep their own native formats. Credentials stay in host memory and must reconnect after shutdown.

## Hub / sessions

1. Create a Game Engine project: its scene must contain Cube, Directional Light and Camera. Create a Math Lab project: three real calculation cells appear.
2. Single click a project row selects it; double click opens. Active sessions have a subtle background/dot; selected rows are stronger. The folder icon opens its project directory in Explorer.
3. Click Open twice, including rapid clicks: only one editor window for the same project. Another manual duplicate tab must block product interaction. Two different projects can run simultaneously.
4. Close a session (Save/Discard/Cancel). Cancel preserves the active editor. Once closed, its existing editor tab shows disconnection and blocks pointer/keyboard input. Open it again from Hub: the same tab reconnects to the new session and saved content. Polling can take a few seconds. A full host restart changes its authentication/origin; open again from the new Hub.
5. Add project offers modern folder and file pickers; General/storage and Installations use the same modern Windows common dialog. Cancel/timeout leave inputs unchanged and controls usable. Outside storage, import copies and preserves originals.
6. Remove only forgets a closed project. Delete first reviews its canonical folder/count/size and asks Cancel/Confirm; Confirm moves it to the Recycle Bin. There is no permanent-delete fallback or typed-name requirement. Changed files, nested projects, links, root deletion or expired plans still reject.

## Accounts and notifications

GitHub and AI icons navigate to their Settings sections. AI is icon-only; the extra gear also opens Settings. Connect/test AI once: after a successful completed response, key inputs/test button disappear; connected summary, refresh and disconnect remain. Refresh lists models without text generation. Disconnect restores the form. Keys are never saved in projects. Connection testing and real generation can be billable.

Global AI transport defaults:120-second request timeout,4 concurrent requests,2MiB response budget. Supported ranges15–300 seconds,1–8 requests,256KiB–2MiB. Project model, domain instructions, proposal approval and task limits remain product/project owned.

Action notices/errors use bottom-right six-second stacked toasts, newest at bottom. Hover marks a toast read; expiration alone does not. The bell before GitHub opens persisted All/Unread history and marks it read. Badge shows the unread count or `+9` for10+. Notifications arriving while history is open are marked read. Auth/connectivity failures stay in a global banner across routes until recovery; ordinary action messages do not.

## Math Lab

New project → Axiom Math Lab. Edit `radius = 3` to `radius = 4`, leave the field, inspect the area and Save. Add/remove cells; invalid user expressions show errors without running code. Save/close/reopen retains the native document and project model. Supported arithmetic, constants and real functions are listed in the editor; there is no symbolic algebra/matrix/plot subsystem.

Connect AI in Platform, enter a model available to your account in Math Lab and save that project preference. Ask it to add circumference. Prepare proposal must leave MAIN unchanged. Inspect the diff, Review changes, then Apply reviewed proposal: only this human action persists the accepted cells. Discard/Cancel must preserve MAIN. Invalid/stale AI results reject; write failure retains the document/proposal. Export uses the modern Save dialog. Cancel creates no file; exported native documents can be added from the Hub file picker.

## Repeat automated acceptance

Set AXIOM_ENGINE_PATH and AXIOM_MATH_PATH to absolute product folders. Install Chromium from Engine with `npx playwright install chromium`; if PLAYWRIGHT_BROWSERS_PATH is set, use the same value for installation and tests. Platform: `npm run check`, `npm run test:browser`, then `test:browser:p2`, `test:browser:p3`, `test:browser:p4`, `test:browser:p5`. Math Lab: `npm ci` then `npm run check`. Engine: `npm run check` requires the Rust/.NET source toolchain.

`AXIOM_TEST_NATIVE_RECYCLE=1` opts into the Windows test that creates and recycles only its own disposable temporary folder. Other deletion tests inject a controlled recycle service. Never empty the user's Recycle Bin during acceptance.

Controlled provider/GitHub and Null tests do not establish live-account/model/GPU quality. Native interactive Open/Save selection and fresh-machine runtime downloads remain manual acceptance. P4's standalone exported-game gate stays open because the Engine still lacks that pipeline; P5 does not waive it. Unity/shader/GPU M19–M40 is unchanged.
