import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { AgentDB } from "./agent-db.js";
import { AgentCategory } from "./types.js";
import { name, version } from "../package.json";

export class PantheonMCPServer {
  private server: Server;
  private agentDB: AgentDB;

  constructor() {
    this.server = new Server(
      {
        name,
        version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.agentDB = new AgentDB();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_agents",
            description: "List all available AI agents with their metadata",
            inputSchema: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description: "Filter agents by category",
                },
              },
            },
          },
          {
            name: "get_agent",
            description: "Get a specific agent by name",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the agent to retrieve",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "search_agents",
            description:
              "Search agents by keywords in name, description, or content",
            inputSchema: {
              type: "object",
              properties: {
                keywords: {
                  type: "string",
                  description: "Keywords to search for",
                },
                category: {
                  type: "string",
                  description: "Filter by category",
                },
              },
              required: ["keywords"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_agents": {
            const category = args?.category as AgentCategory | undefined;
            const agents = category
              ? await this.agentDB.getAgentsByCategory(category)
              : await this.agentDB.getAllAgents();

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      agents: agents.map((agent) => ({
                        name: agent.name,
                        category: agent.category,
                      })),
                      total: agents.length,
                      category: category || "all",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case "get_agent": {
            const name = args?.name as string;
            if (!name) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "Agent name is required"
              );
            }

            const agent = await this.agentDB.getAgentByName(name);
            if (!agent) {
              throw new McpError(
                ErrorCode.InvalidParams,
                `Agent '${name}' not found`
              );
            }

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      name: agent.name,
                      description: agent.description,
                      category: agent.category,
                      color: agent.color,
                      instructions: agent.instructions,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case "search_agents": {
            const keywords = args?.keywords as string;
            const category = args?.category as AgentCategory | undefined;

            if (!keywords) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "Keywords are required for search"
              );
            }

            const agents = await this.agentDB.searchAgents({
              keywords,
              category,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      agents: agents.map((agent) => ({
                        name: agent.name,
                        category: agent.category,
                      })),
                      total: agents.length,
                      searchTerms: { keywords, category },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${String(error)}`
        );
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("Agents MCP Server running on stdio");
  }
}
