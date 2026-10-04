import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getProjectBySlug } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import type { ProjectStatus } from "@/lib/roles";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

const STATUS_TONES: Record<ProjectStatus, "info" | "mars" | "success"> = {
  PLANNED: "info",
  IN_PROGRESS: "mars",
  COMPLETED: "success",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  return { title: project?.title ?? getDictionary().publicPages.projects.title };
}

export default async function ProjectDetailPage({ params }: Params) {
  const t = getDictionary();
  const project = await getProjectBySlug(params.slug);
  if (!project || !project.published) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs currentLabel={project.title} />
      <Link href="/projects" className="text-sm text-primary hover:underline">
        {t.publicPages.projects.backAll}
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONES[project.status as ProjectStatus] ?? "neutral"}>
            {t.publicPages.projects.status[project.status as ProjectStatus]}
          </Badge>
          {project.sector ? (
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {project.sector}
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 font-mono text-3xl text-foreground">{project.title}</h1>
        {project.summary ? (
          <p className="mt-3 text-lg text-muted-foreground">{project.summary}</p>
        ) : null}
      </header>

      <div className="mt-6">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          {format(t.publicPages.projects.progressLabel, { percent: project.progress })}
        </p>
      </div>

      <div className="mt-8 whitespace-pre-line leading-relaxed text-muted-foreground">
        {project.description}
      </div>

      {project.startsAt || project.endsAt ? (
        <Card className="mt-6 space-y-1 p-4 text-sm text-muted-foreground">
          {project.startsAt ? (
            <p>
              <span className="font-mono text-[10px] uppercase tracking-wide">
                {t.publicPages.projects.start}
              </span>{" "}
              · {formatDate(project.startsAt)}
            </p>
          ) : null}
          {project.endsAt ? (
            <p>
              <span className="font-mono text-[10px] uppercase tracking-wide">
                {t.publicPages.projects.end}
              </span>{" "}
              · {formatDate(project.endsAt)}
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
