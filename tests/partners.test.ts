import assert from "node:assert/strict";
import test from "node:test";
import { labelToMinutes, minutesToLabel, partnerAvailability } from "../lib/partners";

const at = (hours: number, minutes: number) => new Date(2026, 9, 4, hours, minutes);

test("time labels round-trip", () => {
  assert.equal(minutesToLabel(9 * 60 + 5), "09:05");
  assert.equal(labelToMinutes("09:05"), 545);
  assert.equal(labelToMinutes("24:00"), null);
  assert.equal(labelToMinutes("not a time"), null);
});

test("inside the window the partner is open", () => {
  const availability = partnerAvailability({ openMinutes: 8 * 60, closeMinutes: 18 * 60 }, at(12, 0));
  assert.equal(availability.open, true);
  assert.equal(availability.opensAt, "08:00");
  assert.equal(availability.closesAt, "18:00");
});

test("before opening and after closing the partner is unavailable", () => {
  const window = { openMinutes: 8 * 60, closeMinutes: 18 * 60 };
  assert.equal(partnerAvailability(window, at(7, 59)).open, false);
  assert.equal(partnerAvailability(window, at(18, 0)).open, false);
  assert.equal(partnerAvailability(window, at(23, 0)).open, false);
});

test("an overnight window wraps around midnight", () => {
  const window = { openMinutes: 22 * 60, closeMinutes: 6 * 60 };
  assert.equal(partnerAvailability(window, at(23, 30)).open, true);
  assert.equal(partnerAvailability(window, at(5, 0)).open, true);
  assert.equal(partnerAvailability(window, at(12, 0)).open, false);
});

test("no configured window means permanently reachable", () => {
  const availability = partnerAvailability({ openMinutes: null, closeMinutes: null }, at(3, 0));
  assert.equal(availability.open, true);
  assert.equal(availability.opensAt, null);
});
