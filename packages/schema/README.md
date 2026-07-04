# russell-schema

The [Russell](https://github.com/hyperlabs-ai/russell) agent format: JSON Schema (draft 2020-12) for declarative conversational agents, the node type catalog, and TypeScript types.

```bash
npm install russell-schema
```

```ts
import {
  russellSchema,      // the JSON Schema object
  nodeTypeCatalog,    // node types + per-type params_schema
  RUSSELL_VERSION,    // "1.0"
  type RussellAgent,  // TypeScript type of a definition
} from "russell-schema";
```

The canonical JSON files ship in the package and can be consumed directly:

```jsonc
// editor validation & autocomplete in any .russell.json file
{ "$schema": "./node_modules/russell-schema/schemas/russell.schema.json" }
```

- Format specification: [docs/specification.md](https://github.com/hyperlabs-ai/russell/blob/main/docs/specification.md)
- Node type catalog: [docs/node-types.md](https://github.com/hyperlabs-ai/russell/blob/main/docs/node-types.md)

For validation (structural + graph semantics) use [`russell-validator`](https://www.npmjs.com/package/russell-validator).

MIT © Hyperlabs AI
