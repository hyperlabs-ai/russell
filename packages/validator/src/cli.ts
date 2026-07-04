#!/usr/bin/env node
/**
 * CLI de Russell.
 *
 *   russell validate <archivo.russell.json>   — valida una definición de agente
 *   russell node-types                        — lista el catálogo de tipos de nodo
 */

import { readFileSync } from "node:fs";

import { nodeTypeCatalog, validateAgent, type Issue } from "./index.js";

function printIssues(label: string, issues: Issue[]): void {
  for (const issue of issues) {
    console.log(`  ${label} ${issue.path}: ${issue.message}`);
  }
}

function cmdValidate(file: string | undefined): number {
  if (!file) {
    console.error("uso: russell validate <archivo.russell.json>");
    return 2;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf-8"));
  } catch (err) {
    console.error(`✗ no se pudo leer/parsear ${file}: ${(err as Error).message}`);
    return 2;
  }

  const result = validateAgent(parsed);
  if (result.errors.length > 0) {
    console.log(`✗ ${file} — ${result.errors.length} error(es)`);
    printIssues("error", result.errors);
  } else {
    console.log(`✓ ${file} — definición válida (Russell 1.0)`);
  }
  if (result.warnings.length > 0) {
    console.log(`  ${result.warnings.length} warning(s):`);
    printIssues("warn ", result.warnings);
  }
  return result.valid ? 0 : 1;
}

function cmdNodeTypes(): number {
  console.log(`Catálogo de tipos de nodo Russell v${nodeTypeCatalog.catalogVersion}\n`);
  for (const [name, spec] of Object.entries(nodeTypeCatalog.types)) {
    console.log(`  ${name.padEnd(18)} [${spec.kind}] ${spec.description}`);
  }
  return 0;
}

const [, , command, ...args] = process.argv;
let code: number;
switch (command) {
  case "validate":
    code = cmdValidate(args[0]);
    break;
  case "node-types":
    code = cmdNodeTypes();
    break;
  default:
    console.error("comandos: validate <archivo> | node-types");
    code = 2;
}
process.exit(code);
