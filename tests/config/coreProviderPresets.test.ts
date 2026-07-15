import { describe, expect, it } from "vitest";
import { providerPresets } from "@/config/claudeProviderPresets";
import { codexProviderPresets } from "@/config/codexProviderPresets";

describe("SwitchForge core provider presets", () => {
  it("ships only official and Anthropic-compatible Claude templates", () => {
    expect(providerPresets).toHaveLength(2);
    expect(providerPresets.map((preset) => preset.category)).toEqual([
      "official",
      "custom",
    ]);
    expect(
      providerPresets.every((preset) => preset.apiFormat === "anthropic"),
    ).toBe(true);
    expect(JSON.stringify(providerPresets)).not.toMatch(
      /partner|promotion|affiliate|ccswitch/i,
    );
  });

  it("ships only official and Responses-compatible Codex templates", () => {
    expect(codexProviderPresets).toHaveLength(2);
    expect(codexProviderPresets.map((preset) => preset.category)).toEqual([
      "official",
      "custom",
    ]);
    expect(
      codexProviderPresets.every(
        (preset) => preset.apiFormat === "openai_responses",
      ),
    ).toBe(true);
    expect(codexProviderPresets[1].config).toContain('wire_api = "responses"');
    expect(JSON.stringify(codexProviderPresets)).not.toMatch(
      /partner|promotion|affiliate|ccswitch/i,
    );
  });
});
