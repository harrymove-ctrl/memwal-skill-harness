import { describe, expect, it } from "vitest";
import { displayHandle } from "./AccountMenu";
import { LEGACY_REDIRECTS, PLACES, PLACE_PATHS, placeFromPath, resolvePath } from "./places";
import { skillCountLabel } from "./SpaceSwitcher";

describe("routes", () => {
  it("maps every place path back to its place", () => {
    for (const place of PLACES) expect(placeFromPath(PLACE_PATHS[place])).toBe(place);
  });

  it("sends each old link to the place that replaced it", () => {
    expect(placeFromPath("/graph")).toBe("skills");
    expect(placeFromPath("/eval")).toBe("try");
    expect(placeFromPath("/cad")).toBe("agents");
    for (const target of Object.values(LEGACY_REDIRECTS)) expect(placeFromPath(target)).not.toBeNull();
  });

  it("ignores a query, a hash and a trailing slash", () => {
    expect(placeFromPath("/skills?space=a#rule-1")).toBe("skills");
    expect(placeFromPath("/team/")).toBe("team");
    expect(resolvePath("/eval/?x=1")).toBe("/try");
  });

  it("leaves pages outside the five alone", () => {
    expect(placeFromPath("/")).toBeNull();
    expect(placeFromPath("/bento")).toBeNull();
    expect(resolvePath("/")).toBe("/");
    expect(placeFromPath("/skillsx")).toBeNull();
  });
});

describe("labels", () => {
  it("counts skills in plain words", () => {
    expect(skillCountLabel(0)).toBe("0 skills");
    expect(skillCountLabel(1)).toBe("1 skill");
    expect(skillCountLabel(12345)).toBe("12,345 skills");
    expect(skillCountLabel(Number.NaN)).toBe("0 skills");
    expect(skillCountLabel(-3)).toBe("0 skills");
  });

  it("shortens a wallet address and keeps a handle as written", () => {
    const address = `0x463e${"a".repeat(56)}eb1d`;
    expect(displayHandle(address)).toEqual({ text: "0x463e…eb1d", isAddress: true });
    expect(displayHandle("harrymove-ctrl")).toEqual({ text: "harrymove-ctrl", isAddress: false });
    expect(displayHandle("0xnotanaddress")).toEqual({ text: "0xnotanaddress", isAddress: false });
  });
});
