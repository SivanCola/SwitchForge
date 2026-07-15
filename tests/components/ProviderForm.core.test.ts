import { describe, expect, it } from "vitest";
import {
  isCodexResponsesConfig,
  isSafeProviderUrl,
} from "@/components/providers/forms/ProviderForm";

describe("ProviderForm core validation", () => {
  it.each([
    "https://api.example.com",
    "http://localhost:8080",
    "http://127.0.0.1:8080/v1",
    "http://[::1]:8080/v1",
  ])("accepts secure or loopback endpoint %s", (url) => {
    expect(isSafeProviderUrl(url)).toBe(true);
  });

  it.each(["http://api.example.com", "ftp://localhost/provider", "not-a-url"])(
    "rejects unsafe endpoint %s",
    (url) => {
      expect(isSafeProviderUrl(url)).toBe(false);
    },
  );

  it("accepts only valid native Responses Codex TOML", () => {
    expect(
      isCodexResponsesConfig(`model_provider = "custom"
[model_providers.custom]
base_url = "https://api.example.com/v1"
wire_api = "responses"
`),
    ).toBe(true);
    expect(isCodexResponsesConfig('wire_api = "chat"')).toBe(false);
    expect(isCodexResponsesConfig("[broken")).toBe(false);
  });
});
