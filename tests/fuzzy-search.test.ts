import assert from "node:assert/strict";
import test from "node:test";
import { fuzzySearchServices, guidedServiceSearch } from "../lib/fuzzy-search";
import type { OrientationService } from "../lib/orientation";

const SERVICES: OrientationService[] = [
  {
    slug: "maintenance",
    name: "Maintenance urbaine",
    category: "Infrastructure",
    description: "Signaler un lampadaire cassé, une fuite d'eau, une voirie dégradée ou un problème de voirie.",
  },
  {
    slug: "medical",
    name: "Centre médical Asclepius",
    category: "Santé",
    description: "Consultations, urgences, vaccins et pharmacie de la colonie.",
  },
  {
    slug: "transport",
    name: "Hermes Mobility Net",
    category: "Transport",
    description: "Navettes, rovers et livraisons dans toute la colonie.",
  },
  {
    slug: "demarches",
    name: "Bureau des démarches",
    category: "Administration",
    description: "Permis, attestations, certificats, papiers officiels et documents pour votre logement.",
  },
];

test("missing accents and case do not prevent a match", () => {
  const results = fuzzySearchServices("SANTE medecin", SERVICES);
  assert.equal(results[0]?.slug, "medical");
});

test("a misspelled word still finds the service", () => {
  const results = fuzzySearchServices("eclaiage du dome", SERVICES);
  assert.ok(results.some((match) => match.slug === "maintenance"));
});

test("misspelled concept words match the orientation vocabulary, not just the text", () => {
  // "eclaiage" ≈ "eclairage", a keyword of the maintenance service that never
  // appears in its crawled text above.
  const results = fuzzySearchServices("eclaiage en panne", SERVICES);
  const maintenance = results.find((match) => match.slug === "maintenance");
  assert.ok(maintenance);
  assert.ok(maintenance.matchedTerms.includes("eclairage"));
});

test("truncated words match by prefix", () => {
  const results = fuzzySearchServices("navet", SERVICES);
  assert.equal(results[0]?.slug, "transport");
});

test("unrelated text returns no fuzzy match", () => {
  assert.deepEqual(fuzzySearchServices("xyz xyz", SERVICES), []);
});

test("guided search merges keywords and fuzzy matches, best first", () => {
  const results = guidedServiceSearch("lampadaire casse pres du dome", SERVICES);
  assert.equal(results[0]?.slug, "maintenance");
  assert.ok(results[0].terms.length > 0 || results[0].fuzzyTerms.length > 0);
});

test("a badly worded request still leads to a relevant service", () => {
  // "je veut un papier pour mon logmen" — typos everywhere.
  const results = guidedServiceSearch("je veut un papie pour mon logmen", SERVICES);
  assert.ok(results.some((match) => match.slug === "demarches"));
});

test("every result carries a reason so the UI can justify itself", () => {
  const results = guidedServiceSearch("urgence medicale", SERVICES);
  assert.ok(results.length > 0);
  for (const match of results) {
    assert.ok(["keywords", "text", "both"].includes(match.reason));
  }
});
