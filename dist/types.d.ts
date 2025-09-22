export interface AgentMetadata {
    name: string;
    description: string;
    color?: string;
}
export interface Agent {
    metadata: AgentMetadata;
    content: string;
    category: AgentCategory;
    filepath: string;
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
export interface ServerOptions {
    port?: number;
    host?: string;
}
//# sourceMappingURL=types.d.ts.map