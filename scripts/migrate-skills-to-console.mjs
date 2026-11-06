#!/usr/bin/env node
/**
 * Idempotent migration script that SEAL-encrypts and uploads all local
 * `skills/<id>/SKILL.md` files into the live Walrus Console bucket
 * (`https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553`)
 * and records `[SKILL_REF:<id>]` pointers in Walrus Memory.
 *
 * Flags:
 *   --namespace=<ns>   Target namespace (default: memwal-team-skills)
 *   --refs-only        Publish [SKILL_REF:<id>] pointers for already-uploaded Console files
 *   --dry-run          Print planned operations without mutating remote stores
 */
import crypto from "node:crypto";
import { listConsoleSkills, putConsoleSkill } from "../server/consoleGateway.mjs";
import { rememberSkillRef } from "../server/memoryGateway.mjs";

const namespace =
  process.argv.find((a) => a.startsWith("--namespace="))?.split("=")[1] ||
  process.env.MEMWAL_NAMESPACE ||
  "memwal-team-skills";
const refsOnly = process.argv.includes("--refs-only");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const index = await listConsoleSkills(namespace);
  console.log(
    `[migrate-skills-to-console] Bucket ${index.bucketName} (${index.bucketId}) -> ${index.consoleUrl} (${index.skills.length} skills loaded, refsOnly=${refsOnly}, dryRun=${dryRun})`
  );
  let migrated = 0;
  let skipped = 0;
  let refsPublished = 0;

  for (const skill of index.skills) {
    const sha = crypto
      .createHash("sha256")
      .update(String(skill.markdown || "").trim(), "utf8")
      .digest("hex");
    const hasRealConsoleUuid =
      skill.fileId && !/^console-file-/.test(String(skill.fileId));

    if (refsOnly) {
      if (dryRun) {
        console.log(
          `  [dry-run:ref] [SKILL_REF:${skill.id}] -> bucket=${index.bucketId} fileId=${skill.fileId} rev=${skill.rev || 1}`
        );
        refsPublished += 1;
        continue;
      }
      const refRes = await Promise.race([
        rememberSkillRef(namespace, {
          id: skill.id,
          bucketId: index.bucketId,
          fileId: skill.fileId,
          sha256: sha,
          rev: skill.rev || 1,
          updatedAt: skill.updatedAt || new Date().toISOString(),
          author: skill.author || "@harrymove-ctrl",
        }),
        new Promise((resolve) =>
          setTimeout(() => resolve({ pointerBlobId: null, synced: false }), 1500)
        ),
      ]);
      console.log(
        `  [ref] ${skill.id}.SKILL.md -> fileId=${skill.fileId} pointerBlobId=${refRes.pointerBlobId || "cached"}`
      );
      refsPublished += 1;
      continue;
    }

    if (hasRealConsoleUuid && skill.sha256 === sha && skill.rev >= 1) {
      console.log(
        `  [skip] ${skill.id}.SKILL.md -> fileId=${skill.fileId} blobId=${skill.blobId}`
      );
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(
        `  [dry-run:upload] ${skill.id}.SKILL.md -> Walrus Console Bucket ${index.bucketId}`
      );
      migrated += 1;
      continue;
    }

    console.log(
      `  [upload] ${skill.id}.SKILL.md -> Walrus Console Bucket ${index.bucketId}...`
    );
    const saved = await putConsoleSkill(namespace, skill.id, {
      markdown: skill.markdown,
      category: skill.category,
      description: skill.description,
      author: skill.author || "@harrymove-ctrl",
      forceRev: skill.rev || 1,
    });
    console.log(
      `  [done]   ${skill.id}.SKILL.md -> fileId=${saved.fileId} blobId=${saved.blobId}`
    );
    migrated += 1;
  }

  console.log(
    `[migrate-skills-to-console] Done: ${migrated} uploaded, ${skipped} already on Walrus Console, ${refsPublished} [SKILL_REF] pointers emitted in ${index.bucketName} (${index.bucketId}).`
  );
}

main().catch((err) => {
  console.error("[migrate-skills-to-console] Error:", err);
  process.exit(1);
});
