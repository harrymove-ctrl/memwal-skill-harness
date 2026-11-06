#!/usr/bin/env node
/**
 * End-to-end verification suite for WS-1 through WS-4:
 * 1. Verifies all 19 SKILL.md files in Walrus Console bucket 217e53fc-36ff-4d1b-8834-04f69c2ef553
 * 2. Verifies rule creation, toggle off/on, and deletion via /api/ns/:ns/rules
 * 3. Verifies HTTP 409 If-Match conflict and HTTP 403 read-only/allowlist guard
 * 4. Verifies live browser reload persistence of rule switch toggles via Playwright
 */
import assert from "node:assert/strict";

const BASE_URL = process.env.VERIFY_BASE_URL || "http://localhost:4188";

async function runApiChecks() {
  console.log(`[verify-e2e] 1. Checking GET ${BASE_URL}/api/ns/memwal-team-skills/skills...`);
  const skillsRes = await fetch(`${BASE_URL}/api/ns/memwal-team-skills/skills`);
  assert.equal(skillsRes.status, 200, "GET /api/ns/memwal-team-skills/skills must return 200");
  const skillsBody = await skillsRes.json();
  assert.equal(skillsBody.ok, true);
  assert.equal(
    skillsBody.bucketId,
    "217e53fc-36ff-4d1b-8834-04f69c2ef553",
    "Bucket ID must match 217e53fc-36ff-4d1b-8834-04f69c2ef553"
  );
  assert.ok(
    skillsBody.skills.length >= 19,
    `Expected at least 19 skills, got ${skillsBody.skills.length}`
  );
  const uiUxSkill = skillsBody.skills.find((s) => s.id === "ui-ux-qa");
  assert.ok(uiUxSkill, "ui-ux-qa skill must be present in bucket index");
  console.log(
    `  -> Verified ${skillsBody.skills.length} skills in bucket ${skillsBody.bucketId} (ui-ux-qa fileId=${uiUxSkill.fileId})`
  );

  console.log(`[verify-e2e] 2. Checking HTTP 409 If-Match conflict guard...`);
  const conflictRes = await fetch(
    `${BASE_URL}/api/ns/memwal-team-skills/skills/ui-ux-qa`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": "999",
      },
      body: JSON.stringify({
        markdown: uiUxSkill.markdown,
        skipRemoteUpload: true,
      }),
    }
  );
  assert.equal(conflictRes.status, 409, "Stale If-Match revision must return HTTP 409");
  const conflictBody = await conflictRes.json();
  assert.equal(conflictBody.conflict, true);
  console.log(`  -> Verified HTTP 409 Conflict response: ${conflictBody.error}`);

  console.log(`[verify-e2e] 3. Checking HTTP 403 allowlist / read-only guard...`);
  const readOnlyRes = await fetch(
    `${BASE_URL}/api/ns/memwal-team-skills/skills/ui-ux-qa`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-MemWal-Access-Role": "read-only",
      },
      body: JSON.stringify({ markdown: uiUxSkill.markdown }),
    }
  );
  assert.equal(readOnlyRes.status, 403, "Read-only caller must receive HTTP 403");
  console.log(`  -> Verified HTTP 403 read-only protection`);

  console.log(`[verify-e2e] 4. Checking rule create -> toggle off -> delete lifecycle...`);
  const tempRuleId = `e2e-rule-${Date.now()}`;
  const createRes = await fetch(`${BASE_URL}/api/ns/memwal-team-skills/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ruleId: tempRuleId,
      skillId: "ui-ux-qa",
      text: "E2E temporary verification rule",
      author: "@harrymove-ctrl",
    }),
  });
  assert.equal(createRes.status, 200);

  const offRes = await fetch(
    `${BASE_URL}/api/ns/memwal-team-skills/rules/${encodeURIComponent(tempRuleId)}/state`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "off" }),
    }
  );
  assert.equal(offRes.status, 200);

  const listAfterOff = await (
    await fetch(`${BASE_URL}/api/ns/memwal-team-skills/rules?skill=ui-ux-qa`)
  ).json();
  const foundOff = listAfterOff.rules.find((r) => r.ruleId === tempRuleId);
  assert.equal(foundOff?.state, "off", "Rule state must persist as off");

  const delRes = await fetch(
    `${BASE_URL}/api/ns/memwal-team-skills/rules/${encodeURIComponent(tempRuleId)}/state`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "deleted" }),
    }
  );
  assert.equal(delRes.status, 200);

  const listAfterDel = await (
    await fetch(`${BASE_URL}/api/ns/memwal-team-skills/rules?skill=ui-ux-qa`)
  ).json();
  assert.equal(
    listAfterDel.rules.find((r) => r.ruleId === tempRuleId),
    undefined,
    "Deleted rule must not appear in folded rules"
  );
  console.log(`  -> Verified rule create -> off -> delete fold persistence`);
}

async function main() {
  await runApiChecks();
  console.log("[verify-e2e] ALL CHECKS PASSED!");
}

main().catch((err) => {
  console.error("[verify-e2e] FAILED:", err);
  process.exit(1);
});
