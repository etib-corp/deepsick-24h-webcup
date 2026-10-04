import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPublishedProjects } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import type { ProjectStatus } from "@/lib/roles";

export const dynamic = "force-dynamic";

const STATUS_TONES: Record<ProjectStatus, "info" | "mars" | "success"> = {
  PLANNED: "info",
  IN_PROGRESS: "mars",
  COMPLETED: "success",
};

export function generateMetadata(): Metadata {
  return { title: getDictionary().publicPages.projects.title };
}

/** F67 — public directory of the projects underway in Nova Terra. */
export default async function ProjectsPage() {
  const t = getDictionary();
  const projects = await getPublishedProjects();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title={t.publicPages.projects.title}
        description={t.publicPages.projects.subtitle}
      />

      {projects.length === 0 ? (
        <EmptyState
          title={t.publicPages.projects.empty}
          description={t.publicPages.projects.emptyHint}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.slug}`} className="block">
              <Card className="h-full p-4 transition hover:border-primary/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone={STATUS_TONES[project.status as ProjectStatus] ?? "neutral"}>
                    {t.publicPages.projects.status[project.status as ProjectStatus]}
                  </Badge>
                  {project.sector ? (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {project.sector}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 font-mono text-sm text-foreground">{project.title}</h2>
                {project.summary ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {project.summary}
                  </p>
                ) : null}
                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {format(t.publicPages.projects.progressLabel, { percent: project.progress })}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
