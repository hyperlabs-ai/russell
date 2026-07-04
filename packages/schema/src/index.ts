/**
 * russell-schema — formato de agente Russell 1.0.
 *
 * Exporta el JSON Schema canónico, el catálogo de tipos de nodo y los tipos TS.
 * Los archivos .json en schemas/ son la fuente de verdad (diffable, portable);
 * este módulo solo los carga.
 */

import { readFileSync } from "node:fs";

import type { NodeTypeCatalog } from "./types.js";

export * from "./types.js";

function loadJson<T>(relPath: string): T {
  const url = new URL(relPath, import.meta.url);
  return JSON.parse(readFileSync(url, "utf-8")) as T;
}

/** JSON Schema (draft 2020-12) del formato Russell 1.0. */
export const russellSchema: Record<string, unknown> = loadJson(
  "../schemas/russell.schema.json",
);

/** Catálogo de tipos de nodo v1 (registry que cada runtime implementa). */
export const nodeTypeCatalog: NodeTypeCatalog = loadJson(
  "../schemas/node-types.json",
);

/** Versión de formato soportada por este paquete. */
export const RUSSELL_VERSION = "1.0" as const;
