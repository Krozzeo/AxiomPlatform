# Platform 0.1.9 — providers, accounts and installations

This owner-requested maintenance release preserves IPC1, Platform API0.1, product-owned documents and human review/Apply. It does not advance Game Engine's Unity/shader/GPU milestones.

## AI provider connection

Open Settings → AI Agent. Provider is the first section. Choose OpenAI, Anthropic, Google or Local. Each provider keeps its own account and model configuration; local server tokens are also isolated by endpoint/backend. Changing provider cancels pending requests through the existing account epoch. A project with an explicit model override keeps that override when the Hub provider changes; select Same as Hub in the editor to inherit the new provider model. Platform does not silently translate model IDs between providers. Account keys stay in the host; products receive an authorized service handle.

OpenAI previously tested connection by generating text with a fixed `gpt-4.1-nano` model. A model404 therefore prevented connecting a valid key. Connect now authenticates through model discovery without generating text. A403 from a restricted model-list permission can fall back to a small generation using the explicitly selected model, which can bill. A404 or403 on generation is a model/endpoint/permission error; it does not invalidate a proven account key. A401 invalidates the live connection. Model selection and Test selected model remain independent of connection. Available IDs are discovered from the provider; custom IDs can also be entered. Refreshing discovery never overwrites an explicitly configured model merely because it is absent from the returned list. A listed ID is not proof of support for every endpoint, image input or tool.

| Provider | Transport | Provider-specific configuration |
| --- | --- | --- |
| OpenAI | Models and Responses, fixed official host | API key, model and supported Reasoning Effort |
| Anthropic | Models and Messages, fixed official host | API key, model, opt-in adaptive/token-budget thinking and native effort |
| Google | Gemini Models and generateContent, fixed official host | API key, model, opt-in thinking budget or thinking level |
| Local | Ollama native API or loopback OpenAI-compatible Chat Completions | Server URL, optional server token, model and temperature; Ollama context length, CPU threads, GPU layers and keep-alive |

For Local, start Ollama or LM Studio (or a compatible server) and load/download your chosen model in that runtime first. Select the matching backend and loopback URL, then Connect local server, refresh models and test the selection. Typical server defaults are Ollama `http://127.0.0.1:11434` and LM Studio `http://127.0.0.1:1234`. Platform does not silently install model runtimes or download large weights. GPU/context limits are model/runtime/hardware dependent; the local runtime owns execution.

Adapters convert real tool calls, tool results, text/image input and usage into the existing stateless contract. Gemini tool signatures and Anthropic thinking blocks/signatures survive the next tool turn. Unknown token usage remains unknown; product budget enforcement can stop a task rather than invent a token total. Unsupported model options return an actionable error. A model without tools or vision cannot acquire those abilities through Platform. No claim of universal model capability or real-provider output quality is made; testing those capabilities uses the account/model configured in the app. Never send account keys in chat.

## Remembering accounts

On Windows, successful GitHub/AI connections are saved to the local profile as a DPAPI CurrentUser encrypted blob (`accounts.encrypted.json`). Default profiles are under `%APPDATA%\AxiomPlatform`. Readable settings, project files, product processes, update requests and diagnostics do not receive the tokens. The encrypted data is bound to the Windows user; copying the ZIP or profile to a different user/computer does not transfer a usable account connection. Explicit Disconnect forgets the relevant saved credential. Closing Platform keeps it. Startup revalidates saved accounts without a generation probe.

There is no plaintext fallback. If Windows encryption/unlock fails, the app reports the storage limitation instead of writing clear keys. Other operating systems currently disclose session-only account storage; a native secure-store implementation is required before promising persistence there. Local runtime configuration is persisted without requiring a token. Encryption protects storage, not a compromised process running as the same Windows user.

## Project and installation refresh

Projects have All/product tabs. New project asks for Product only in All; a product tab supplies that product. Missing project files stay listed with a missing status so the user can restore them or remove the catalog entry. Refresh does not delete project files.

Installations shows physically registered versions, with independent Stable/Experimental and Installed/Active/Scheduled states. Local folders without publication provenance are not certified stable merely because the version number matches. Refresh rechecks descriptors, adapters and startup/dependencies; completely missing unused versions are removed from the registry. A running installation remains protected until its sessions close. Add installation's refresh performs the same physical reconciliation before checking published versions, so manually removed versions become installable again. Partial/changed folders are marked unavailable; remove or repair their remaining files before reinstalling.

The publication picker sorts by newest publication date, then version as a fallback. Closed/merged-PR experimental publications stop being offered after a successful check; installed experimental packages remain available locally until removed. Offline/rate-limited discovery preserves the last usable catalog with an explicit check error.

## Persistent version inbox

Installed releases appear gray; available releases use normal text; unread compatible/uninstalled releases appear bold. Hover or keyboard focus marks an unread release read, whether or not it is installed. Read identities are persisted per repository and immutable release ID. First discovery treats previously unknown, uninstalled releases as new. Previously installed versions are remembered as read, including when an older registry is migrated or their folders are removed manually. Refresh/restart does not repeatedly flag a read version. The sidebar badge counts all unread product releases; product tabs count their own unread releases; All has no tab badge. Add installation counts unread releases for the selected product or all products in All. Platform's own newer-version banner remains separate.

## Download and installation jobs

Download and install starts a host-owned job and returns immediately. The dialog may close and Hub navigation may continue. Progress combines actual received byte counts, verified-size/hash stages and extracted-file counts; phase percentages are not a predicted remaining time. Download percent is also shown separately. A bounded transport deadline and checksum/size/path checks remain enforced. The adapter handshakes before the prepared folder is registered.

Activate after installation is checked by default, including experimental versions, and can be disabled. Active product sessions schedule activation until they close. Existing installations and projects remain available. Completion/failure creates a persistent notification and toast. Click outside notification history to close it. Jobs are limited to two concurrent downloads. Closing the host aborts unfinished downloads and cleans validated staging folders; resumable downloads across process shutdown are not implemented.

## Validation and practical limits

`npm run check` covers host contracts, provider conversions, account authorization, Windows encryption, missing-file reconciliation, read persistence and background progress. Set both `AXIOM_ENGINE_PATH` and `AXIOM_MATH_PATH` for joint tests. `npm run test:browser:providers` exercises all four controlled provider transports, an independent OpenAI model404, local controls, project tabs, version styles/read counts, navigation during a streamed download, scheduled activation and completion toasts with a real Math product process. Existing MVP, product, installation and P1–P5 profiles remain regression gates.

Controlled HTTP providers and test credentials verify integration behavior, not live account permissions, paid model quality or local hardware throughput. Windows DPAPI is exercised with disposable sentinel secrets. Historical evidence is retained; exact source CI and the prepared public package are independent publication gates. SDK consumers must pin the published provider revision before relying on new model-ID validation (including IDs with slashes).

Primary contracts consulted: [OpenAI model listing](https://developers.openai.com/api/reference/resources/models/methods/list), [Anthropic tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview), [Gemini function calls](https://ai.google.dev/gemini-api/docs/function-calling), [Ollama tools](https://docs.ollama.com/capabilities/tool-calling), [LM Studio compatibility](https://lmstudio.ai/docs/developer/openai-compat) and [Windows data protection](https://learn.microsoft.com/en-us/dotnet/api/system.security.cryptography.protecteddata).
