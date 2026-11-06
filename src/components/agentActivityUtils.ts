export const FALLBACK_WALRUS_BLOBS_SET = new Set([
  "gs0M1js8_walrus_mainnet_skill_01",
  "z7BHX3br_walrus_mainnet_skill_02",
  "zjcqsfXK_walrus_mainnet_skill_03",
  "zhQZcZCU_walrus_mainnet_flow_04",
  "XvqXdkl9_walrus_mainnet_flow_05",
]);

export function isVerifiedWalrusBlobId(blobId: string | undefined): boolean {
  if (!blobId) return false;
  const trimmed = blobId.trim();
  if (
    trimmed.length < 25 ||
    trimmed.startsWith("pending_") ||
    trimmed.startsWith("job_") ||
    trimmed.startsWith("walrus_")
  ) {
    return false;
  }
  return true;
}
