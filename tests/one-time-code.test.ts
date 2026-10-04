import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCESS_CODE_MAX_ATTEMPTS,
  accessCodeExpired,
  accessCodeMatches,
  accessCodeUsable,
  generateAccessCode,
  hashAccessCode,
  isTransmissionSimulation,
} from "../lib/one-time-code";

test("generated codes are six digits", () => {
  for (let index = 0; index < 200; index += 1) {
    assert.match(generateAccessCode(), /^\d{6}$/);
  }
});

test("hashing is deterministic per secret and changes with the secret", () => {
  const left = hashAccessCode("123456", "secret-a");
  assert.equal(left, hashAccessCode("123456", "secret-a"));
  assert.notEqual(left, hashAccessCode("123456", "secret-b"));
});

test("code comparison accepts only the matching code", () => {
  const stored = hashAccessCode("424242", "secret-a");
  assert.equal(accessCodeMatches("424242", stored, "secret-a"), true);
  assert.equal(accessCodeMatches("424243", stored, "secret-a"), false);
  assert.equal(accessCodeMatches("424242", stored, "secret-b"), false);
  // Malformed stored hash never matches and never throws.
  assert.equal(accessCodeMatches("424242", "zz", "secret-a"), false);
});

test("expiry follows the stored deadline", () => {
  const now = new Date("2026-10-04T12:00:00Z");
  assert.equal(accessCodeExpired(new Date("2026-10-04T11:59:59Z"), now), true);
  assert.equal(accessCodeExpired(new Date("2026-10-04T12:05:00Z"), now), false);
});

test("a code row is usable only while fresh, unconsumed and under the attempt cap", () => {
  const now = new Date("2026-10-04T12:00:00Z");
  const base = { consumedAt: null, expiresAt: new Date("2026-10-04T12:05:00Z"), attempts: 0 };
  assert.equal(accessCodeUsable(base, now), true);
  assert.equal(accessCodeUsable({ ...base, consumedAt: now }, now), false);
  assert.equal(accessCodeUsable({ ...base, expiresAt: new Date("2026-10-04T11:00:00Z") }, now), false);
  assert.equal(accessCodeUsable({ ...base, attempts: ACCESS_CODE_MAX_ATTEMPTS }, now), false);
});

test("the transmission simulation defaults on and turns off explicitly", () => {
  const previous = process.env.SIMULATED_TRANSMISSIONS;
  try {
    delete process.env.SIMULATED_TRANSMISSIONS;
    assert.equal(isTransmissionSimulation(), true);
    process.env.SIMULATED_TRANSMISSIONS = "on";
    assert.equal(isTransmissionSimulation(), true);
    process.env.SIMULATED_TRANSMISSIONS = "off";
    assert.equal(isTransmissionSimulation(), false);
  } finally {
    if (previous === undefined) delete process.env.SIMULATED_TRANSMISSIONS;
    else process.env.SIMULATED_TRANSMISSIONS = previous;
  }
});
