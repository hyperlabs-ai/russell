/**
 * Tipos TypeScript del formato Russell 1.0.
 * Espejo manual de schemas/russell.schema.json — si cambias el schema, actualiza esto.
 */

export type RussellVersion = "1.0";

export type Tono = "formal" | "semiformal" | "casual";

export type ContextSlice = "discovery" | "catalog" | "memories" | "crm";

export type NodeKind = "deterministic" | "llm";

export interface AgentMeta {
  slug: string;
  name: string;
  domain?: string;
  description?: string;
  tags?: string[];
}

export interface Persona {
  agent_name?: string;
  tono?: Tono;
  idioma?: string;
  personality?: string;
  response_rules?: string;
  custom_instructions?: string;
  seller_assignment_rules?: string;
}

export interface LlmParams {
  model?: string;
  fast_model?: string;
  temperature?: number;
  max_tokens?: number;
  timeout_s?: number;
  json_mode?: boolean;
}

export interface ContextSources {
  discovery?: boolean;
  catalog?: boolean;
  memories?: boolean;
  crm?: boolean;
  budget_chars?: number;
}

export interface ComposeSpec {
  with_persona?: boolean;
  with_context?: boolean;
  slices?: ContextSlice[];
  budget_chars?: number;
}

export interface NodeDef {
  id: string;
  type: string;
  name?: string;
  prompt?: string;
  llm?: LlmParams;
  compose?: ComposeSpec;
  params?: Record<string, unknown>;
  evaluator?: string;
}

export interface RouteWhen {
  intent?: string;
  media?: string[];
}

export interface Route {
  when?: RouteWhen;
  sequence: string[];
}

export interface Graph {
  entry: string[];
  branch_after?: string;
  routes: Route[];
  escalation_node?: string;
}

export interface InputGuardConfig {
  max_chars?: number;
  detect_injection?: boolean;
}

export interface PriceGuardConfig {
  enabled?: boolean;
  retry_once?: boolean;
  escalate_on_violation?: boolean;
}

export interface Guards {
  input?: InputGuardConfig;
  price?: PriceGuardConfig;
}

export interface Escalation {
  confidence_threshold?: number;
}

export interface RussellAgent {
  russellVersion: RussellVersion;
  meta: AgentMeta;
  persona?: Persona;
  defaults?: LlmParams;
  context_sources?: ContextSources;
  nodes: NodeDef[];
  graph: Graph;
  guards?: Guards;
  escalation?: Escalation;
}

export interface NodeTypeSpec {
  kind: NodeKind;
  description: string;
  params_schema: Record<string, unknown>;
}

export interface NodeTypeCatalog {
  catalogVersion: string;
  description: string;
  types: Record<string, NodeTypeSpec>;
}
