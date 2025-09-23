export interface Agent {
  name: string;
  category: AgentCategory;
  color?: string;
  description: string;
  instructions: string;
}

export type AgentCategory = string;

export interface AgentSearchOptions {
  category?: AgentCategory;
  keywords?: string;
}

export interface ListAgentsResult {
  agents: Agent[];
  total: number;
  categories: AgentCategory[];
}
