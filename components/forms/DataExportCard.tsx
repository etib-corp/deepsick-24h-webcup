"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/client";

export type DataExportSectionSummary = { key: string; label: string; count: number };

export function DataExportCard({ sections }: { sections: DataExportSectionSummary[] }) {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function download() {
    setPending(true);
    setError(false);
    try {
      const response = await fetch("/api/citizen/data-export", { cache: "no-store" });
      if (!response.ok) throw new Error("export_failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nova-terra-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {t.citizen.account.export.title}
      </p>
      <p className="text-sm text-muted-foreground">{t.citizen.account.export.description}</p>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {t.citizen.account.export.contents}
        </p>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {sections.map((section) => (
            <li key={section.key}>
              {section.label}: <span className="font-mono text-foreground">{section.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {error ? (
        <Alert tone="error">
          {t.citizen.account.export.failed}{" "}
          <button type="button" onClick={download} className="underline">
            {t.citizen.account.export.retry}
          </button>
        </Alert>
      ) : null}

      <Button type="button" onClick={download} disabled={pending}>
        {pending ? t.citizen.account.export.pending : t.citizen.account.export.download}
      </Button>
    </Card>
  );
}
