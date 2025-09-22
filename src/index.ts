#!/usr/bin/env node

import { Command } from "commander";
import { PantheonMCPServer } from "./server.js";

const program = new Command();
import { name, version, description } from "../package.json";
program.name(name).description(description).version(version);

program.action(async (options) => {
  try {
    const server = new PantheonMCPServer();
    await server.run();
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
});

program.parse();
