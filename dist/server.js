"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PantheonMCPServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const agent_parser_js_1 = require("./agent-parser.js");
const package_json_1 = require("../package.json");
class PantheonMCPServer {
    constructor() {
        this.server = new index_js_1.Server({
            name: package_json_1.name,
            version: package_json_1.version,
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.parser = new agent_parser_js_1.AgentParser();
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
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
                        description: "Search agents by keywords in name, description, or content",
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
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case "list_agents": {
                        const category = args?.category;
                        const agents = category
                            ? await this.parser.getAgentsByCategory(category)
                            : await this.parser.getAllAgents();
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        agents: agents.map((agent) => ({
                                            name: agent.metadata.name,
                                            category: agent.category,
                                        })),
                                        total: agents.length,
                                        category: category || "all",
                                    }, null, 2),
                                },
                            ],
                        };
                    }
                    case "get_agent": {
                        const name = args?.name;
                        if (!name) {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Agent name is required");
                        }
                        const agent = await this.parser.getAgentByName(name);
                        if (!agent) {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, `Agent '${name}' not found`);
                        }
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        name: agent.metadata.name,
                                        description: agent.metadata.description,
                                        category: agent.category,
                                        color: agent.metadata.color,
                                        content: agent.content,
                                    }, null, 2),
                                },
                            ],
                        };
                    }
                    case "search_agents": {
                        const keywords = args?.keywords;
                        const category = args?.category;
                        if (!keywords) {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Keywords are required for search");
                        }
                        const agents = await this.parser.searchAgents({
                            keywords,
                            category,
                        });
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        agents: agents.map((agent) => ({
                                            name: agent.metadata.name,
                                            category: agent.category,
                                        })),
                                        total: agents.length,
                                        searchTerms: { keywords, category },
                                    }, null, 2),
                                },
                            ],
                        };
                    }
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof types_js_1.McpError) {
                    throw error;
                }
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Tool execution failed: ${String(error)}`);
            }
        });
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.log("Agents MCP Server running on stdio");
    }
}
exports.PantheonMCPServer = PantheonMCPServer;
//# sourceMappingURL=server.js.map