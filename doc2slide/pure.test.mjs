/* Unit tests for pure.js — run with `node --test doc2slide/` (no browser, no deps).
   pure.js is CommonJS under Node, so the default import is its export object. */
import test from "node:test";
import assert from "node:assert/strict";
import pure from "./pure.js";

test("stripOuterFence removes a single wrapping fence", () => {
  assert.equal(pure.stripOuterFence("```markdown\n# Hi\ntext\n```"), "# Hi\ntext");
  assert.equal(pure.stripOuterFence("# Hi\ntext"), "# Hi\ntext");
});

test("stripOuterFence keeps a fence that closes an inner block", () => {
  const md = "```\nouter\n```js\ncode\n```";
  assert.equal(pure.stripOuterFence(md), md);
});

test("splitSlides splits on --- outside code fences", () => {
  const md = "# One\n\n---\n\n# Two\n\n```\n---\n```\nstill two";
  const slides = pure.splitSlides(md);
  assert.equal(slides.length, 2);
  assert.match(slides[1], /still two/);
});

test("splitSlides does not split on a setext underline", () => {
  assert.equal(pure.splitSlides("Title\n---\nbody").length, 1);
});

test("detectLang finds Polish with and without diacritics", () => {
  assert.equal(pure.detectLang("To jest krótka notatka o żółwiach."), "pl");
  assert.equal(pure.detectLang("TO JEST NOTATKA, KTORE SLOWA SA BEZ OGONKOW"), "pl");
  assert.equal(pure.detectLang("A short plain English note about turtles."), "en");
});

test("deckTitle takes the first H1", () => {
  assert.equal(pure.deckTitle("intro\n\n# My Deck\n\n# Second"), "My Deck");
  assert.equal(pure.deckTitle("no heading here"), "");
});

test("fitWithin scales down, never up, and rejects bad input", () => {
  assert.deepEqual(pure.fitWithin(2000, 1000, 1000), { width: 1000, height: 500 });
  assert.deepEqual(pure.fitWithin(300, 200, 1000), { width: 300, height: 200 });
  assert.equal(pure.fitWithin(NaN, 200, 1000), null);
});

test("clampPanelWidth clamps into [min, maxFraction × viewport]", () => {
  assert.equal(pure.clampPanelWidth(100, 240, 0.5, 1200), 240);
  assert.equal(pure.clampPanelWidth(900, 240, 0.5, 1200), 600);
  assert.equal(pure.clampPanelWidth(NaN, 240, 0.5, 1200), null);
});

test("uploadEncoding keeps PNG only for alpha", () => {
  assert.equal(pure.uploadEncoding(true).mime, "image/png");
  assert.equal(pure.uploadEncoding(false).mime, "image/jpeg");
});

test("validateModelCatalog accepts the shipped catalogue", () => {
  assert.doesNotThrow(() => pure.validateModelCatalog(pure.MODEL_CATALOG));
  assert.throws(() => pure.validateModelCatalog({}));
});
