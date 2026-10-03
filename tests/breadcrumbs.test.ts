import assert from "node:assert/strict";
import test from "node:test";

import { getBreadcrumbs } from "../lib/breadcrumbs";
import en from "../lib/i18n/dictionaries/en";
import es from "../lib/i18n/dictionaries/es";
import fr from "../lib/i18n/dictionaries/fr";

test("dynamic titles preserve stored content and never expose identifiers", () => {
  const title = "Collecte des déchets — secteur 05";
  const routes = [
    "/services/technical-slug",
    "/announcements/technical-slug",
    "/citizen/reports/technical-id",
    "/citizen/requests/order/technical-id",
    "/operations/security/technical-id",
    "/operations/administration/technical-id",
  ];
  for (const route of routes) {
    const items = getBreadcrumbs(route, fr, title);
    assert.equal(items.at(-1)?.label, title);
    assert(items.every((item) => !item.label.includes("technical-")));
    assert.equal(items[0].href, "/");
    assert.equal(items.at(-1)?.href, route);
    // A layout must not render a second trail without the record title.
    assert.deepEqual(getBreadcrumbs(route, fr), []);
  }
});

test("request type is not a fake parent page and creation links to its list", () => {
  assert.deepEqual(
    getBreadcrumbs("/citizen/requests/order/id", fr, "Repas").map((item) => item.href),
    ["/", "/citizen", "/citizen/requests", "/citizen/requests/order/id"],
  );
  assert.equal(getBreadcrumbs("/citizen/report", fr).at(-2)?.href, "/citizen/reports");
  assert.equal(getBreadcrumbs("/citizen/appointments/nouveau", fr).at(-2)?.href, "/citizen/appointments");
});

test("translated navigation leaves stored record titles unchanged", () => {
  const title = "BioDôme — document officiel";
  for (const dictionary of [fr, en, es]) {
    const items = getBreadcrumbs("/services/biodome", dictionary, title);
    assert.deepEqual(items.map((item) => item.label), [dictionary.nav.home, dictionary.nav.services, title]);
  }
});

test("home, authentication, redirects and unknown routes have no invented hierarchy", () => {
  for (const path of ["/", "/citizen", "/council", "/login", "/register", "/demandes", "/dev/tickets", "/unknown/id", "/services/slug/unknown"]) {
    assert.deepEqual(getBreadcrumbs(path, fr, "Unexpected title"), []);
  }
  assert.deepEqual(getBreadcrumbs("/citizen/requests/unknown/id", fr, "Unexpected title"), []);
});

test("trailing slashes preserve the same readable hierarchy", () => {
  assert.deepEqual(getBreadcrumbs("/citizen/reports/", fr), getBreadcrumbs("/citizen/reports", fr));
});
