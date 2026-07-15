import { invoke } from "@tauri-apps/api/core";
import type { AppId } from "./types";

export type ConnectivityStatus = "operational" | "degraded" | "failed";

export interface ConnectivityCheckConfig {
  timeoutSecs: number;
  maxRetries: number;
  degradedThresholdMs: number;
}

export interface ConnectivityCheckResult {
  status: ConnectivityStatus;
  success: boolean;
  message: string;
  responseTimeMs?: number;
  httpStatus?: number;
  testedAt: number;
  retryCount: number;
}

/**
 * Probe the provider base URL without sending a model request.
 *
 * The Rust command keeps its legacy internal name until the backend module is
 * replaced; this frontend API deliberately exposes only connectivity semantics.
 */
export async function checkProviderConnectivity(
  appType: AppId,
  providerId: string,
): Promise<ConnectivityCheckResult> {
  return invoke("stream_check_provider", { appType, providerId });
}

export async function getConnectivityCheckConfig(): Promise<ConnectivityCheckConfig> {
  return invoke("get_stream_check_config");
}

export async function saveConnectivityCheckConfig(
  config: ConnectivityCheckConfig,
): Promise<void> {
  return invoke("save_stream_check_config", { config });
}
