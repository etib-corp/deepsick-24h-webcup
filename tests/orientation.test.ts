import assert from "node:assert/strict";
import test from "node:test";
import { orientServices, type OrientationService } from "../lib/orientation";

const SERVICES: OrientationService[] = [
  {
    slug: "securite",
    name: "Sécurité publique",
    category: "Protection",
    description: "Ares Security Command veille sur les secteurs : signalements, escorte et interventions.",
  },
  {
    slug: "medical",
    name: "Soins médicaux",
    category: "Santé",
    description: "Triage des urgences, soins courants et accès aux modules médicaux.",
  },
  {
    slug: "maintenance",
    name: "Infrastructure",
    category: "Technique",
    description: "Recyclage d'air, énergie, eau et propreté des modules.",
  },
  {
    slug: "transport",
    name: "Transport & logistique",
    category: "Mobilité",
    description: "Navettes, rovers et fret entre les secteurs.",
  },
  {
    slug: "commerce",
    name: "Commerce & restauration",
    category: "Vie quotidienne",
    description: "Cantines et fournisseurs : commandes et livraisons.",
  },
  {
    slug: "demarches",
    name: "Démarches administratives",
    category: "Administration",
    description: "Permis, autorisations et documents officiels.",
  },
];

test("a broken streetlight is routed to infrastructure", () => {
  const [first] = orientServices("Un lampadaire est cassé dans ma rue", SERVICES);
  assert.equal(first?.slug, "maintenance");
});

test("a medical need is routed to health services", () => {
  const [first] = orientServices("Je cherche un médecin pour mon enfant malade", SERVICES);
  assert.equal(first?.slug, "medical");
});

test("an administrative request is routed to the paperwork desk", () => {
  const [first] = orientServices("Je voudrais une attestation de résidence", SERVICES);
  assert.equal(first?.slug, "demarches");
});

test("sending a parcel is routed to transport", () => {
  const [first] = orientServices("Je veux envoyer un colis à un autre secteur", SERVICES);
  assert.equal(first?.slug, "transport");
});

test("an unrelated description matches nothing", () => {
  assert.deepEqual(orientServices("zzzz qqqq", SERVICES), []);
});

test("a too-short description returns no match", () => {
  assert.deepEqual(orientServices("ab", SERVICES), []);
});
