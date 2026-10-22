# P1 lifecycle acceptance

This historical phase introduced the first host. For current UI/startup use [P4 guide](P4_GUIDE.md). P1 is integrated and manually accepted; it did not originally include persistent catalogs/accounts or an installer.

With Node 24+, a compatible built Game Engine checkout and its npm dependencies, run from Platform:

```powershell
npm start -- --product "C:\path\AxiomEngine\platform\product.json" --projects-root "C:\path\Axiom Projects" --port 0 --open
```

Keep the console running; the local authenticated URL is session-private. Create a project, edit an entity in the independently opened editor, see Unsaved changes in its Hub row, cancel close, save, close and reopen. Platform checks expected revision; stale operations must reject. Pending code buffers must be saved in the editor or explicitly discarded. Hosted Engine Hub lifecycle controls cannot switch the Platform-owned session.

Product folder leases prevent concurrent new-version native/hosted opening. Normal close releases .axiom-platform-session.lock. After a forced crash, verify all owners are stopped and copy the complete project before manually removing only that stale lease. Do not remove a live lock or use older binaries concurrently. Pending buffer warnings do not silently expire.

Incompatible formats/protocols reject without migration/writes. A timeout/death is uncertainty, never confirmation; inspect saved data before retry. Set AXIOM_ENGINE_PATH and run npm run check plus npm run test:browser. Tests without the variable skip joint integration and do not prove it. Browser fixtures use Null, not GPU. Original P1 limits included max8 processes and bounded256 receipts; persistent catalog/GitHub arrived P2 and AI P3.
