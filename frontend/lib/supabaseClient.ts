// frontend/lib/supabaseClient.ts
//
// Single shared Supabase client for the whole app. Uses the public
// anon key only — every privileged operation (checkout, order
// creation, webhook handling) happens in Supabase Edge Functions with
// the service role key, never in the browser.
//
// The client is created lazily on first use rather than at module
// scope so the static export can be built before the Supabase
// environment variables are configured. Any actual use without the
// variables fails fast with a clear message.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient | null = null;

/** Returns the shared Supabase client, throwing if env vars are missing. */
export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the project API Keys.",
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return cachedClient;
}

/** Whether the required Supabase env vars are present (build/runtime check). */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/** Base URL for calling Supabase Edge Functions directly via fetch. */
export function getFunctionsUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ?? `${supabaseUrl}/functions/v1`
  );
}

/**
 * Calls a Supabase Edge Function with the current user's access token
 * attached (if signed in), so the function can identify who's making
 * the request via supabase.auth.getUser().
 *
 * The response is parsed defensively: if the endpoint returns an HTML
 * page instead of JSON — which happens when the Edge Function isn't
 * deployed on the project, or NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL points
 * at a server that serves HTML — the caller gets a clear, actionable
 * error instead of the raw JSON.parse "Unexpected token '<'" crash.
 */
export async function callEdgeFunction<TResponse = unknown>(
  functionName: string,
  payload: unknown,
): Promise<TResponse> {
  const supabase = getSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = `${getFunctionsUrl()}/${functionName}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
      apikey: supabaseAnonKey as string,
    },
    body: JSON.stringify(payload),
  });

  // Read once, then decide how to report it.
  const text = await response.text();

  let data: unknown = null;
  try {
    data = JSON.parse(text);
  } catch {
    // Not JSON — almost always an HTML error page from the platform
    // (undeployed function, wrong functions URL, or a proxy in front).
    const snippet = text.trim().replace(/\s+/g, " ").slice(0, 140);
    throw new Error(
      `"${functionName}" returned an HTML page instead of JSON (HTTP ${response.status}). ` +
        `The Supabase Edge Function may not be deployed to your project, or ` +
        `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL is misconfigured. Endpoint: ${url}` +
        (snippet ? ` — response: ${snippet}` : ""),
    );
  }

  if (!response.ok) {
    const error = (data as { error?: string } | null)?.error;
    throw new Error(error ?? `Request to ${functionName} failed (HTTP ${response.status})`);
  }

  return data as TResponse;
}
