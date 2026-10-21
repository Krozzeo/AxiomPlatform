# P2 services acceptance in the current Hub

Use [P4 startup](P4_GUIDE.md). P2 is a review candidate over accepted P1. Native folder operation and real GitHub credentials are manual acceptance separate from controlled tests; never send tokens through chat.

1. Add project → From computer. Choose a folder with the folder icon or enter its path. Outside Project storage, import makes a bounded copy; compare source bytes afterward. Inside storage, the catalog registers the existing project. Open from its table row.
2. Settings → General: close sessions, change Project storage, restart Platform and verify the path persists. Returning to the previous root reveals its catalog; no files are moved.
3. Settings → GitHub Account: connect a suitable token in the app. Input clears, repositories refresh and the top icon changes. Account lasts for the host session; restart requires reconnection.
4. Add project → From GitHub: choose repository/branch, Find projects and import a product-validated saved project. When disconnected, only the account message/link is shown.
5. Open two projects and set different destinations/preferences in their Engine GitHub panels. Closing one must leave the other connected and its preferences unchanged. Disconnect affects both.
6. Review saved changes and publish only to an explicitly authorized test repository. If the result is unknown, reconcile; never blind-retry. Divergent remote history must reject without overwrite. TestRepo is testing-only and is not attached automatically to demos.

Configuration/history stay product/project-specific outside source documents. Sharing an account does not authorize publication or game MAIN changes. Profile/project locks are distinct; corrupt configuration remains visible, not reset. Existing native preferences are adopted only for matching identity. For automated regression: npm run check and npm run test:browser:p2 with AXIOM_ENGINE_PATH and Playwright Chromium available through Engine. Controlled HTTP/picker results are not real PAT/native acceptance.
