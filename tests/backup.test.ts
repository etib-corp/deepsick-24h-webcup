import assert from "node:assert/strict";
import test from "node:test";
import { canonicalJson, checksumOf, verifyBackup, verifyDataset } from "../lib/backup";

test("canonical JSON sorts keys recursively and keeps arrays ordered", () => {
  const json = canonicalJson({ b: 1, a: { d: 2, c: [3, 1] } });
  assert.equal(json, '{"a":{"c":[3,1],"d":2},"b":1}');
});

test("checksums are stable for equal structures built in a different order", () => {
  const a = checksumOf(canonicalJson({ x: 1, y: [1, 2] }));
  const b = checksumOf(canonicalJson({ y: [1, 2], x: 1 }));
  assert.equal(a, b);
});

test("a dataset verifies when its serialisation round-trips", () => {
  const report = verifyDataset("requests", [{ id: "a", status: "OPEN" }]);
  assert.equal(report.ok, true);
  assert.equal(report.rows, 1);
  assert.ok(report.bytes > 0);
});

test("the drill aggregates rows, bytes and the overall verdict", () => {
  const result = verifyBackup([
    { key: "users", rows: [{ id: "u1" }, { id: "u2" }] },
    { key: "requests", rows: [{ id: "r1" }] },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.totalRows, 3);
  assert.ok(result.totalBytes > 0);
  assert.equal(result.datasets.length, 2);
});

test("an empty drill fails loudly instead of pretending to pass", () => {
  const result = verifyBackup([{ key: "users", rows: [] }]);
  assert.equal(result.ok, false);
});

test("dates are serialised deterministically", () => {
  const when = new Date("2026-10-04T12:00:00Z");
  assert.equal(canonicalJson({ when }), '{"when":"2026-10-04T12:00:00.000Z"}');
});
