# Contributing to Russell

Thanks for your interest! Russell is young and the surface is deliberately small: a format, a catalog, and a validator.

## Ground rules

- **The JSON files are the source of truth.** `packages/schema/schemas/*.json` define the format and catalog; the TypeScript in `src/` only loads and types them. Change the schema first, then the types (`src/types.ts` is a hand-maintained mirror — keep it in sync).
- **Format changes are versioned.** Anything that changes what a valid definition looks like requires bumping `russellVersion` (breaking) or documenting the addition in `docs/specification.md` and the CHANGELOG (compatible).
- **New node types** need: an entry in `node-types.json` with a `params_schema`, documentation in `docs/node-types.md`, and at least one runtime implementation before the catalog entry ships.
- **Every semantic rule needs a test.** The validator's graph/catalog checks live in `packages/validator/src/index.ts`; add cases to `packages/validator/test/`.
- Code comments may appear in Spanish or English — both are welcome.

## Dev loop

```bash
npm install
npm run build       # schema builds before validator (workspace order)
npm test
npm run validate:examples
```

## Reporting issues

Use GitHub Issues. For validation bugs, include the definition (or a minimal repro) and the expected vs. actual verdict.
