import { NextResponse } from "next/server";

/** Translate an API auth error into a JSON response. */
export function authErrorResponse(error: "unauthorized" | "forbidden") {
  return NextResponse.json(
    { error: error === "unauthorized" ? "Authentification requise." : "Accès refusé." },
    { status: error === "unauthorized" ? 401 : 403 },
  );
}

/**
 * Generic failure for route handlers. The technical error stays in the server
 * logs — never in the response — so a failure cannot leak internals.
 */
export function serverErrorResponse(context: string, error?: unknown) {
  console.error(`[api] ${context}`, error);
  return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 });
}
