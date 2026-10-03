"use client";

import { useRef, type ReactNode } from "react";

import { revealSelf, useMotionLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/ui";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useMotionLayoutEffect(() => {
    const animation = revealSelf(ref.current, { step: 0, y: 10, duration: 560 });
    return () => {
      animation?.revert();
    };
  }, []);

  return (
    <>
      <Breadcrumbs />
      <div
        ref={ref}
        className="mb-6 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-mono text-2xl text-foreground">
            <span aria-hidden className="mr-2 text-primary">
              &gt;
            </span>
            {title}
          </h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </>
  );
}
