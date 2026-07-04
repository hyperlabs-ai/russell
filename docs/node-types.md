# Russell 1.0 — Node Type Catalog

A node `type` is a contract: each runtime implements the catalog with identical semantics. Two kinds exist:

- **`deterministic`** — pure code, no LLM. Fast, cheap, exactly testable. This is where guards, state machines, and side effects live.
- **`llm`** — invokes a model. Accepts `prompt`, `llm` params, and `compose` (persona/context injection).

The machine-readable catalog (including each type's `params_schema`) is [`packages/schema/schemas/node-types.json`](../packages/schema/schemas/node-types.json). Run `russell node-types` to list it from the CLI.

## Catalog v1.0

### Pipeline / hygiene

| Type | Kind | Purpose |
|---|---|---|
| `input_guard` | deterministic | Pre-classification input defense: rejects empty messages, truncates oversized input (`max_chars`), pattern-detects prompt injection (`detect_injection`) and escalates instead of "arguing" with the attack |
| `aggregator` | deterministic | Debounces consecutive customer messages into one logical turn (`window_ms`) |
| `reception` | deterministic | Normalizes the incoming turn: text, media type, channel, contact metadata |

### Understanding

| Type | Kind | Purpose |
|---|---|---|
| `llm_classifier` | llm | Classifies the turn into one of `labels` with strict JSON and a confidence in [0,1]. `fallback_label` for out-of-set outputs; below `confidence_threshold` (with `escalate_below_threshold`) the turn escalates. `history_turns` controls how much history it sees |
| `llm_extractor` | llm | Extracts structured data (e.g. order items) from the turn text as strict JSON into `output_key` |
| `llm_vision` | llm | Extracts structured data from attached images (multimodal model) into `output_key` |

### Conversation

| Type | Kind | Purpose |
|---|---|---|
| `llm_prompt` | llm | General conversational node: answers with the node prompt + persona/context per `compose` (FAQ, greetings, general chat) |
| `response_composer` | llm | Writes the final customer-facing reply in the agent's persona. Applies the deterministic **price guard** (`price_guard`): amounts outside the turn's evidence trigger one strict retry, then escalation. `max_questions` caps pending questions per reply |

### Commerce

| Type | Kind | Purpose |
|---|---|---|
| `intake` | deterministic | Capture state machine: accumulates `required_fields` across turns and computes intake progress. May skip ahead (e.g. jump to the response node to ask for a missing field) |
| `catalog_search` | deterministic | Matches extracted items against the workspace catalog (embeddings/SKU match; `top_k`, `threshold`) and resolves priced products |
| `quote_builder` | deterministic | Builds the quote from resolved products; when `commit_enabled`, persists it to the CRM (`valid_days`, `auto_send`) |

### Lifecycle

| Type | Kind | Purpose |
|---|---|---|
| `followup` | deterministic | Schedules/manages thread follow-ups (quote reminders, next steps) |
| `escalation` | deterministic | Ends the turn by handing off to a human, recording the escalation reason (`notify_channel`) |

## Extending the catalog

New capabilities are added by (1) implementing the node in a runtime, (2) adding its entry + `params_schema` to `node-types.json`, and (3) bumping the catalog version. Definitions referencing a type a runtime doesn't implement must be rejected at load time — never silently skipped.

## Reference implementation

The first conforming runtime lives in HyperFlow's `hyperflow-llm` service (private), where catalog v1.0 maps to the production "Dory" B2B sales-advisor pipeline. [`examples/dory.russell.json`](../examples/dory.russell.json) is that agent expressed as data; it is the parity fixture used to prove the format can describe production-grade agents.
