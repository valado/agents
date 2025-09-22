import { Agent, AgentCategory, AgentSearchOptions } from "./types.js";
export declare class AgentParser {
    private baseDir;
    private agents;
    private initialized;
    constructor(baseDir?: string);
    private hasAgentFiles;
    private loadAgents;
    private scanDirectoryRecursively;
    private processAgentFile;
    private extractCategoryFromPath;
    getAllAgents(): Promise<Agent[]>;
    getAgentByName(name: string): Promise<Agent | null>;
    getAgentsByCategory(category: AgentCategory): Promise<Agent[]>;
    searchAgents(options: AgentSearchOptions): Promise<Agent[]>;
    getCategories(): Promise<AgentCategory[]>;
    getStats(): Promise<{
        total: number;
        byCategory: Record<AgentCategory, number>;
    }>;
}
//# sourceMappingURL=agent-parser.d.ts.map