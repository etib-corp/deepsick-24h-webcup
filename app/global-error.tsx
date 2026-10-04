"use client";

/**
 * F94 — last-resort error boundary. No provider, data layer or CSS is
 * assumed: the page ships its own inline styles and the essential contacts,
 * so the platform stays understandable even during an outage.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0B0F19",
          color: "#E5E7EB",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "34rem", width: "100%" }}>
          <p
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#F4A261",
            }}
          >
            Nova Terra · Mode dégradé
          </p>
          <h1
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "1.5rem",
              marginTop: "0.5rem",
            }}
          >
            Une erreur est survenue
          </h1>
          <p style={{ color: "#9CA3AF", marginTop: "0.5rem" }}>
            L&apos;essentiel reste accessible : consignes, contacts et informations utiles.
          </p>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
            <li>
              •{" "}
              <a href="/statut" style={{ color: "#38BDF8" }}>
                État du service &amp; contacts essentiels
              </a>
            </li>
            <li>
              •{" "}
              <a href="/announcements" style={{ color: "#38BDF8" }}>
                Annonces officielles
              </a>
            </li>
            <li>
              •{" "}
              <a href="/services" style={{ color: "#38BDF8" }}>
                Services de la colonie
              </a>
            </li>
            <li style={{ color: "#9CA3AF" }}>• Sécurité 100 · Médical 112 · Maintenance 115</li>
          </ul>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1.25rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #F4A261",
              background: "transparent",
              color: "#F4A261",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
