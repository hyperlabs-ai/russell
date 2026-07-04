# Russell

**Un lenguaje declarativo para agentes conversacionales.** Define agentes de nivel producción — topología de nodos, ruteo por intención, modelo y temperatura por nodo, guards deterministas, política de escalación, persona — como JSON versionado y portable que un runtime compila y ejecuta. Sin código, sin redeploys.

> *Read in English: [README.md](README.md)*

## Por qué

Construir un agente conversacional serio normalmente implica escribir clases de pipeline, integrarlas a un orquestador y redeployar un servicio por cada cambio. Los *parámetros* pueden ser configurables, pero la **estructura** del agente queda soldada al código y al ciclo de deploy.

Russell los desacopla. Lo que i18n hizo con los textos — sacarlos del código a archivos que cualquier herramienta puede leer, validar, diffear y versionar — Russell lo hace con los agentes:

- **Time-to-agent**: crear o modificar un agente pasa a ser publicar una nueva versión de un documento JSON. Sin deploy.
- **Multi-tenancy**: cada workspace/cliente obtiene su variante del agente (persona, rutas, umbrales, modelos por nodo) con un solo runtime y cero forks de código.
- **Desacoplamiento del proveedor**: los agentes se describen por capacidad (`llm_classifier` con `json_mode`), nunca por vendor. Cambiar de modelo en un nodo es editar un campo.
- **Gobernanza**: versiones inmutables con checksum, sesiones pineadas a la versión con la que iniciaron, definiciones diffeables y revisables en PR, rollback trivial.

La apuesta de diseño que sostiene la calidad: **la calidad se hereda, no se declara.** Los guards deterministas (p. ej. un price guard que prohíbe montos ausentes de la evidencia del turno), las máquinas de estado de intake y los side effects son *tipos de nodo implementados en código del runtime* — el JSON los compone. Russell describe agentes reales, no chatbots de puro prompt.

## Paquetes

| Paquete | Qué es |
|---|---|
| [`russell-schema`](packages/schema) | El formato: JSON Schema (draft 2020-12), catálogo de tipos de nodo y tipos TypeScript |
| [`russell-validator`](packages/validator) | Validación en dos capas (estructural + semántica de grafo/catálogo) y el CLI `russell` |

```bash
npm install russell-validator
```

## Inicio rápido

```bash
npx --package=russell-validator russell validate mi-agente.russell.json
npx --package=russell-validator russell node-types
```

```ts
import { validateAgent } from "russell-validator";

const result = validateAgent(JSON.parse(fs.readFileSync("mi-agente.russell.json", "utf-8")));
if (!result.valid) console.error(result.errors);   // errors bloquean; warnings aconsejan
```

**Autocompletado en el editor** — apunta `$schema` al schema del formato y cualquier editor con soporte JSON valida mientras escribes:

```jsonc
{ "$schema": "./node_modules/russell-schema/schemas/russell.schema.json", ... }
```

## Documentación

- [Especificación del formato](docs/specification.md) — todos los campos y la semántica de ciclo de vida que un runtime conforme debe respetar
- [Catálogo de tipos de nodo](docs/node-types.md) — los 13 tipos v1 y cómo extender el catálogo
- [`examples/dory.russell.json`](examples/dory.russell.json) — un agente B2B de ventas completo y en producción (clasificación de intención, extracción de pedidos por texto/visión, matching de catálogo, cotización con price guard, intake, escalación a humano) expresado como datos

## Runtimes

- **HyperFlow `hyperflow-llm`** (Python — implementación de referencia, privada): compila definiciones a su engine de orquestación; hoy corre agentes en producción. Publicación versionada, caché de compilación por versión, pin de sesión.
- **Runtime TypeScript embebible** — en el roadmap. El formato es neutral al lenguaje por diseño, así que nuevos runtimes no requieren cambios al formato.

## Modelo de autoría

Russell no tiene builder visual, a propósito. Las definiciones se escriben como JSON — a mano con validación del editor, o conversacionalmente: un LLM escribe la definición, el **validador es la fuente de verdad** que atrapa estructura alucinada, y luego publicas y conversas con el resultado. Un visor de grafo de solo lectura es bienvenido; un editor drag-and-drop no es el producto.

## Licencia

[MIT](LICENSE) © Hyperlabs AI
