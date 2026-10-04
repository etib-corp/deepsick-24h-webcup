import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_DISMISSED_BROADCASTS,
  dismissBroadcast,
  parseDismissedBroadcasts,
  serializeDismissedBroadcasts,
} from "../lib/broadcast-dismissals";

test("broken or unknown stored data is ignored", () => {
  assert.deepEqual(parseDismissedBroadcasts(null), []);
  assert.deepEqual(parseDismissedBroadcasts(""), []);
  assert.deepEqual(parseDismissedBroadcasts("not json"), []);
  assert.deepEqual(parseDismissedBroadcasts('{"a":1}'), []);
  assert.deepEqual(parseDismissedBroadcasts('[1, "", "ok"]'), ["ok"]);
});

test("dismissing adds an id exactly once", () => {
  const first = dismissBroadcast([], "b1");
  assert.deepEqual(first, ["b1"]);
  assert.deepEqual(dismissBroadcast(first, "b1"), ["b1"]);
  assert.deepEqual(dismissBroadcast(first, "b2"), ["b1", "b2"]);
});

test("serialisation round-trips and drops duplicates", () => {
  const stored = serializeDismissedBroadcasts(["b1", "b1", "b2"]);
  assert.deepEqual(parseDismissedBroadcasts(stored), ["b1", "b2"]);
});

test("the stored list is capped to the most recent dismissals", () => {
  const ids = Array.from({ length: MAX_DISMISSED_BROADCASTS + 10 }, (_, index) => `b${index}`);
  const trimmed = dismissBroadcast(ids, "latest");
  assert.equal(trimmed.length, MAX_DISMISSED_BROADCASTS);
  assert.equal(trimmed.at(-1), "latest");
  assert.equal(trimmed.includes("b0"), false);
});
