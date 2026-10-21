> P5 supersedes the project deletion, account feedback and editor-tab behavior described here. Use [the current P5 guide](P5_GUIDE.md).

# P4 — startup, Hub and acceptance

Historical P4 candidate: Platform 0.1.3 / Game Engine 0.0.53 / scripting SDK 8. P1 is integrated; P2/P3/P4 require their own PR checks and acceptance. These instructions describe the current candidate, not a claim that main contains it.

## Start on Windows

1. Extract the complete prepared ZIP to any ordinary writable folder. Keep AxiomPlatform and AxiomEngine together. Projects/profile are separate from program files.
2. Double-click **Start Axiom.cmd** at the bundle root. From a source checkout use AxiomPlatform/Start-Axiom.cmd with the sibling Engine folder. The launcher uses its own location, not a fixed user path.
3. Allow first setup to finish. It uses compatible installed Node 24+ and .NET 10/wasm-tools, or downloads local verified official runtimes, then installs exact npm dependencies. Internet is needed for missing dependencies. Prepared ZIP includes built editor/Wasm, so Rust is unnecessary for ordinary startup.
4. The console prints startup status and the default browser opens automatically. Keep the console open; Ctrl+C stops the host. On error, the console prints diagnostics and waits for a key instead of closing. A source checkout missing built editor needs Rust 1.90/wasm target or the prepared ZIP.
5. Settings/profile normally persist in APPDATA/AxiomPlatform. First project storage defaults to Documents/Axiom Projects. Account credentials do not persist after host shutdown.

Advanced bootstrap flags in scripts/windows/Start-Axiom.ps1: -EnginePath, -SettingsRoot, -CheckOnly (inspect only), -PrepareOnly (dependencies only), -NoBrowser. A clean profile is useful for testing; do not delete a user's existing data or live lock. A ZIP path change registers a new local installation while keeping previous versions available.

## Hub and project management

- New project creates a game and opens its editor automatically. Verify Cube, Directional Light and Camera exist and the camera is configured. Newly created 3D scenes use the same starter preset; user-loaded legacy empty scenes are not silently populated.
- Add project is the only add/open-import entry. From computer accepts a folder/file, with folder icon. Outside storage it copies and preserves source; inside it registers in place. Open a catalog project with its title or Open icon.
- Each row shows product/version/path, last opened and live-session state. Edit icon renames a saved, idle project and preserves identity/content. Save persists a live session; pending code buffers must first be saved in the editor. Close offers Save/Discard/Cancel.
- Remove icon only forgets the list entry, after confirmation. Add can restore it. Delete icon is permanent filesystem deletion: first close the session, inspect the reviewed path/count/size and type the exact current name. Wrong name, changed files or expired review reject; review again. Never use a valuable project for this test.
- Search filters rows; Ctrl+N opens New project; / focuses search; Esc closes dialogs. Accessible icon names/tooltips explain actions.

## Settings and account states

The bottom gear opens a separate page with left navigation. General contains Project storage/default product; folder icon opens native selection, Cancel changes nothing, timeout/error leaves manual entry available. Appearance offers dark/light/system and persists across reload.

Topbar GitHub opens GitHub Account. Slash means disconnected. Green means connected with no active project requiring setup; red means a connected account with at least one active game missing/mismatching its destination. Configure each destination in that game's editor. Import while disconnected shows only a message and Link button to Settings. Connection refreshes repositories automatically; token input clears. Disconnect affects hosted editors.

Topbar AI uses the Engine icon conventions and opens AI Agent. Connect/list/test there or in an editor. Credentials are shared per host session; projects retain their own model/limits/tasks. Test generates a small paid request, model listing does not. Review/Apply and publication permissions remain independent of connection.

## Installations and rollback

Installations → Add installation: choose a trusted prepared product folder containing platform/product.json. Keep versions side by side in separate folders. Incompatible descriptors/entries reject; activation validates the product handshake. Add does not activate automatically. Activate during a live session shows Update scheduled; that session retains its version. Close all of that product's sessions to activate. Open the saved project, confirm identity/content, then Roll back to the retained previous compatible installation and reopen it. Registration does not download product builds or migrate documents.

## Automated regression

From Platform, point AXIOM_ENGINE_PATH to the tested built Engine checkout. Playwright Chromium must be installed through Engine for browser tests.

```powershell
npm run check
npm run test:browser
npm run test:browser:p2
npm run test:browser:p3
npm run test:browser:p4
python scripts/check_docs.py
```

Engine retains npm run check, native checks and its domain/browser suites. P4 fixtures cover controlled GitHub/AI and native cancellation/error results. They do not replace manually choosing a Windows folder, a real provider evaluation, a first-machine runtime download or GPU acceptance. [Report](reports/P4_REPORT.md).
