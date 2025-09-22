#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const server_js_1 = require("./server.js");
const program = new commander_1.Command();
const package_json_1 = require("../package.json");
program.name(package_json_1.name).description(package_json_1.description).version(package_json_1.version);
program.action(async (options) => {
    try {
        const server = new server_js_1.PantheonMCPServer();
        await server.run();
    }
    catch (error) {
        console.error("Failed to start MCP server:", error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map