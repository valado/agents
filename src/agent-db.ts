import agents from "./generated/agents.json";
import { Agent, AgentCategory, AgentSearchOptions } from "./types.js";

export class AgentDB {
  private agents: Agent[] = agents;

  constructor() {}

  async getAllAgents(): Promise<Agent[]> {
    return [...this.agents];
  }

  async getAgentByName(name: string): Promise<Agent | null> {
    return this.agents.find((agent) => agent.name === name) || null;
  }

  async getAgentsByCategory(category: AgentCategory): Promise<Agent[]> {
    return this.agents.filter((agent) => agent.category === category);
  }

  async searchAgents(options: AgentSearchOptions): Promise<Agent[]> {
    let results = [...this.agents];

    if (options.category) {
      results = results.filter((agent) => agent.category === options.category);
    }

    if (options.keywords) {
      const keywords = options.keywords.toLowerCase();
      results = results.filter(
        (agent) =>
          agent.name.toLowerCase().includes(keywords) ||
          agent.description.toLowerCase().includes(keywords) ||
          agent.instructions.toLowerCase().includes(keywords)
      );
    }

    return results;
  }

  async getCategories(): Promise<AgentCategory[]> {
    const categories = new Set(this.agents.map((agent) => agent.category));
    return Array.from(categories);
  }
}
