"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { format } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/client";
import {
  orientServices,
  type OrientationMatch,
  type OrientationService,
} from "@/lib/orientation";

/**
 * F92 — "describe your problem, we point you to the right service". The
 * matching itself is a pure function (`lib/orientation.ts`), so the result is
 * instant, deterministic and explainable.
 */
export function ServiceFinder({ services }: { services: OrientationService[] }) {
  const t = useT();
  const copy = t.publicPages.services.orientation;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrientationMatch[] | null>(null);

  function search(value: string) {
    setQuery(value);
    setResults(value.trim().length >= 3 ? orientServices(value, services) : null);
  }

  return (
    <Card className="mb-6 p-4" data-tour="service-finder">
      <h2 className="font-mono text-sm text-foreground">{copy.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          search(query);
        }}
      >
        <label className="sr-only" htmlFor="service-finder-query">
          {copy.label}
        </label>
        <input
          id="service-finder-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.placeholder}
          autoComplete="off"
          className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60"
        />
        <button type="submit" className={buttonClasses("primary", "md")}>
          {copy.submit}
        </button>
      </form>

      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>{copy.examplesLabel}</span>
        {copy.examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => search(example)}
            className="rounded-full border border-border px-2 py-0.5 transition hover:border-primary/40 hover:text-foreground"
          >
            {example}
          </button>
        ))}
      </p>

      <div aria-live="polite" className="mt-3">
        {results !== null &&
          (results.length > 0 ? (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                {copy.results}
              </p>
              <ul className="mt-2 space-y-2">
                {results.map((match) => (
                  <li key={match.slug}>
                    <Link
                      href={`/services/${match.slug}`}
                      className="block rounded-md border border-border p-3 transition hover:border-primary/40"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-foreground">{match.name}</span>
                        {match.category ? (
                          <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                            {match.category}
                          </span>
                        ) : null}
                      </span>
                      {match.terms.length > 0 ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {format(copy.why, { terms: match.terms.join(", ") })}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>{copy.none}</p>
              <p className="mt-1">
                {copy.noneHint}{" "}
                <Link
                  href="/contact"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {copy.contact}
                </Link>
              </p>
            </div>
          ))}
      </div>
    </Card>
  );
}
