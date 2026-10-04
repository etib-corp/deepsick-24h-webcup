/**
 * F36 — municipal transport (Hermes Mobility Net) schedules.
 *
 * Static, deterministic data: the colony shuttle lines, their stops and
 * frequencies. `nextDepartures` turns a line into its next departure times
 * from any reference moment, so the public page always shows live "next
 * shuttle" information without a database round-trip.
 */

export type TransitLine = {
  id: string;
  name: string;
  service: string;
  /** Minutes since midnight. */
  firstDeparture: number;
  /** Minutes since midnight. */
  lastDeparture: number;
  frequencyMinutes: number;
  stops: string[];
};

export const TRANSIT_LINES: readonly TransitLine[] = [
  {
    id: "navette-a",
    name: "Navette A — Boucle habitat",
    service: "Hermes Mobility Net",
    firstDeparture: 6 * 60,
    lastDeparture: 22 * 60,
    frequencyMinutes: 15,
    stops: [
      "Secteur 01 · Habitat",
      "Centre civique",
      "Secteur 02 · BioDôme",
      "Secteur 01 · Habitat",
    ],
  },
  {
    id: "navette-b",
    name: "Navette B — Ligne industrie",
    service: "Hermes Mobility Net",
    firstDeparture: 5 * 60 + 30,
    lastDeparture: 21 * 60 + 30,
    frequencyMinutes: 20,
    stops: [
      "Secteur 05 · Industrie",
      "Secteur 03 · Planitia",
      "Secteur 05 · Industrie",
    ],
  },
  {
    id: "navette-c",
    name: "Navette C — Rempart & médical",
    service: "Hermes Mobility Net",
    firstDeparture: 6 * 60 + 30,
    lastDeparture: 23 * 60,
    frequencyMinutes: 30,
    stops: [
      "Secteur 04 · Rempart",
      "Secteur 02 · BioDôme",
      "Secteur 04 · Rempart",
    ],
  },
];

function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** True while the line is between its first and last departure. */
export function isLineRunning(line: TransitLine, from: Date = new Date()): boolean {
  const now = from.getHours() * 60 + from.getMinutes();
  return now >= line.firstDeparture && now <= line.lastDeparture;
}

/**
 * Next `count` departure times ("HH:MM") at or after `from`. Returns an empty
 * array once the line has stopped for the day.
 */
export function nextDepartures(
  line: TransitLine,
  count = 3,
  from: Date = new Date(),
): string[] {
  const now = from.getHours() * 60 + from.getMinutes();
  const start = Math.max(
    line.firstDeparture,
    Math.ceil((now + 1) / line.frequencyMinutes) * line.frequencyMinutes,
  );

  const departures: string[] = [];
  for (
    let time = start;
    time <= line.lastDeparture && departures.length < count;
    time += line.frequencyMinutes
  ) {
    departures.push(formatMinutes(time));
  }
  return departures;
}
