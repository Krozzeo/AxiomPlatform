# ADR0008 — Optional public product tab presentation

Status: implemented experimental extension for owner-requested hosted CAD favicon.

An iframe favicon cannot brand its parent browser tab. Keep Platform ownership of the editor lease/tab and accept only public presentation metadata via an optional bounded message, detailed in [contract](../EDITOR_PRESENTATION.md). A per-load challenge supplements current frame/source/origin checks; reset on disconnect. PNG-only data images avoid remote fetches and SVG script surfaces. No product domain types or native/API changes enter Platform. Existing products continue without the extension. No main merge or stable release implied.
