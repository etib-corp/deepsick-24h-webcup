import assert from "node:assert/strict";
import test from "node:test";

import { PublicError, userMessage } from "../lib/errors";
import {
  findDangerousFields,
  hasDangerousContent,
  readId,
  readText,
  sanitizePlainText,
  sanitizeUrl,
} from "../lib/sanitize";

test("plain text keeps legitimate French copy intact", () => {
  const samples = [
    "L'éclairage du Secteur 05 est en panne depuis 18:30.",
    "Signalement : « fuite d'air » au sas B — équipe HEP-02 prévenue.",
    "Première ligne\nDeuxième ligne\tcolonnes",
  ];
  for (const sample of samples) {
    const result = sanitizePlainText(sample);
    assert.equal(result.value, sample.trim());
    assert.equal(result.neutralized, false);
  }
});

test("markup and control characters are neutralised", () => {
  const markup = sanitizePlainText('Bonjour <script>alert("x")</script> colon');
  assert.equal(markup.value, 'Bonjour alert("x") colon');
  assert.equal(markup.neutralized, true);

  const control = sanitizePlainText("test\u0000\u0007");
  assert.equal(control.value, "test");
  assert.equal(control.neutralized, true);
});

test("dangerous content is detected for the audit trail", () => {
  assert.equal(hasDangerousContent('<img src=x onerror="alert(1)">'), true);
  assert.equal(hasDangerousContent("javascript:alert(1)"), true);
  assert.equal(hasDangerousContent("JaVa ScRiPt: alert(1)"), true);
  assert.equal(hasDangerousContent("Le lampadaire clignote depuis hier."), false);
  assert.deepEqual(findDangerousFields({ title: "ok", body: "<iframe src=x></iframe>" }), [
    "body",
  ]);
});

test("only relative paths and http(s) URLs are accepted for stored links", () => {
  assert.deepEqual(sanitizeUrl("/announcements"), {
    value: "/announcements",
    neutralized: false,
  });
  assert.deepEqual(sanitizeUrl("https://terranova.example/consignes"), {
    value: "https://terranova.example/consignes",
    neutralized: false,
  });
  assert.equal(sanitizeUrl("javascript:alert(1)").value, "");
  assert.equal(sanitizeUrl("javascript:alert(1)").neutralized, true);
  assert.equal(sanitizeUrl("  java\nscript:alert(1)").value, "");
  assert.equal(sanitizeUrl("//evil.example").value, "");
  assert.equal(sanitizeUrl("data:text/html,<script>").value, "");
});

test("form readers bound and sanitise values", () => {
  assert.equal(readId("clx123abc"), "clx123abc");
  assert.equal(readId("../../etc/passwd"), "");
  assert.equal(readText("  <b>Bonjour</b>  ", 40), "Bonjour");
  assert.equal(readText("abcdef", 3), "abc");
  assert.equal(readText("", 40), undefined);
});

test("only explicitly public errors surface their message", () => {
  assert.equal(
    userMessage(new PublicError("Compte déjà existant."), "Erreur générique."),
    "Compte déjà existant.",
  );
  assert.equal(
    userMessage(new Error("connect ECONNREFUSED 127.0.0.1:3306"), "Erreur générique."),
    "Erreur générique.",
  );
  assert.equal(userMessage("boom", "Erreur générique."), "Erreur générique.");
});
