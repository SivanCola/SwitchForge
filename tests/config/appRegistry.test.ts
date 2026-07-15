import { describe, expect, it } from "vitest";
import {
  APP_REGISTRY,
  SUPPORTED_APP_IDS,
  isSupportedAppId,
} from "@/config/appRegistry";

describe("SwitchForge app registry", () => {
  it("contains only Claude Code and Codex", () => {
    expect(SUPPORTED_APP_IDS).toEqual(["claude", "codex"]);
    expect(Object.keys(APP_REGISTRY)).toEqual(["claude", "codex"]);
  });

  it("rejects clients removed from SwitchForge", () => {
    expect(isSupportedAppId("claude")).toBe(true);
    expect(isSupportedAppId("codex")).toBe(true);
    expect(isSupportedAppId("gemini")).toBe(false);
    expect(isSupportedAppId("openclaw")).toBe(false);
    expect(isSupportedAppId(null)).toBe(false);
  });
});
