import {
  deleteConsoleSkill,
  getConsoleSkill,
  listConsoleSkills,
  putConsoleSkill,
} from "./consoleGateway.mjs";
import {
  listFoldedRules,
  setRuleState,
  upsertRule,
} from "./memoryGateway.mjs";
import { handleTeamRequest, requireWrite } from "./teamApi.mjs";

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, If-Match, X-API-Key"
  );
  res.end(JSON.stringify(body, null, 2));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export async function handleNamespaceSkillsRequest(req, res) {
  const urlStr = req.url || "/";
  if (!urlStr.startsWith("/api/ns/")) {
    return false;
  }

  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return true;
  }

  const parsedUrl = new URL(urlStr, "http://localhost");
  const pathname = parsedUrl.pathname.replace(/\/+$/, "");

  try {
    if (await handleTeamRequest(req, res, sendJson, readJsonBody)) return true;

    // Match /api/ns/:ns/skills
    const skillsListMatch = pathname.match(/^\/api\/ns\/([^/]+)\/skills$/);
    if (skillsListMatch) {
      const ns = decodeURIComponent(skillsListMatch[1]);
      if (req.method === "GET") {
        const result = await listConsoleSkills(ns);
        sendJson(res, 200, { ok: true, ...result });
        return true;
      }
    }

    // Match /api/ns/:ns/skills/:id
    const skillItemMatch = pathname.match(/^\/api\/ns\/([^/]+)\/skills\/(.+)$/);
    if (skillItemMatch) {
      const ns = decodeURIComponent(skillItemMatch[1]);
      const skillId = decodeURIComponent(skillItemMatch[2]);

      if (req.method === "GET") {
        const skill = await getConsoleSkill(ns, skillId);
        if (!skill) {
          sendJson(res, 404, { ok: false, error: `Skill not found: ${skillId}` });
          return true;
        }
        sendJson(res, 200, { ok: true, skill });
        return true;
      }

      if (req.method === "PUT") {
        const access = await requireWrite(req, res, ns, sendJson);
        if (!access) return true;
        const body = { ...(await readJsonBody(req)), author: access.handle };
        const ifMatchHeader = req.headers["if-match"];
        const ifMatchRev =
          ifMatchHeader !== undefined
            ? Number(String(ifMatchHeader).replace(/"/g, ""))
            : body.ifMatchRev;

        try {
          const saved = await putConsoleSkill(ns, skillId, {
            ...body,
            ifMatchRev,
          });
          sendJson(res, 200, { ok: true, ...saved });
        } catch (err) {
          if (err && err.statusCode === 409) {
            sendJson(res, 409, {
              ok: false,
              conflict: true,
              error: err.message,
              currentSkill: err.currentSkill,
            });
            return true;
          }
          throw err;
        }
        return true;
      }

      if (req.method === "DELETE") {
        const access = await requireWrite(req, res, ns, sendJson, { ownerOnly: true });
        if (!access) return true;
        const removed = await deleteConsoleSkill(ns, skillId);
        sendJson(res, 200, { ok: true, ...removed });
        return true;
      }
    }

    // Match /api/ns/:ns/rules
    const rulesListMatch = pathname.match(/^\/api\/ns\/([^/]+)\/rules$/);
    if (rulesListMatch) {
      const ns = decodeURIComponent(rulesListMatch[1]);
      if (req.method === "GET") {
        const skillFilter = parsedUrl.searchParams.get("skill") || "";
        const rules = await listFoldedRules(ns, skillFilter);
        sendJson(res, 200, { ok: true, namespace: ns, rules });
        return true;
      }

      if (req.method === "POST") {
        const access = await requireWrite(req, res, ns, sendJson);
        if (!access) return true;
        const body = { ...(await readJsonBody(req)), author: access.handle };
        const saved = await upsertRule(ns, body);
        sendJson(res, 200, { ok: true, ...saved });
        return true;
      }
    }

    // Match /api/ns/:ns/rules/:ruleId/state
    const ruleStateMatch = pathname.match(
      /^\/api\/ns\/([^/]+)\/rules\/([^/]+)\/state$/
    );
    if (ruleStateMatch && req.method === "POST") {
      const ns = decodeURIComponent(ruleStateMatch[1]);
      const ruleId = decodeURIComponent(ruleStateMatch[2]);
      const access = await requireWrite(req, res, ns, sendJson);
      if (!access) return true;
      const body = await readJsonBody(req);
      const nextState = String(body.state || "off").toLowerCase();
      const updated = await setRuleState(ns, ruleId, nextState);
      sendJson(res, 200, { ok: true, ...updated });
      return true;
    }

    // Match /api/ns/:ns/rules/:ruleId/bake
    const ruleBakeMatch = pathname.match(
      /^\/api\/ns\/([^/]+)\/rules\/([^/]+)\/bake$/
    );
    if (ruleBakeMatch && req.method === "POST") {
      const ns = decodeURIComponent(ruleBakeMatch[1]);
      const ruleId = decodeURIComponent(ruleBakeMatch[2]);
      const access = await requireWrite(req, res, ns, sendJson);
      if (!access) return true;
      const body = await readJsonBody(req);
      const rules = await listFoldedRules(ns);
      const targetRule = rules.find((r) => r.ruleId === ruleId);
      if (!targetRule) {
        sendJson(res, 404, { ok: false, error: `Rule not found: ${ruleId}` });
        return true;
      }
      const skillId = body.skillId || targetRule.skillId;
      const currentSkill = await getConsoleSkill(ns, skillId);
      const baseMd = currentSkill?.markdown || `# ${skillId}\n`;
      const sectionHeader = "## Team Rules (Synced from Walrus)";
      const bullet = `1. **${targetRule.text}**${targetRule.rationale ? ` (${targetRule.rationale})` : ""}`;
      const nextMd = baseMd.includes(sectionHeader)
        ? `${baseMd.trimEnd()}\n${bullet}\n`
        : `${baseMd.trimEnd()}\n\n${sectionHeader}\n\n${bullet}\n`;

      const savedSkill = await putConsoleSkill(ns, skillId, {
        markdown: nextMd,
        author: access.handle,
      });
      const updatedRule = await setRuleState(ns, ruleId, "off");

      sendJson(res, 200, {
        ok: true,
        baked: true,
        skill: savedSkill.skill,
        rev: savedSkill.rev,
        fileId: savedSkill.fileId,
        ruleState: updatedRule,
      });
      return true;
    }

    sendJson(res, 404, {
      ok: false,
      error: `Unknown namespace API route: ${pathname}`,
    });
    return true;
  } catch (err) {
    sendJson(res, 500, {
      ok: false,
      error: String(err?.message || err),
    });
    return true;
  }
}
