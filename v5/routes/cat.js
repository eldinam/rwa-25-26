var express = require("express");
var router = express.Router();
const catFacts = require("cat-facts");

const MAX = 50;

function getOne() {
  const r = catFacts.random();
  let text;

  if (Array.isArray(r)) {
    // r je niz — npr. [{ text: "mjau" }] ili ["mjau"]
    if (r[0] && r[0].text) {
      text = r[0].text;
    } else {
      text = r[0];
    }
  } else {
    // r je objekat ili string — npr. { text: "mjau" } ili "mjau"
    if (r && r.text) {
      text = r.text;
    } else {
      text = r;
    }
  }

  return { text: String(text) };
}

function buildPayload(route, data) {
  return {
    ok: true,
    route: route,
    source: "cat-facts",
    count: data.length,
    data: data,
    timestamp: new Date().toISOString(),
  };
}

/* GET /cat */
router.get("/", function (req, res, next) {
  const payload = buildPayload("/cat", [getOne()]);

  if (req.query.json === "1") return res.json(payload);

  res.render("facts-view", {
    title: "CAT FACTS",
    emoji: "🐱",
    theme: "cat",
    payload: payload,
  });
});

/* GET /cat/:count */
router.get("/:count", function (req, res, next) {
  let count = Number(req.params.count);
  if (!Number.isFinite(count) || count < 1) count = 1;
  if (count > MAX) count = MAX;

  const data = [];
  for (let i = 0; i < count; i++) data.push(getOne());

  const payload = buildPayload(`/cat/${count}`, data);

  if (req.query.json === "1") return res.json(payload);

  res.render("facts-view", {
    title: "CAT FACTS",
    emoji: "🐱",
    theme: "cat",
    payload: payload,
  });
});

module.exports = router;
