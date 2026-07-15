// Curated icon catalog for SwitchForge's two supported clients and core tools.
// Keeping this map inline prevents retired provider logos and promotional image
// assets from being bundled into the application.

export const icons: Record<string, string> = {
  anthropic: `<svg fill="currentColor" fill-rule="evenodd" height="1em" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Anthropic</title><path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"/></svg>`,
  claude: `<svg fill="currentColor" height="1em" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M12 2.5 14.2 9l6.3-2.4-4.1 5.4 5.1 4.3-6.7-.4L14 22l-3.1-5.9-6 3 2.7-6.2L2.5 8.7l6.7.4L12 2.5Z"/></svg>`,
  openai: `<svg fill="none" height="1em" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>OpenAI</title><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2"/><path d="m8.2 8.8 3.8-2.2 3.8 2.2v4.4L12 15.4l-3.8-2.2V8.8Zm0 4.4v4.4l3.8 2.2 3.8-2.2v-4.4" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"/></svg>`,
  codex: `<svg fill="none" height="1em" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Codex</title><path d="m9 7-5 5 5 5M15 7l5 5-5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="m13.5 4-3 16" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>`,
  mcp: `<svg fill="none" height="1em" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>MCP</title><path d="M8.5 12.5 13 8a3 3 0 0 1 4.2 4.2l-6.4 6.4a4 4 0 0 1-5.6-5.6l6.4-6.4" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>`,
  github: `<svg fill="currentColor" height="1em" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 7.01c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.56 4.94.36.31.68.92.68 1.86V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>`,
  generic: `<svg fill="none" height="1em" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Provider</title><path d="M12 3 4.5 7.5 12 12l7.5-4.5L12 3Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/><path d="m4.5 12 7.5 4.5 7.5-4.5M4.5 16.5 12 21l7.5-4.5" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/></svg>`,
};

export const iconUrls: Record<string, string> = {};
export const iconList = Object.keys(icons).sort();

export function getIcon(name: string): string {
  return icons[name.toLowerCase()] || "";
}

export function getIconUrl(_name: string): string {
  return "";
}

export function hasIcon(name: string): boolean {
  return name.toLowerCase() in icons;
}

export function isUrlIcon(_name: string): boolean {
  return false;
}

export { getIconMetadata } from "./metadata";
