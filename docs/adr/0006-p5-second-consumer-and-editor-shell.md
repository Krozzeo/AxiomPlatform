# ADR-P0006 — P5 Math Lab and shared editor lifecycle

2026-10-21. Accepted scope: the owner explicitly approved a minimal Axiom Math Lab proof of concept together with the pending Hub changes.

Math Lab is an independently versioned second consumer with its own native calculation documents, bounded expression evaluator, manual editing/save/reopen, and AI proposals reviewed by a human before transactional application. No Game Engine imports. Matrices, symbolic algebra, plotting, packages and a full MATLAB replacement are outside this proof of concept.

Platform provides a stable authenticated editor shell for every hosted product, one editor lease per project, visible disconnection/input blocking and reconnection when a session reopens. Products opt into framing only by their explicitly negotiated local host origin; standalone editors retain restrictive frame policies. Browser named windows and Web Locks improve reuse; host leases enforce exclusivity across Hub tabs/browsers. Closing a session releases domain processes/ownership while the editor shell can remain disconnected.

Common AI settings are transport-wide timeout/concurrency/response-size budgets, with recommended defaults. Models, reasoning, domain instructions, task limits and approval remain project/product-specific. Account connection hides credential/test inputs only after a successful response test; refresh does not generate text.

Use modern Windows common Open/Folder/Save dialogs and recoverable Recycle Bin operations, with no permanent-delete fallback. Notification history/toasts are distinct from persistent host/session connectivity banners. Current English documentation and the independent Engine Unity/shader/GPU roadmap remain intact. P4's missing game-export gate is not waived by P5.
