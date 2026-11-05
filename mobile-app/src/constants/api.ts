// Supermarket API Configuration & Safe Fetch Helper

const DEFAULT_SERVER_URL = "http://192.168.1.36:5001/api";

const RAW_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_SERVER_URL;

// Guarantee port 5001 even if Metro bundler cached the old port 5000
export const API_URL = RAW_URL.replace(":5000", ":5001");

/**
 * Resilient fetch with AbortController timeout to prevent UI freeze
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 6000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

