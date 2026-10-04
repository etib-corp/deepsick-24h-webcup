import assert from "node:assert/strict";
import test from "node:test";

import {
  createFormToken,
  isHoneypotFilled,
  MIN_FILL_MS,
  readFormToken,
  TOKEN_TTL_MS,
} from "../lib/bot-signals";

const SECRET = "test-secret";
const NOW = 1_800_000_000_000;

test("a fresh challenge round-trips for its own form", () => {
  const token = createFormToken("contact", { secret: SECRET, now: NOW, nonce: "abc123" });
  const verdict = readFormToken(token, "contact", { secret: SECRET, now: NOW + 5_000 });
  assert.equal(verdict.ok, true);
  if (!verdict.ok) return;
  assert.equal(verdict.token.nonce, "abc123");
  assert.equal(verdict.token.kind, "contact");
  assert.equal(verdict.token.issuedAt, NOW);
});

test("tampered, re-signed or foreign challenges are refused", () => {
  const token = createFormToken("contact", { secret: SECRET, now: NOW });

  // Signed with another key (forged client-side).
  assert.deepEqual(readFormToken(token, "contact", { secret: "other", now: NOW + 5_000 }), {
    ok: false,
    reason: "token",
  });

  // Flipped signature characters.
  const flipped = token.slice(0, -2) + "xx";
  assert.equal(readFormToken(flipped, "contact", { secret: SECRET, now: NOW + 5_000 }).ok, false);

  // Valid signature but replayed on another form.
  assert.equal(readFormToken(token, "register", { secret: SECRET, now: NOW + 5_000 }).ok, false);

  // Garbage input.
  assert.equal(readFormToken("not-a-token", "contact", { secret: SECRET, now: NOW + 5_000 }).ok, false);
  assert.equal(readFormToken(undefined, "contact", { secret: SECRET, now: NOW + 5_000 }).ok, false);

  // Back-dated timestamp inside the payload invalidates the signature.
  const forged = token.replace(String(NOW), String(NOW - 60_000));
  assert.equal(readFormToken(forged, "contact", { secret: SECRET, now: NOW + 5_000 }).ok, false);
});

test("millisecond submissions are flagged, expired pages are refused", () => {
  const token = createFormToken("login", { secret: SECRET, now: NOW });

  const tooFast = readFormToken(token, "login", { secret: SECRET, now: NOW + 10 });
  assert.equal(tooFast.ok, false);
  if (!tooFast.ok && tooFast.reason === "tooFast") {
    // The refused challenge still carries its nonce so it can be burned.
    assert.match(tooFast.token.nonce, /^[\w-]+$/);
  } else {
    assert.fail("expected a tooFast verdict");
  }

  const accepted = readFormToken(token, "login", { secret: SECRET, now: NOW + MIN_FILL_MS });
  assert.equal(accepted.ok, true);

  const expired = readFormToken(token, "login", {
    secret: SECRET,
    now: NOW + TOKEN_TTL_MS + 1,
  });
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.equal(expired.reason, "expired");

  // Far-future timestamps are forged, not "fresh".
  const future = createFormToken("login", { secret: SECRET, now: NOW + 10 * 60_000 });
  assert.equal(readFormToken(future, "login", { secret: SECRET, now: NOW }).ok, false);
});

test("only a filled honeypot counts as automated input", () => {
  assert.equal(isHoneypotFilled(""), false);
  assert.equal(isHoneypotFilled("   "), false);
  assert.equal(isHoneypotFilled(undefined), false);
  assert.equal(isHoneypotFilled(null), false);
  assert.equal(isHoneypotFilled("https://spam.example"), true);
});
