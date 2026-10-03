import { getDictionary } from "@/lib/i18n/server";
import { SkipLink } from "@/components/layout/SkipLink";
import { ColonyScene } from "@/components/colony/ColonyScene";
import { Logo } from "@/components/layout/Logo";
import { Reveal } from "@/components/motion/Reveal";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = getDictionary();
  return (
    <>
      <SkipLink label={t.accessibility.skipToContent} />
      <main id="main-content" tabIndex={-1} className="grid min-h-screen lg:grid-cols-[1fr,1.1fr]">
        <div className="relative hidden border-r border-border lg:block">
          <ColonyScene className="absolute inset-0" />
          <Reveal self className="relative flex h-full flex-col justify-between p-8">
            <Logo tone="scene" />
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-scene-muted">
              Mars Civic OS · 01
            </div>
          </Reveal>
        </div>

        <div className="flex items-center justify-center px-4 py-12">
          <Reveal self delay={120} className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <Logo />
            </div>
            {children}
          </Reveal>
        </div>
      </main>
    </>
  );
}
