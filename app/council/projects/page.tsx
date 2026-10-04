import type { Metadata } from "next";

import { ProjectForm } from "@/components/colony/ProjectForm";
import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import {
  deleteProjectAction,
  setProjectStatusAction,
  toggleProjectAction,
} from "@/lib/actions/projects";
import { getAllProjects } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.projects.title };
}

export default async function CouncilProjectsPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const projects = await getAllProjects();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.council.projects.title}</h1>
        <p className="text-sm text-muted-foreground">{t.council.projects.subtitle}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr,1.3fr]">
        <Card className="p-4">
          <SectionHeader title={t.council.projects.new} />
          <ProjectForm />
        </Card>

        <section>
          <SectionHeader
            title={t.council.projects.list}
            badge={
              <span className="font-mono text-[11px] text-muted-foreground">
                {projects.length}
              </span>
            }
          />
          <div className="space-y-2">
            {projects.map((project) => (
              <Card key={project.id} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FeedRow
                    className="flex-1 border-0 bg-transparent p-0"
                    title={project.title}
                    meta={format(t.council.projects.progressMeta, { percent: project.progress })}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        project.status === "COMPLETED"
                          ? "success"
                          : project.status === "IN_PROGRESS"
                            ? "mars"
                            : "info"
                      }
                    >
                      {t.council.projects.statusOptions[project.status as ProjectStatus]}
                    </Badge>
                    <Badge tone={project.published ? "success" : "neutral"}>
                      {project.published
                        ? t.council.projects.published
                        : t.council.projects.draft}
                    </Badge>
                    <form action={toggleProjectAction}>
                      <input type="hidden" name="id" value={project.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={project.published ? "false" : "true"}
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        {project.published
                          ? t.council.projects.unpublish
                          : t.council.projects.publish}
                      </Button>
                    </form>
                    <form action={setProjectStatusAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={project.id} />
                      <Select name="status" defaultValue={project.status} className="h-8 text-xs">
                        {PROJECT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {t.council.projects.statusOptions[status]}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" variant="secondary" size="sm">
                        {t.council.projects.update}
                      </Button>
                    </form>
                    <form action={deleteProjectAction}>
                      <input type="hidden" name="id" value={project.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {t.council.projects.delete}
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
