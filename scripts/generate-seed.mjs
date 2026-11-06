import fs from "node:fs";
import path from "node:path";

const TEAM_SKILLS_ROOT = "/Volumes/Dev/memwal-skill-harness";
const DESIGN_SKILLS_ROOT = "/Volumes/Dev/design-skills";
const OUT_FILE = "/Volumes/Dev/memwal-skill-harness/src/data/generatedSkills.ts";

function parseFrontmatter(md, fallbackName) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { name: fallbackName, description: md.slice(0, 140).replace(/\n/g, " ") };
  }
  const yaml = match[1];
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  let desc = "";
  const descBlock = yaml.match(/description:\s*>?-?\n([\s\S]*?)(?=\n\w+:|$)/);
  if (descBlock) {
    desc = descBlock[1].replace(/\n\s+/g, " ").trim();
  } else {
    const singleDesc = yaml.match(/^description:\s*(.+)$/m);
    if (singleDesc) desc = singleDesc[1].replace(/^["']|["']$/g, "").trim();
  }
  return {
    name: nameMatch ? nameMatch[1].trim() : fallbackName,
    description: desc || "Shared team agent skill stored in Walrus Memory",
  };
}

function categorizeTeamSkill(name) {
  if (["ui-ux-qa", "concise-ui-copy", "interface-bts", "react-bits-pro", "glimm"].includes(name)) {
    return "UI/UX & Design";
  }
  if (["memwal-qa", "memwal-review", "memwal-dev-wallet", "memwal-skill-hub", "boost"].includes(name)) {
    return "MemWal QA, Review & Dev-Wallet";
  }
  if (["walm-ticket", "gh-issue-fixed", "linear-org-routing", "routing", "getting-started"].includes(name)) {
    return "GitHub & Linear Workflow";
  }
  return "Rust & Relayer Engineering";
}

function getRelatedTeamSkills(name) {
  const map = {
    "ui-ux-qa": ["glimm", "concise-ui-copy", "interface-bts", "react-bits-pro", "memwal-qa"],
    glimm: ["ui-ux-qa", "react-bits-pro", "interface-bts", "concise-ui-copy"],
    "concise-ui-copy": ["ui-ux-qa", "glimm", "interface-bts", "react-bits-pro"],
    "interface-bts": ["ui-ux-qa", "glimm", "concise-ui-copy", "react-bits-pro"],
    "react-bits-pro": ["ui-ux-qa", "glimm", "concise-ui-copy", "interface-bts"],
    boost: ["ui-ux-qa", "memwal-skill-hub", "memwal-qa"],
    "memwal-skill-hub": ["memwal-qa", "memwal-review", "memwal-dev-wallet", "walm-ticket"],
    "memwal-qa": ["memwal-review", "memwal-dev-wallet", "gh-issue-fixed", "walm-ticket"],
    "memwal-review": ["memwal-qa", "memwal-dev-wallet", "gh-issue-fixed"],
    "memwal-dev-wallet": ["memwal-qa", "memwal-review"],
    "walm-ticket": ["gh-issue-fixed", "linear-org-routing", "memwal-qa"],
    "gh-issue-fixed": ["walm-ticket", "memwal-review", "memwal-qa"],
    "linear-org-routing": ["routing", "walm-ticket"],
    "routing": ["linear-org-routing", "getting-started"],
    "getting-started": ["memwal-review", "memwal-qa", "routing"],
    "rust-best-practices": ["rust-async-patterns", "rust-patterns", "rust-testing"],
    "rust-async-patterns": ["rust-best-practices", "rust-patterns", "rust-testing"],
    "rust-patterns": ["rust-best-practices", "rust-async-patterns"],
    "rust-testing": ["rust-best-practices", "rust-async-patterns"],
    "typesafe-ai": ["rust-best-practices", "memwal-qa"],
  };
  return map[name] || [];
}

const teamSkills = [];
const skillsDir = path.join(TEAM_SKILLS_ROOT, "skills");
if (fs.existsSync(skillsDir)) {
  for (const entry of fs.readdirSync(skillsDir).sort()) {
    const skillMdPath = path.join(skillsDir, entry, "SKILL.md");
    if (fs.existsSync(skillMdPath)) {
      const content = fs.readFileSync(skillMdPath, "utf8");
      const { name, description } = parseFrontmatter(content, entry);
      teamSkills.push({
        id: entry,
        name,
        namespace: "memwal-team-skills",
        category: categorizeTeamSkill(entry),
        description,
        markdown: content,
        relatedSkills: getRelatedTeamSkills(entry),
        blobId: `walrus_blob_skill_${entry.replace(/[^a-z0-9]/g, "_")}_v1`,
        updatedAt: "2026-10-27T11:53:00+07:00",
        authorKey: "dk_owner_harry_0x8f92",
      });
    }
  }
}

const rulesPath = path.join(TEAM_SKILLS_ROOT, "rules", "GEMINI.md");
if (fs.existsSync(rulesPath)) {
  const rulesContent = fs.readFileSync(rulesPath, "utf8");
  teamSkills.push({
    id: "rules-gemini-md",
    name: "rules/GEMINI.md",
    namespace: "memwal-team-skills",
    category: "Core Team Rules",
    description: "Global engineering & merge-gate rules for all AI coding agents on MystenLabs/MemWal.",
    markdown: rulesContent,
    relatedSkills: ["memwal-qa", "memwal-review", "walm-ticket", "gh-issue-fixed", "memwal-skill-hub"],
    blobId: "walrus_blob_rule_gemini_md_v2",
    updatedAt: "2026-10-27T11:53:00+07:00",
    authorKey: "dk_owner_harry_0x8f92",
  });
}

// Also scan a handful of design skills from /Volumes/Dev/design-skills for the second namespace!
const designSkills = [];
if (fs.existsSync(DESIGN_SKILLS_ROOT)) {
  for (const pack of fs.readdirSync(DESIGN_SKILLS_ROOT).sort()) {
    const packDir = path.join(DESIGN_SKILLS_ROOT, pack);
    if (!fs.statSync(packDir).isDirectory()) continue;
    // Find first SKILL.md inside packDir or subdirs
    const walk = (dir, depth = 0) => {
      if (depth > 3) return;
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
          walk(full, depth + 1);
        } else if (f === "SKILL.md" && designSkills.length < 10) {
          const content = fs.readFileSync(full, "utf8");
          const folderName = path.basename(dir);
          const id = folderName === pack ? pack : `${pack}-${folderName}`;
          const { name, description } = parseFrontmatter(content, id);
          designSkills.push({
            id,
            name,
            namespace: "design-skills",
            category: pack.includes("swift") ? "SwiftUI & Apple Craft" : "Web UI & Motion Craft",
            description,
            markdown: content,
            relatedSkills: [],
            blobId: `walrus_blob_design_${id.replace(/[^a-z0-9]/g, "_")}`,
            updatedAt: "2026-10-21T14:16:00+07:00",
            authorKey: "dk_owner_harry_0x8f92",
          });
        }
      }
    };
    walk(packDir);
  }
}

// Wire related skills in design-skills
for (let i = 0; i < designSkills.length; i++) {
  const next = designSkills[(i + 1) % designSkills.length];
  if (next && next.id !== designSkills[i].id) {
    designSkills[i].relatedSkills = [next.id];
  }
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
const fileContent = `// Auto-generated from /Users/harryphan/Documents/dev/memwal-team-skills and /Volumes/Dev/design-skills
import type { HostedSkillNode } from "../types";

export const INITIAL_SKILLS: HostedSkillNode[] = ${JSON.stringify([...teamSkills, ...designSkills], null, 2)};
`;

fs.writeFileSync(OUT_FILE, fileContent, "utf8");
console.log(`Generated ${teamSkills.length} team skills and ${designSkills.length} design skills -> ${OUT_FILE}`);
