/**
 * Profiles used by the in-app user guide (`/guide`).
 *
 * Only the language-independent facts live here — routes, demo accounts and
 * icons. Every word the visitor reads comes from `t.guide.profiles[id]`, so the
 * walkthroughs stay in sync across the three locales.
 */
import type { Role } from "@/lib/roles";

export const GUIDE_PROFILE_IDS = [
  "VISITOR",
  "CITIZEN",
  "SECURITY",
  "MEDIC",
  "MAINTENANCE",
  "DRIVER",
  "MERCHANT",
  "ADMIN_AGENT",
  "COUNCIL",
] as const;

export type GuideProfileId = (typeof GUIDE_PROFILE_IDS)[number];

export type GuideProfile = {
  id: GuideProfileId;
  /** Landing page / workspace the profile works in. */
  href: string;
  /** Seeded demo account, when the profile needs one. */
  account?: string;
  /** Auth role behind the profile (profiles mirror the role ids). */
  role?: Role;
  icon: string;
};

export const GUIDE_PROFILES: readonly GuideProfile[] = [
  { id: "VISITOR", href: "/register", icon: "🧭" },
  { id: "CITIZEN", href: "/citizen", account: "citoyen@terranova.fr", role: "CITIZEN", icon: "🏠" },
  {
    id: "SECURITY",
    href: "/operations/security",
    account: "securite@terranova.fr",
    role: "SECURITY",
    icon: "🛡️",
  },
  {
    id: "MEDIC",
    href: "/operations/medical",
    account: "medical@terranova.fr",
    role: "MEDIC",
    icon: "✚",
  },
  {
    id: "MAINTENANCE",
    href: "/operations/maintenance",
    account: "maintenance@terranova.fr",
    role: "MAINTENANCE",
    icon: "🛠️",
  },
  {
    id: "DRIVER",
    href: "/operations/transport",
    account: "transport@terranova.fr",
    role: "DRIVER",
    icon: "🚡",
  },
  {
    id: "MERCHANT",
    href: "/operations/commerce",
    account: "commerce@terranova.fr",
    role: "MERCHANT",
    icon: "🍜",
  },
  {
    id: "ADMIN_AGENT",
    href: "/operations/administration",
    account: "administration@terranova.fr",
    role: "ADMIN_AGENT",
    icon: "📄",
  },
  { id: "COUNCIL", href: "/council", account: "conseil@terranova.fr", role: "COUNCIL", icon: "🛰️" },
];

export function isGuideProfileId(value: unknown): value is GuideProfileId {
  return (
    typeof value === "string" && (GUIDE_PROFILE_IDS as readonly string[]).includes(value)
  );
}

export function getGuideProfile(id: GuideProfileId): GuideProfile {
  return GUIDE_PROFILES.find((profile) => profile.id === id) ?? GUIDE_PROFILES[0];
}
