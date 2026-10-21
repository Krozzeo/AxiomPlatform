# Projects, configuration and sessions

Product: specialized application. Project: persistent documents of one product. Workspace: future optional grouping of projects. Session: temporary processes, tasks and connections. The implemented Hub has one project list with live-session state; it does not introduce a multidomain workspace document format.

| Level | Data | Ownership |
| --- | --- | --- |
| Platform | Appearance, sorting, installed versions, default product, storage root and catalog | Local user profile, no credentials |
| Product | Editor shortcuts and domain preferences | productId namespace |
| Project | Native content, repository/branch/publication, AI limits/model, build/template | Product validation and revision/approval rules |
| Session | Active credentials, permissions, processes and tasks | Memory by default; revoke on disconnect/shutdown |

Defaults apply to new configuration and never overwrite explicit project preferences. Existing publication defaults remain intact. A connected account is not permission to publish any project. Combine provider identity, scopes, the project's destination and authorization for the specific effect. No open project means account status alone; active projects also contribute repository status.

Credentials never enter Git, projects, diagnostics or persistent profile data. Persistent secure storage would require a separately implemented opt-in OS facility; it is not implemented. Disconnect invalidates new/stale requests and flags uncertain external writes for reconciliation; it cannot undo remote commits. OPENAI_API_KEY is removed from hosted child environments.

Resolve paths under authorized canonical roots and reject escaping links. Adding outside storage creates a bounded copy and preserves the original. Adding an existing project inside storage registers it in place. Removing a catalog entry changes no files. Permanent deletion is separate: require a closed session, reviewed canonical folder, unchanged fingerprint, short-lived plan and exact typed project name. Never delete the storage root or a folder containing another registered project.

Installation updates retain documents in place and never migrate them implicitly. Incompatible migrations require explicit scope, a recoverable copy and proven restore. Future exchange formats must declare units, axes, handedness, precision/tolerance, provenance, copy versus link and lost constraints; native formats remain independent.
