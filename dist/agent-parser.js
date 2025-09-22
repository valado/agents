"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentParser = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const gray_matter_1 = __importDefault(require("gray-matter"));
class AgentParser {
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
        this.agents = [];
        this.initialized = false;
        // When running from dist/, look for agents in the parent directory
        if (this.baseDir.endsWith("/dist")) {
            this.baseDir = path.dirname(this.baseDir);
        }
        // Try to find agents directory in various locations
        const possibleAgentsDirs = [
            path.join(this.baseDir, "agents"),
            path.join(this.baseDir, "dist", "agents"),
            this.baseDir // fallback to current structure
        ];
        for (const agentsDir of possibleAgentsDirs) {
            if (fs.existsSync(agentsDir)) {
                // Check if this looks like an agents directory (has .md files or subdirs with .md files)
                if (this.hasAgentFiles(agentsDir)) {
                    this.baseDir = agentsDir;
                    break;
                }
            }
        }
    }
    hasAgentFiles(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            // Check for .md files directly in this directory
            const hasMarkdownFiles = entries.some(entry => entry.isFile() && entry.name.endsWith('.md'));
            if (hasMarkdownFiles)
                return true;
            // Check subdirectories for .md files
            const hasSubdirsWithMarkdown = entries.some(entry => {
                if (entry.isDirectory()) {
                    const subDir = path.join(dir, entry.name);
                    return this.hasAgentFiles(subDir);
                }
                return false;
            });
            return hasSubdirsWithMarkdown;
        }
        catch {
            return false;
        }
    }
    async loadAgents() {
        if (this.initialized)
            return;
        this.agents = [];
        await this.scanDirectoryRecursively(this.baseDir, "");
        this.initialized = true;
    }
    async scanDirectoryRecursively(currentDir, relativePath) {
        try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                const entryRelativePath = relativePath
                    ? path.join(relativePath, entry.name)
                    : entry.name;
                if (entry.isDirectory()) {
                    // Recursively scan subdirectories
                    await this.scanDirectoryRecursively(fullPath, entryRelativePath);
                }
                else if (entry.isFile() && entry.name.endsWith(".md")) {
                    // Process markdown files
                    await this.processAgentFile(fullPath, entryRelativePath);
                }
            }
        }
        catch (error) {
            console.error(`Error scanning directory ${currentDir}:`, error);
        }
    }
    async processAgentFile(filepath, relativePath) {
        try {
            const content = fs.readFileSync(filepath, "utf-8");
            let parsed;
            try {
                parsed = (0, gray_matter_1.default)(content);
            }
            catch (yamlError) {
                // If YAML parsing fails, try to extract just the basic info manually
                console.error(`YAML parsing failed for ${filepath}, attempting manual extraction`);
                const lines = content.split("\n");
                let frontmatterEnd = -1;
                let name = "";
                let description = "";
                let color = "";
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line === "---" && i > 0) {
                        frontmatterEnd = i;
                        break;
                    }
                    if (line.startsWith("name:")) {
                        name = line.substring(5).trim();
                    }
                    else if (line.startsWith("color:")) {
                        color = line.substring(6).trim();
                    }
                    else if (line.startsWith("description:")) {
                        // For description, we need to handle multi-line content
                        let desc = line.substring(12).trim();
                        // Read until we hit another field or end of frontmatter
                        for (let j = i + 1; j < lines.length; j++) {
                            const nextLine = lines[j];
                            if (nextLine.trim() === "---" ||
                                nextLine.startsWith("color:")) {
                                break;
                            }
                            desc += " " + nextLine.trim();
                        }
                        description = desc;
                    }
                }
                parsed = {
                    data: { name, description, color },
                    content: frontmatterEnd > -1
                        ? lines.slice(frontmatterEnd + 1).join("\n")
                        : content,
                };
            }
            // Determine category from the file's directory path
            const category = this.extractCategoryFromPath(relativePath);
            const metadata = {
                name: parsed.data.name || path.basename(filepath, ".md"),
                description: parsed.data.description || "",
                color: parsed.data.color,
            };
            const agent = {
                metadata,
                content: parsed.content,
                category,
                filepath,
            };
            this.agents.push(agent);
        }
        catch (error) {
            console.error(`Error parsing agent file ${filepath}:`, error);
        }
    }
    extractCategoryFromPath(relativePath) {
        // Extract category from the directory structure
        const pathParts = relativePath.split(path.sep);
        // If file is directly in the root, use "general" as category
        if (pathParts.length === 1) {
            return "general";
        }
        // If file is in a subdirectory, use the first directory as category
        // For nested structures like "tech/frontend/react.md", this would return "tech"
        return pathParts[0];
    }
    async getAllAgents() {
        await this.loadAgents();
        return [...this.agents];
    }
    async getAgentByName(name) {
        await this.loadAgents();
        return this.agents.find((agent) => agent.metadata.name === name) || null;
    }
    async getAgentsByCategory(category) {
        await this.loadAgents();
        return this.agents.filter((agent) => agent.category === category);
    }
    async searchAgents(options) {
        await this.loadAgents();
        let results = [...this.agents];
        if (options.category) {
            results = results.filter((agent) => agent.category === options.category);
        }
        if (options.keywords) {
            const keywords = options.keywords.toLowerCase();
            results = results.filter((agent) => agent.metadata.name.toLowerCase().includes(keywords) ||
                agent.metadata.description.toLowerCase().includes(keywords) ||
                agent.content.toLowerCase().includes(keywords));
        }
        return results;
    }
    async getCategories() {
        await this.loadAgents();
        const categories = new Set(this.agents.map((agent) => agent.category));
        return Array.from(categories);
    }
    async getStats() {
        await this.loadAgents();
        const categories = await this.getCategories();
        const stats = {
            total: this.agents.length,
            byCategory: {},
        };
        for (const category of categories) {
            stats.byCategory[category] = this.agents.filter((a) => a.category === category).length;
        }
        return stats;
    }
}
exports.AgentParser = AgentParser;
//# sourceMappingURL=agent-parser.js.map