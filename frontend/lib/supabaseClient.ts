// frontend/lib/supabaseClient.ts
//
// Single shared Supabase client for the whole app. Uses the public
// anon key only — every privileged operation (checkout, order
// creation, webhook handling) happens in Supabase Edge Functions with
// the service role key, never in the browser.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.local.example to .env.local and fill in your Supabase project values.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Base URL for calling Supabase Edge Functions directly via fetch. */
export const functionsUrl =
  process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ?? `${supabaseUrl}/functions/v1`;

/**
 * Calls a Supabase Edge Function with the current user's access token
 * attached (if signed in), so the function can identify who's making
 * the request via supabase.auth.getUser().
 */
export async function callEdgeFunction<TResponse = unknown>(
  functionName: string,
  payload: unknown,
): Promise<TResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${functionsUrl}/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
      apikey: supabaseAnonKey as string,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? `Request to ${functionName} failed`);
  }

  return data as TResponse;
}
