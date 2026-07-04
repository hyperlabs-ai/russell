# Russell 1.0 — Format Specification

Russell is a declarative language for defining conversational agents as versioned, portable data. A Russell definition describes an agent's full topology (nodes, routes, guards), per-node LLM parameters, persona, and escalation policy in a single JSON document that a runtime compiles and executes.

**Design rules:**

- **Language-neutral.** A node `type` references a registry that each runtime implements. Definitions never name classes, modules, or files of any language.
- **No secrets.** API keys and credentials live in the runtime, never in a definition.
- **Quality is inherited, not declared.** Deterministic guards, state machines, and side effects are node *types* implemented in runtime code; the JSON composes and parameterizes them. This is what lets Russell describe production-grade agents rather than prompt-only chatbots.
- **Immutable versions.** Publishing a definition creates version N+1; running sessions stay pinned to the version they started with.

The canonical JSON Schema lives at [`packages/schema/schemas/russell.schema.json`](../packages/schema/schemas/russell.schema.json). Point your editor at it for autocomplete and inline validation.

---

## Top level

```jsonc
{
  "russellVersion": "1.0",        // required — format version, runtimes reject unknown versions
  "meta": { ... },                // required — identity
  "persona": { ... },             // optional — agent identity & behavior rules
  "defaults": { ... },            // optional — default LLM params (per-node `llm` overrides)
  "context_sources": { ... },     // optional — which business-context slices are available
  "nodes": [ ... ],               // required — the node instances
  "graph": { ... },               // required — topology: entry sequence, branching, routes
  "guards": { ... },              // optional — deterministic input/price guards
  "escalation": { ... }           // optional — human-escalation policy
}
```

Unknown properties are rejected at every level (`additionalProperties: false`).

## `meta`

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string `^[a-z][a-z0-9_]*$` | ✔ | Stable identifier; used to publish/resolve versions |
| `name` | string | ✔ | Display name |
| `domain` | string | | e.g. `"sales"` |
| `description` | string | | |
| `tags` | string[] | | |

## `persona`

Composed into the system message of every node with `compose.with_persona: true`.

| Field | Type | Notes |
|---|---|---|
| `agent_name` | string | The name the agent uses for itself |
| `tono` | `"formal" \| "semiformal" \| "casual"` | Tone |
| `idioma` | string | e.g. `"es_MX"` |
| `personality` | string | Free-text personality / business framing |
| `response_rules` | string | Response style rules |
| `custom_instructions` | string | Highest-priority mandatory instructions |
| `seller_assignment_rules` | string | Domain-specific routing rules |

## `defaults` and per-node `llm`

Both share the same shape (`llmParams`). Per-node `llm` wins over `defaults`; the runtime's node registry provides final fallbacks.

| Field | Type | Notes |
|---|---|---|
| `model` | string | Model id; provider is resolved by the runtime (e.g. by prefix) |
| `fast_model` | string | Cheap model for lightweight subtasks |
| `temperature` | number 0–2 | |
| `max_tokens` | integer ≥ 1 | |
| `timeout_s` | integer ≥ 1 | |
| `json_mode` | boolean | Strict-JSON output |

## `context_sources`

Which slices of business context the runtime may inject, plus a character budget.

| Field | Type | Default |
|---|---|---|
| `discovery`, `catalog`, `memories`, `crm` | boolean | `true` |
| `budget_chars` | integer ≥ 200 | `4000` |

## `nodes[]`

Each node is an *instance* of a catalog type (see [node-types.md](node-types.md)).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string `^[a-z][a-z0-9_]*$` | ✔ | Unique within the definition; referenced by `graph` |
| `type` | string | ✔ | Must exist in the node type catalog |
| `name` | string | | Display name (tracing/UI) |
| `prompt` | string | | Full node prompt. LLM-kind nodes only; omitted → runtime's default prompt for that type |
| `llm` | llmParams | | Per-node LLM overrides (LLM-kind nodes only) |
| `compose` | object | | System-message composition: `with_persona` (bool), `with_context` (bool), `slices` (subset of context slices), `budget_chars` |
| `params` | object | | Type-specific parameters; validated against the catalog's `params_schema` for that type |
| `evaluator` | string | | Slug of the LLM-judge that evaluates this node's traces |

## `graph`

The topology. The runtime may only follow sequences declared here — the LLM never picks nodes outside the graph.

| Field | Type | Required | Notes |
|---|---|---|---|
| `entry` | nodeId[] (min 1) | ✔ | Sequence run at the start of every turn |
| `branch_after` | nodeId | | Node after which a route is resolved. Must be in `entry`. Defaults to the last entry node |
| `routes` | route[] (min 1) | ✔ | Ordered; **first match wins** |
| `escalation_node` | nodeId | | Jumped to from any node when the state flags escalation |

### `route`

| Field | Type | Notes |
|---|---|---|
| `when.intent` | string | Match the classified intent. Omit for wildcard |
| `when.media` | string[] | Match the turn's media type (e.g. `["imagen", "mixto"]`). Omit for wildcard |
| `sequence` | nodeId[] (min 1) | Nodes to run when the route matches |

A route with no `when` (or an empty one) is a **wildcard**. Declare exactly one, last — the validator warns if it is missing (unmatched intents would have no path) or if unreachable routes follow it.

## `guards`

Deterministic, code-implemented protections (no LLM involved).

- `input`: `max_chars` (truncate oversized input), `detect_injection` (pattern-based prompt-injection detection → escalate).
- `price`: `enabled`, `retry_once`, `escalate_on_violation` — the response may only mention monetary amounts present in the turn's evidence; violations retry once with a strict addendum, then escalate. Better a human than an invented price.

## `escalation`

| Field | Type | Notes |
|---|---|---|
| `confidence_threshold` | number 0–1 | Below this classification confidence, the turn escalates to a human |

---

## Validation

`russell-validator` applies two layers:

1. **Structural** — the JSON Schema (Ajv, draft 2020-12).
2. **Semantic** — cross-references a schema can't express: duplicate node ids, unknown node types, graph references to nonexistent nodes, `branch_after` outside `entry`, per-type `params` validation, plus warnings (missing wildcard route, unreachable routes, unreferenced nodes, prompts on deterministic nodes).

```ts
import { validateAgent } from "russell-validator";

const result = validateAgent(definition);
// { valid: boolean, errors: Issue[], warnings: Issue[] }
```

## Lifecycle semantics (what a conforming runtime must honor)

1. **Publish once, run many.** A published `(slug, version)` is immutable. Runtimes compile a definition once and cache the compiled artifact per version — resolution adds no per-message latency.
2. **Session pinning.** A conversation resolves its agent version on the first turn and keeps it for the session's lifetime, even if newer versions are published mid-conversation.
3. **Fail open to the platform default.** If a referenced definition cannot be resolved, the runtime logs and falls back to its default pipeline rather than failing the turn.
4. **Reject unknown format versions.** A runtime that doesn't support a definition's `russellVersion` must refuse to load it.
