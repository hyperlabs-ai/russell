# Russell

Factory de agentes conversacionales: define agentes nivel-Dory como **datos versionados y portables** (JSON), no como código. La topología (nodos, rutas, guards), los prompts y los parámetros por nodo (modelo, temperatura, json_mode, rebanadas de contexto) viven en una definición declarativa que un runtime ejecuta — hoy `hyperflow-llm` (Python/Odin), mañana un runtime TS embebible.

```
definición .russell.json ──publicar──▶ mind.russell_agents ──compila+cachea──▶ OdinEngine
        ▲                                                                        ▲
   @russell/validator                                              hyperflow-sdk (agent_ref)
```

## Paquetes

| Paquete | Qué es |
|---|---|
| `@russell/schema` | JSON Schema del formato (draft 2020-12), catálogo de tipos de nodo (`node-types.json`) y tipos TypeScript. Los `.json` en `schemas/` son la fuente de verdad. |
| `@russell/validator` | Validación estructural (Ajv) + semántica (integridad del grafo, tipos del catálogo, params por tipo). CLI `russell`. |

## Uso

```bash
npm install
npm run build
npm test

# Validar una definición
node packages/validator/dist/cli.js validate examples/dory.russell.json

# Ver el catálogo de tipos de nodo
node packages/validator/dist/cli.js node-types
```

Programático:

```ts
import { validateAgent } from "@russell/validator";

const result = validateAgent(JSON.parse(fs.readFileSync("mi-agente.russell.json", "utf-8")));
if (!result.valid) console.error(result.errors);
```

## El formato en 30 segundos

```jsonc
{
  "russellVersion": "1.0",
  "meta": { "slug": "dory", "name": "Dory" },
  "persona": { "agent_name": "Dory", "tono": "semiformal", "idioma": "es_MX" },
  "defaults": { "model": "gpt-4o", "fast_model": "gpt-4o-mini" },
  "context_sources": { "discovery": true, "catalog": true, "crm": true, "budget_chars": 4000 },
  "nodes": [
    { "id": "n2_intent", "type": "llm_classifier",
      "llm": { "model": "gpt-4o-mini", "temperature": 0, "json_mode": true },
      "params": { "labels": ["NUEVO_PEDIDO", "OTRO"], "confidence_threshold": 0.7 } }
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

Reglas de diseño:

- **Neutral al lenguaje.** Un `type` de nodo (p. ej. `llm_classifier`, `response_composer`) referencia un registry que cada runtime implementa; la definición nunca nombra clases de ningún lenguaje. Esto habilita el runtime TS embebible (v2) sin tocar el formato.
- **Sin secretos.** API keys y credenciales viven en el runtime, jamás en la definición.
- **Nivel Dory por diseño.** Los guards deterministas (price guard, input guard), el intake y los side-effects (committer de cotizaciones) son *tipos de nodo*, no prompts — un agente serio no es solo LLM.
- **Prompts opcionales.** Un nodo sin `prompt` usa el prompt por defecto de su tipo en el runtime; `examples/dory.russell.json` los omite a propósito para garantizar paridad exacta con el Dory de referencia en los evals.
- **Diffable y versionado.** `russellVersion` versiona el formato; publicar una definición crea una versión inmutable — las sesiones fijan su versión al iniciar.

## Ejemplo canónico

`examples/dory.russell.json` es el pipeline completo de Dory (N0–N8: guard de ingreso, agregador, recepción, clasificación de intención con umbral de escalación 0.70, extracción texto/visión, intake, catálogo, cotización, respuesta con price guard, seguimiento, escalación) expresado como datos. Es el fixture del **gate de paridad**: el runtime debe ejecutarlo con los mismos resultados de evals que el Dory implementado en código antes de invertir en el editor visual.

## Roadmap

1. **Fase 0 (este repo)** — schema + validador + Dory como datos. ✔
2. **Fase 1** — runtime en `hyperflow-llm`: tabla `mind.russell_agents`, loader + node registry + compiler → `ConversationalWorkflow`, caché por `(slug, version)`, `agent_ref` en Odin/MCP.
3. **Fase 2** — gate de paridad: evals de Dory contra ambas implementaciones.
4. **Fase 3** — `agent_ref {slug, version}` en `hyperflow-sdk`.
5. **Fase 4** — editor visual (React Flow) en este repo; el JSON sigue siendo la fuente de verdad.
