/**
 * @russell/validator — valida definiciones de agente Russell.
 *
 * Dos capas:
 *  1. Estructural: JSON Schema (Ajv, draft 2020-12).
 *  2. Semántica: integridad del grafo y del catálogo de tipos de nodo —
 *     lo que un JSON Schema no puede expresar (referencias cruzadas).
 */

import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject, ValidateFunction } from "ajv";
import {
  nodeTypeCatalog,
  russellSchema,
  type NodeDef,
  type RussellAgent,
} from "russell-schema";

export interface Issue {
  /** JSON path aproximado del problema (ej. "/nodes/3/params"). */
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Issue[];
  warnings: Issue[];
}

const ajv = new Ajv2020.default({ allErrors: true, allowUnionTypes: true });
const validateStructure: ValidateFunction = ajv.compile(russellSchema);

/** Compila (lazy, con caché) el params_schema de cada tipo del catálogo. */
const paramValidators = new Map<string, ValidateFunction>();
function paramsValidator(type: string): ValidateFunction | undefined {
  const spec = nodeTypeCatalog.types[type];
  if (!spec) return undefined;
  let fn = paramValidators.get(type);
  if (!fn) {
    fn = ajv.compile(spec.params_schema);
    paramValidators.set(type, fn);
  }
  return fn;
}

function ajvIssues(errors: ErrorObject[] | null | undefined, basePath = ""): Issue[] {
  return (errors ?? []).map((e) => ({
    path: basePath + (e.instancePath || "/"),
    message: e.message
      ? `${e.message}${e.params && "additionalProperty" in e.params ? ` (${String((e.params as Record<string, unknown>).additionalProperty)})` : ""}`
      : "error de schema",
  }));
}

function checkGraph(agent: RussellAgent, errors: Issue[], warnings: Issue[]): void {
  const ids = new Set<string>();
  agent.nodes.forEach((n, i) => {
    if (ids.has(n.id)) {
      errors.push({ path: `/nodes/${i}/id`, message: `id de nodo duplicado: "${n.id}"` });
    }
    ids.add(n.id);
  });

  const ref = (id: string, path: string): void => {
    if (!ids.has(id)) {
      errors.push({ path, message: `referencia a nodo inexistente: "${id}"` });
    }
  };

  const g = agent.graph;
  g.entry.forEach((id, i) => ref(id, `/graph/entry/${i}`));
  const branchAfter = g.branch_after ?? g.entry[g.entry.length - 1];
  if (g.branch_after) {
    ref(g.branch_after, "/graph/branch_after");
    if (!g.entry.includes(g.branch_after)) {
      errors.push({
        path: "/graph/branch_after",
        message: `branch_after ("${g.branch_after}") debe estar en la secuencia de entrada`,
      });
    }
  }
  g.routes.forEach((r, i) => {
    r.sequence.forEach((id, j) => ref(id, `/graph/routes/${i}/sequence/${j}`));
  });
  if (g.escalation_node) ref(g.escalation_node, "/graph/escalation_node");

  // Sin ruta comodín, un intent no contemplado deja el turno sin camino.
  const hasWildcard = g.routes.some((r) => !r.when || (!r.when.intent && !r.when.media));
  if (!hasWildcard) {
    warnings.push({
      path: "/graph/routes",
      message: "no hay ruta comodín (sin `when`): intents no contemplados quedarán sin ruta",
    });
  }

  // Rutas inalcanzables: una comodín antes de rutas específicas se las come.
  const wildcardIdx = g.routes.findIndex((r) => !r.when || (!r.when.intent && !r.when.media));
  if (wildcardIdx >= 0 && wildcardIdx < g.routes.length - 1) {
    warnings.push({
      path: `/graph/routes/${wildcardIdx}`,
      message: "hay rutas después de la comodín; nunca se alcanzarán (la primera que matchea gana)",
    });
  }

  // Nodos definidos pero no referenciados en el grafo.
  const referenced = new Set<string>([
    ...g.entry,
    ...(g.escalation_node ? [g.escalation_node] : []),
    ...g.routes.flatMap((r) => r.sequence),
  ]);
  agent.nodes.forEach((n, i) => {
    if (!referenced.has(n.id)) {
      warnings.push({ path: `/nodes/${i}`, message: `nodo "${n.id}" no está referenciado en el grafo` });
    }
  });
  void branchAfter;
}

function checkNodeTypes(agent: RussellAgent, errors: Issue[], warnings: Issue[]): void {
  const known = nodeTypeCatalog.types;
  agent.nodes.forEach((n: NodeDef, i: number) => {
    const spec = known[n.type];
    if (!spec) {
      errors.push({
        path: `/nodes/${i}/type`,
        message: `tipo de nodo desconocido: "${n.type}" (catálogo v${nodeTypeCatalog.catalogVersion})`,
      });
      return;
    }
    if (spec.kind === "deterministic") {
      if (n.prompt) {
        warnings.push({
          path: `/nodes/${i}/prompt`,
          message: `"${n.id}" es determinista (${n.type}); el prompt será ignorado`,
        });
      }
      if (n.llm) {
        warnings.push({
          path: `/nodes/${i}/llm`,
          message: `"${n.id}" es determinista (${n.type}); los parámetros llm serán ignorados`,
        });
      }
    }
    if (spec.kind === "llm" && !n.prompt) {
      warnings.push({
        path: `/nodes/${i}`,
        message: `"${n.id}" (${n.type}) no define prompt; el runtime usará su prompt por defecto`,
      });
    }
    if (n.params) {
      const fn = paramsValidator(n.type);
      if (fn && !fn(n.params)) {
        errors.push(...ajvIssues(fn.errors, `/nodes/${i}/params`));
      }
    }
  });
}

/** Valida una definición de agente Russell. No lanza: reporta errores/warnings. */
export function validateAgent(input: unknown): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  if (!validateStructure(input)) {
    errors.push(...ajvIssues(validateStructure.errors));
    // Sin estructura válida no hay garantías para los checks semánticos.
    return { valid: false, errors, warnings };
  }

  const agent = input as RussellAgent;
  checkGraph(agent, errors, warnings);
  checkNodeTypes(agent, errors, warnings);

  return { valid: errors.length === 0, errors, warnings };
}

export { nodeTypeCatalog, russellSchema } from "russell-schema";
export type { RussellAgent } from "russell-schema";
