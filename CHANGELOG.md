# Changelog

All notable changes to the Russell format and packages are documented here.
Format versions (`russellVersion`) and package versions evolve independently.

## 0.1.0 — 2026-07-04

Initial public release.

- **Format `russellVersion: "1.0"`**: meta, persona, defaults, context_sources, nodes (per-node `llm`/`compose`/`params`/`evaluator`), graph (entry / branch_after / first-match routes / escalation_node), guards (input, price), escalation.
- **Node type catalog v1.0**: 13 types — `input_guard`, `aggregator`, `reception`, `llm_classifier`, `llm_extractor`, `llm_vision`, `llm_prompt`, `intake`, `catalog_search`, `quote_builder`, `response_composer`, `followup`, `escalation`.
- **`russell-schema`**: JSON Schema (draft 2020-12), catalog, TypeScript types.
- **`russell-validator`**: structural + semantic validation, `russell` CLI (`validate`, `node-types`).
- **`examples/dory.russell.json`**: complete production-grade B2B sales agent as data; parity fixture of the reference runtime.
