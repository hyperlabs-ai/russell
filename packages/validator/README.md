# @hyperlabs-ai/russell-validator

Validator and CLI for [Russell](https://github.com/hyperlabs-ai/russell) agent definitions. Two layers: structural (JSON Schema via Ajv) and semantic (graph integrity, node type catalog, per-type params) — the cross-reference checks a schema alone can't express.

```bash
npm install @hyperlabs-ai/russell-validator
```

## CLI

```bash
russell validate my-agent.russell.json   # exit 0 valid / 1 errors
russell node-types                       # list the node type catalog
```

## API

```ts
import { validateAgent } from "@hyperlabs-ai/russell-validator";

const result = validateAgent(definition);
// {
//   valid: boolean,
//   errors:   [{ path: "/graph/routes/0/sequence/2", message: "..." }],  // block
//   warnings: [{ path: "/nodes/4", message: "..." }],                    // advise
// }
```

Checks include: duplicate node ids, unknown node types, graph references to nonexistent nodes, `branch_after` outside the entry sequence, per-type `params` validation against the catalog, missing wildcard route, unreachable routes, prompts/llm params on deterministic nodes.

MIT © Hyperlabs AI
