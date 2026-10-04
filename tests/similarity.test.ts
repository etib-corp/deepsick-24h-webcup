import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSimilarityProfile,
  findSimilarRequests,
  similarCounts,
  similarityBetween,
  similarityTokens,
} from "../lib/similarity";

const REQUESTS = [
  {
    id: "r1",
    subject: "Lampadaire cassé rue des Silicates",
    description: "Le lampadaire devant le module HAB 12 ne s'allume plus depuis deux jours.",
    category: "Voirie",
  },
  {
    id: "r2",
    subject: "Lampadaire en panne secteur 01",
    description: "L'éclairage du lampadaire près du HAB 12 est en panne, la rue est noire.",
    category: "Voirie",
  },
  {
    id: "r3",
    subject: "Demande de permis de résidence",
    description: "Je voudrais déposer un dossier pour un permis de résidence.",
    category: "Démarches",
  },
  {
    id: "r4",
    subject: "Fuite d'eau au BioDôme",
    description: "Une conduite fuit près de l'entrée du BioDôme, l'eau monte.",
    category: "Voirie",
  },
];

test("tokens drop boilerplate, accents and plurals", () => {
  const tokens = similarityTokens("Les lampadaires sont cassés dans la rue");
  assert.ok(tokens.has("lampadaire"));
  assert.ok(tokens.has("casse"));
  assert.ok(!tokens.has("les"));
  assert.ok(!tokens.has("sont"));
});

test("requests about the same problem score high with shared words listed", () => {
  const profiles = REQUESTS.map(buildSimilarityProfile);
  const match = similarityBetween(profiles[0], profiles[1]);
  assert.ok(match.score >= 30);
  assert.ok(match.terms.includes("lampadaire"));
});

test("unrelated requests never match", () => {
  const profiles = REQUESTS.map(buildSimilarityProfile);
  const match = similarityBetween(profiles[0], profiles[2]);
  assert.equal(match.score, 0);
  assert.deepEqual(match.terms, []);
});

test("findSimilarRequests returns plausible duplicates, best first", () => {
  const profiles = REQUESTS.map(buildSimilarityProfile);
  const similar = findSimilarRequests(profiles, "r1");
  assert.equal(similar[0]?.id, "r2");
  assert.ok(!similar.some((match) => match.id === "r3"));
});

test("the threshold can be tightened and the limit bounds the list", () => {
  const profiles = REQUESTS.map(buildSimilarityProfile);
  assert.deepEqual(findSimilarRequests(profiles, "r1", { threshold: 95 }), []);
  assert.equal(findSimilarRequests(profiles, "r1", { limit: 1 }).length, 1);
});

test("similarCounts only reports requests having at least one neighbour", () => {
  const profiles = REQUESTS.map(buildSimilarityProfile);
  const counts = similarCounts(profiles);
  assert.equal(counts.get("r1"), 1);
  assert.equal(counts.has("r3"), false);
});
