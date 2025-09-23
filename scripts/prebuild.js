const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const agentsDir = "./agents";
const outputDir = "./src/generated";

function scanDirectoryRecursively(currentDir, relativePath = "") {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  const agents = [];
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const entryRelativePath = relativePath
      ? path.join(relativePath, entry.name)
      : entry.name;

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      agents.push(...scanDirectoryRecursively(fullPath, entryRelativePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      // Process markdown file and convert to JSON
      const agent = processAgentFile(fullPath, entryRelativePath);
      if (agent) {
        agents.push(agent);
      }
    }
  }
  return agents;
}

function processAgentFile(filepath, relativePath) {
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    let parsed;

    try {
      parsed = matter(content);
    } catch (yamlError) {
      // Fallback manual parsing for malformed YAML
      console.error(
        `YAML parsing failed for ${filepath}, attempting manual extraction`
      );
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
        } else if (line.startsWith("color:")) {
          color = line.substring(6).trim();
        } else if (line.startsWith("description:")) {
          let desc = line.substring(12).trim();
          // Read until we hit another field or end of frontmatter
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j];
            if (nextLine.trim() === "---" || nextLine.startsWith("color:")) {
              break;
            }
            desc += " " + nextLine.trim();
          }
          description = desc;
        }
      }

      parsed = {
        data: { name, description, color },
        content:
          frontmatterEnd > -1
            ? lines.slice(frontmatterEnd + 1).join("\n")
            : content,
      };
    }

    // Extract category from the file's directory path
    const pathParts = relativePath.split(path.sep);
    const category = pathParts.length === 1 ? "general" : pathParts[0];

    // Create agent object conforming to the Agent interface
    const agent = {
      name: parsed.data.name || path.basename(filepath, ".md"),
      category,
      color: parsed.data.color,
      description: parsed.data.description || "",
      instructions: parsed.content,
    };
    console.log(`Converted ${filepath} to JSON model.`);
    return agent;
  } catch (error) {
    console.error(`Error processing agent file ${filepath}:`, error);
  }
}

function convertAllMdAgentsToJsonModel() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Converting MD agents to JSON...");
  const agents = scanDirectoryRecursively(agentsDir);
  console.log("Conversion completed.");

  // Write agents.json in the current directory
  if (agents.length > 0) {
    const outputJsonPath = path.join(outputDir, "agents.json");
    fs.writeFileSync(outputJsonPath, JSON.stringify(agents, null, 2), "utf-8");
    console.log(`Wrote agents to ${outputJsonPath}`);
  }
}

// init
convertAllMdAgentsToJsonModel();
