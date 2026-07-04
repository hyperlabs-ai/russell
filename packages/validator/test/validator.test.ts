import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateAgent } from "../src/index.js";
import type { RussellAgent } from "@russell/schema";

const doryPath = fileURLToPath(
  new URL("../../../examples/dory.russell.json", import.meta.url),
);

function loadDory(): RussellAgent {
  return JSON.parse(readFileSync(doryPath, "utf-8")) as RussellAgent;
}

describe("validateAgent", () => {
  it("acepta la definición completa de Dory", () => {
    const result = validateAgent(loadDory());
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("rechaza una definición sin russellVersion", () => {
    const agent = loadDory() as Record<string, unknown>;
    delete agent.russellVersion;
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("russellVersion"))).toBe(true);
  });

  it("rechaza un tipo de nodo desconocido", () => {
    const agent = loadDory();
    agent.nodes[0].type = "warp_drive";
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("warp_drive"))).toBe(true);
  });

  it("rechaza rutas que referencian nodos inexistentes", () => {
    const agent = loadDory();
    agent.graph.routes[0].sequence.push("nodo_fantasma");
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("nodo_fantasma"))).toBe(true);
  });

  it("rechaza ids de nodo duplicados", () => {
    const agent = loadDory();
    agent.nodes.push({ ...agent.nodes[0] });
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("duplicado"))).toBe(true);
  });

  it("rechaza params fuera del schema del tipo (confidence_threshold > 1)", () => {
    const agent = loadDory();
    const classifier = agent.nodes.find((n) => n.type === "llm_classifier");
    classifier!.params!.confidence_threshold = 1.5;
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("/params"))).toBe(true);
  });

  it("rechaza branch_after fuera de la secuencia de entrada", () => {
    const agent = loadDory();
    agent.graph.branch_after = "n6_response";
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
  });

  it("advierte cuando no hay ruta comodín", () => {
    const agent = loadDory();
    agent.graph.routes = agent.graph.routes.filter((r) => r.when);
    const result = validateAgent(agent);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.message.includes("comodín"))).toBe(true);
  });

  it("advierte prompt/llm en nodos deterministas", () => {
    const agent = loadDory();
    const guard = agent.nodes.find((n) => n.type === "input_guard");
    guard!.prompt = "esto no aplica";
    const result = validateAgent(agent);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.message.includes("determinista"))).toBe(true);
  });

  it("rechaza propiedades desconocidas a nivel raíz", () => {
    const agent = loadDory() as Record<string, unknown>;
    agent.superpoderes = true;
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
  });
});
