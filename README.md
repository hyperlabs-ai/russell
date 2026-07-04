# Russell

**A declarative language for conversational agents.** Define production-grade agents — node topology, intent routing, per-node model & temperature, deterministic guards, escalation policy, persona — as versioned, portable JSON that a runtime compiles and executes. No code, no redeploys.

> *Leer en español: [README.es.md](README.es.md)*

```jsonc
{
  "russellVersion": "1.0",
  "meta": { "slug": "dory", "name": "Dory", "domain": "sales" },
  "persona": { "agent_name": "Dory", "tono": "semiformal", "idioma": "es_MX" },
  "defaults": { "model": "gpt-4o", "fast_model": "gpt-4o-mini" },
  "nodes": [
    { "id": "n2_intent", "type": "llm_classifier",
      "llm": { "model": "gpt-4o-mini", "temperature": 0, "json_mode": true },
      "params": { "labels": ["NUEVO_PEDIDO", "OTRO"], "confidence_threshold": 0.7 } },
    { "id": "n6_response", "type": "response_composer",
      "llm": { "temperature": 0.5, "max_tokens": 160 },
      "compose": { "with_persona": true, "slices": ["crm", "discovery"] },
      "params": { "price_guard": true } }
  ],
  "graph": {
    "entry": ["n_guard", "n2_intent"],
    "branch_after": "n2_intent",
    "routes": [
      { "when": { "intent": "NUEVO_PEDIDO" }, "sequence": ["n3a_extraction", "n5_quote", "n6_response"] },
      { "sequence": ["n3c_general", "n6_response"] }
    ],
    "escalation_node": "n8_escalation"
  },
  "escalation": { "confidence_threshold": 0.7 }
}
```

## Why

Building a serious conversational agent usually means writing pipeline classes, wiring them into an orchestrator, and redeploying a service for every change. The *parameters* may be configurable, but the agent's **structure** is welded to code and to a deploy cycle.

Russell decouples them. What i18n did for strings — move them out of code into files any tool can read, validate, diff, and version — Russell does for agents:

- **Time-to-agent**: creating or changing an agent becomes publishing a new version of a JSON document. No deploy.
- **Multi-tenancy**: every workspace/customer gets its own agent variant (persona, routes, thresholds, models per node) with one runtime and zero code forks.
- **Provider decoupling**: agents are described by capability (`llm_classifier` with `json_mode`), never by vendor. Swapping models on one node is a field edit.
- **Governance**: immutable versions with checksums, sessions pinned to the version they started with, definitions that are diffable and PR-reviewable, trivial rollback.

The design bet that keeps quality high: **quality is inherited, not declared.** Deterministic guards (e.g. a price guard that forbids amounts absent from the turn's evidence), intake state machines, and side effects are node *types implemented in runtime code* — the JSON composes them. Russell describes real agents, not prompt-only chatbots.

## Packages

| Package | What it is |
|---|---|
| [`russell-schema`](packages/schema) | The format: JSON Schema (draft 2020-12), node type catalog, TypeScript types |
| [`russell-validator`](packages/validator) | Two-layer validation (structural + graph/catalog semantics) and the `russell` CLI |

```bash
npm install russell-validator
```

## Quickstart

**CLI:**

```bash
npx --package=russell-validator russell validate my-agent.russell.json
npx --package=russell-validator russell node-types
```

**Programmatic:**

```ts
import { validateAgent } from "russell-validator";

const result = validateAgent(JSON.parse(fs.readFileSync("my-agent.russell.json", "utf-8")));
if (!result.valid) console.error(result.errors);   // errors block; warnings advise
```

**Editor autocomplete** — point `$schema` at the format schema and any JSON-aware editor validates as you type:

```jsonc
{ "$schema": "./node_modules/russell-schema/schemas/russell.schema.json", ... }
```

## Documentation

- [Format specification](docs/specification.md) — every field, plus the lifecycle semantics a conforming runtime must honor
- [Node type catalog](docs/node-types.md) — the 13 v1 types and how to extend the catalog
- [`examples/dory.russell.json`](examples/dory.russell.json) — a complete production B2B sales agent (intent classification, text/vision order extraction, catalog matching, quoting with price guard, intake state machine, human escalation) expressed as data

## Runtimes

A Russell definition is executed by a runtime that implements the node type catalog:

- **HyperFlow `hyperflow-llm`** (Python — reference implementation, private): compiles definitions into its orchestration engine; powers production agents today. Versioned publishing, per-version compile cache, session pinning.
- **Embeddable TypeScript runtime** — on the roadmap. The format is language-neutral by design (definitions never reference classes of any language), so new runtimes require no format changes.

## Authoring model

Russell has no visual builder, deliberately. Definitions are authored as JSON — by hand with editor validation, or conversationally: an LLM writes the definition, the **validator is the ground truth** that catches hallucinated structure, then you publish and converse with the result. A read-only graph viewer is welcome tooling; a drag-and-drop editor is not the product.

## Development

```bash
npm install
npm run build
npm test                  # validator test suite
npm run validate:examples # CLI against the canonical example
```

## License

[MIT](LICENSE) © Hyperlabs AI
