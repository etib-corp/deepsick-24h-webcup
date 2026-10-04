import assert from "node:assert/strict";
import test from "node:test";

import {
  ARRIVAL_STEP_IDS,
  parseProgress,
  serializeProgress,
  toggleStep,
} from "../lib/arrivals";
import {
  identifierWhere,
  isValidUsername,
  normalizeIdentifier,
  suggestUsername,
} from "../lib/identity";
import en from "../lib/i18n/dictionaries/en";
import es from "../lib/i18n/dictionaries/es";
import fr from "../lib/i18n/dictionaries/fr";
import { buildRegisterSchema } from "../lib/validation";

/* ------------------------------------------------------------------ *
 * F71 — journeys of newly arrived residents
 * ------------------------------------------------------------------ */

/** Flattens a dictionary to `path → string` (arrays indexed), for parity checks. */
function flattenStrings(value: unknown, prefix = ""): Map<string, string> {
  if (typeof value === "string") return new Map([[prefix, value]]);
  if (Array.isArray(value)) {
    const out = new Map<string, string>();
    value.forEach((item, index) => {
      for (const [key, text] of flattenStrings(item, `${prefix}[${index}]`)) out.set(key, text);
    });
    return out;
  }
  if (value && typeof value === "object") {
    const out = new Map<string, string>();
    for (const [key, child] of Object.entries(value)) {
      for (const [path, text] of flattenStrings(child, prefix ? `${prefix}.${key}` : key)) {
        out.set(path, text);
      }
    }
    return out;
  }
  return new Map();
}

/** Technically-loaded words a new arrival should never meet on /arrivants. */
const TECH_WORDS = [
  "api",
  "jwt",
  "token",
  "oauth",
  "sso",
  "webhook",
  "cache",
  "backend",
  "frontend",
  "database",
  "serveur",
  "servidor",
  "protocole",
  "protocolo",
  "algorithme",
  "algoritmo",
  "authentification",
  "authentication",
  "autenticacion",
  "deploiement",
  "despliegue",
  "implementation",
  "implementacion",
  "base de donnees",
] as const;

function wordsIn(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

test("arrivals copy exists in the three languages, with identical keys", () => {
  const dictionaries = { fr, en, es } as const;
  const paths = Object.fromEntries(
    Object.entries(dictionaries).map(([locale, dict]) => [
      locale,
      [...flattenStrings(dict).keys()].sort(),
    ]),
  ) as Record<keyof typeof dictionaries, string[]>;

  for (const locale of ["en", "es"] as const) {
    assert.deepEqual(paths[locale], paths.fr, `${locale} must mirror the French dictionary exactly`);
  }

  const arrivals = Object.fromEntries(
    Object.entries(dictionaries).map(([locale, dict]) => [locale, flattenStrings(dict.arrivals)]),
  ) as Record<keyof typeof dictionaries, Map<string, string>>;
  assert.ok(arrivals.fr.size >= 30, "the arrivals section carries the onboarding copy");
  for (const locale of ["en", "es"] as const) {
    assert.deepEqual([...arrivals[locale].keys()].sort(), [...arrivals.fr.keys()].sort());
  }
});

test("arrivals copy stays simple: short sentences, no technical vocabulary", () => {
  for (const [locale, dict] of Object.entries({ fr, en, es })) {
    for (const [path, value] of flattenStrings(dict.arrivals)) {
      for (const sentence of value.split(/[.!?…]+/)) {
        const count = wordsIn(sentence).length;
        assert.ok(count <= 15, `${locale} ${path}: sentence too long (${count} words) — "${sentence}"`);
      }
      const padded = ` ${value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()} `;
      for (const word of TECH_WORDS) {
        assert.ok(
          !padded.includes(` ${word} `),
          `${locale} ${path}: technical word "${word}" — "${value}"`,
        );
      }
    }
  }
});

test("newcomer checklist progress survives language switches and reloads", () => {
  // Stored under one language-independent key, canonical order preserved.
  assert.equal(serializeProgress(toggleStep([], "signin")), JSON.stringify(["signin"]));
  assert.equal(
    serializeProgress(toggleStep(["account", "signin"], "signin")),
    JSON.stringify(["account"]),
  );
  assert.equal(parseProgress(serializeProgress(["help", "account"])).join(","), "account,help");

  // Broken or unknown data never throws and never invents steps.
  assert.deepEqual(parseProgress(null), []);
  assert.deepEqual(parseProgress("not-json"), []);
  assert.deepEqual(parseProgress(JSON.stringify(["unknown", 42, "account"])), ["account"]);
  assert.deepEqual(parseProgress(JSON.stringify({ done: ARRIVAL_STEP_IDS })), []);
});

test("colon identifiers are forgiving to type and unambiguous to look up", () => {
  assert.equal(normalizeIdentifier("  Élodie.Martin "), "elodie.martin");
  assert.equal(normalizeIdentifier("IRIS-NOUVELLE"), "iris-nouvelle");

  assert.ok(isValidUsername("elodie.martin"));
  assert.ok(isValidUsername("iris_02"));
  assert.ok(isValidUsername("jean-luc"));
  assert.ok(isValidUsername("ana"));
  assert.ok(!isValidUsername("ab"), "too short");
  assert.ok(!isValidUsername("2iris"), "must start with a letter");
  assert.ok(!isValidUsername("iris."), "must not end with a separator");
  assert.ok(!isValidUsername("iris m"), "no spaces");

  assert.equal(suggestUsername("Élodie Martin"), "elodie.martin");
  assert.equal(suggestUsername("  Jean-Luc  Picard "), "jean.luc.picard");
  assert.equal(suggestUsername("李 华"), "", "no usable latin characters → type your own");

  const where = identifierWhere(" Élodie.Martin ");
  assert.deepEqual(where, { OR: [{ email: "elodie.martin" }, { username: "elodie.martin" }] });
});

test("registration accepts a resident with no email address", () => {
  const schema = buildRegisterSchema({
    name: "name-error",
    identity: "identity-error",
    email: "email-error",
    username: "username-error",
    password: "password-error",
  });

  const withEmail = schema.safeParse({
    name: "Amina Okafor",
    email: "amina@terranova.fr",
    password: "password123",
  });
  assert.ok(withEmail.success, "email registration still works");

  const withIdentifier = schema.safeParse({
    name: "Iris Halden",
    username: "iris.nouvelle",
    password: "password123",
  });
  assert.ok(withIdentifier.success, "a colon identifier is enough (F71)");

  const withoutAnything = schema.safeParse({
    name: "Iris Halden",
    email: "",
    username: "",
    password: "password123",
  });
  assert.ok(!withoutAnything.success);
  assert.equal(withoutAnything.error.issues[0]?.message, "identity-error");

  const badIdentifier = schema.safeParse({
    name: "Iris Halden",
    username: "ab",
    password: "password123",
  });
  assert.ok(!badIdentifier.success);
  assert.equal(badIdentifier.error.issues[0]?.message, "username-error");

  const badEmail = schema.safeParse({
    name: "Iris Halden",
    email: "not-an-email",
    password: "password123",
  });
  assert.ok(!badEmail.success);
  assert.equal(badEmail.error.issues[0]?.message, "email-error");

  const weakPassword = schema.safeParse({
    name: "Iris Halden",
    username: "iris.nouvelle",
    password: "short",
  });
  assert.ok(!weakPassword.success);
  assert.equal(weakPassword.error.issues[0]?.message, "password-error");
});
