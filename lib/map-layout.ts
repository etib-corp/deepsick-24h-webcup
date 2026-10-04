import { COLONY_SECTORS } from "@/lib/roles";

export type MapPoint = { x: number; y: number; sector: string };

/** Normalised position (0..1) on the stylised colony map. */
export type MapService = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string | null;
  icon: string | null;
  sector: string | null;
  featured: boolean;
  published: boolean;
  /** Opening hours shown to residents (F74). */
  openingHours: string | null;
  x: number;
  y: number;
  /** True when the service has a real spot on the artwork. */
  mapped: boolean;
};

type ServiceInput = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string | null;
  icon: string | null;
  featured?: boolean | null;
  published?: boolean | null;
  mapX?: number | null;
  mapY?: number | null;
  sector?: string | null;
  openingHours?: string | null;
};

/** Deterministic fallback anchors, one per colony sector. */
const FALLBACKS: MapPoint[] = [
  { x: 0.28, y: 0.66, sector: COLONY_SECTORS[0] },
  { x: 0.3, y: 0.28, sector: COLONY_SECTORS[1] },
  { x: 0.5, y: 0.52, sector: COLONY_SECTORS[2] },
  { x: 0.72, y: 0.3, sector: COLONY_SECTORS[3] },
  { x: 0.7, y: 0.72, sector: COLONY_SECTORS[4] },
];

/** Stored coordinates when present, otherwise a stable fallback per index. */
export function positionFor(service: ServiceInput, index: number): MapPoint {
  const fallback = FALLBACKS[index % FALLBACKS.length];
  return {
    x: service.mapX ?? fallback.x,
    y: service.mapY ?? fallback.y,
    sector: service.sector ?? fallback.sector,
  };
}

/** Serialisable DTO for the client map/list views (no `Date` fields). */
export function buildMapServices(services: ServiceInput[]): MapService[] {
  // If nothing has coordinates, fall back to rendering everything on the map.
  const anyCoords = services.some((s) => s.mapX != null && s.mapY != null);

  return services.map((service, index) => {
    const { x, y, sector } = positionFor(service, index);
    const hasCoords = service.mapX != null && service.mapY != null;
    return {
      id: service.id,
      slug: service.slug,
      name: service.name,
      description: service.description,
      category: service.category,
      icon: service.icon,
      sector,
      featured: service.featured ?? false,
      published: service.published ?? true,
      openingHours: service.openingHours ?? null,
      x,
      y,
      mapped: anyCoords ? hasCoords : true,
    };
  });
}
