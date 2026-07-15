import { describe, expect, it } from "vitest";
import {
  extractCodexBaseUrl,
  extractCodexModelName,
  extractCodexWireApi,
  setCodexBaseUrl,
  setCodexModelName,
} from "./providerConfigUtils";

const config = `# user comment
model_provider = "custom"
model = "gpt-5"

[model_providers.custom]
name = "Example"
base_url = "https://api.example.com/v1"
wire_api = "responses"

[mcp_servers.local]
command = "demo"
`;

describe("Codex provider config helpers", () => {
  it("reads only the active provider section", () => {
    const input = `${config}\n[model_providers.other]\nbase_url = "https://wrong.example"\nwire_api = "chat"\n`;
    expect(extractCodexBaseUrl(input)).toBe("https://api.example.com/v1");
    expect(extractCodexWireApi(input)).toBe("responses");
    expect(extractCodexModelName(input)).toBe("gpt-5");
  });

  it("updates the active provider while preserving unrelated settings", () => {
    const output = setCodexBaseUrl(config, " https://new.example/v1 ");
    expect(extractCodexBaseUrl(output)).toBe("https://new.example/v1");
    expect(output).toContain("# user comment");
    expect(output).toContain("[mcp_servers.local]");
  });

  it("adds and removes optional values", () => {
    const withoutBaseUrl = setCodexBaseUrl(config, "");
    expect(extractCodexBaseUrl(withoutBaseUrl)).toBeUndefined();

    const withoutModel = setCodexModelName(config, "");
    expect(extractCodexModelName(withoutModel)).toBeUndefined();
    expect(
      extractCodexModelName(setCodexModelName(withoutModel, "gpt-6")),
    ).toBe("gpt-6");
  });

  it("escapes values as TOML basic strings", () => {
    const model = 'vendor\\model"preview';
    const output = setCodexModelName(config, model);
    expect(extractCodexModelName(output)).toBe(model);
  });

  it("does not invent a provider section when model_provider is absent", () => {
    expect(setCodexBaseUrl('model = "gpt-5"', "https://example.com")).toBe(
      'model = "gpt-5"',
    );
  });
});
