# Agents 🤖

A collection of AI agents for various tasks.

## Getting Started 🚀

Welcome to the agents repository! This project contains various AI agent definitions. The definitions can be used by any agentic system that supports markdown.

# Pantheon-MCP Server for Agents

![Pantheon-MCP logo](assets/pantheon-mcp_192×192.png)

[Homepage](https://pantheon-mcp.com)

An MCP (Model Context Protocol) server that delivers AI agent instructions on demand from this repository's collection of 42+ specialized agents.

## Available Tools

The server exposes 3 MCP tools:

### `list_agents`

List all available agents, optionally filtered by category.

```json
{
  "name": "list_agents",
  "arguments": {
    "category": "tech" // optional: business, growth, product, tech
  }
}
```

### `get_agent`

Get detailed information about a specific agent by name.

```json
{
  "name": "get_agent",
  "arguments": {
    "name": "react-frontend-dev"
  }
}
```

### `search_agents`

Search agents by keywords in name, description, or instructions.

```json
{
  "name": "search_agents",
  "arguments": {
    "keywords": "react",
    "category": "tech" // optional filter
  }
}
```

## Agent Categories

- **business** (6 agents): business-analyst, cfo-financial-analyzer, compliance-officer, financial-analyst, sales-strategist, startup-mentor
- **growth** (5 agents): conversion-optimizer, growth-marketer, idea-visionary, marketing-copywriter, marketing-strategist
- **product** (3 agents): product-designer, product-manager, product-strategist
- **tech** (28 agents): accessibility-auditor, ai-prompt-engineer, api-designer, aws-cloud-architect, code-reviewer, react-frontend-dev, and many more...

## Installation

To install globally:

```bash
npm install -g pantheon-mcp
npx pantheon-mcp
```

## Development

```bash
npm install
npm run build
npm run dev
```

---

Built with ❤️ and AI
