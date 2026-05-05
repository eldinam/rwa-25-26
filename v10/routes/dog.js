var express = require("express");
var router = express.Router();
const dogFacts = require("dog-facts");

const MAX = 50;

function getOne() {
  const r = typeof dogFacts.random === "function" ? dogFacts.random() : dogFacts();
  const obj = Array.isArray(r) ? r[0] : r;
  const text = obj?.fact || obj?.text || obj;
  return { text: String(text) };
}

function buildPayload(route, data) {
  return {
    ok: true,
    route: route,
    source: "dog-facts",
    count: data.length,
    data: data,
    timestamp: new Date().toISOString(),
  };
}

/* GET /dog */
router.get("/", function (req, res, next) {
  const payload = buildPayload("/dog", [getOne()]);

  if (req.query.json === "1") return res.json(payload);

  res.render("facts-view", {
    title: "DOG FACTS",
    emoji: "🐶",
    theme: "dog",
    payload: payload,
  });
});

/* GET /dog/:count */
router.get("/:count", function (req, res, next) {
  let count = Number(req.params.count);
  if (!Number.isFinite(count) || count < 1) count = 1;
  if (count > MAX) count = MAX;

  const data = [];
  for (let i = 0; i < count; i++) data.push(getOne());

  const payload = buildPayload(`/dog/${count}`, data);

  if (req.query.json === "1") return res.json(payload);

  res.render("facts-view", {
    title: "DOG FACTS",
    emoji: "🐶",
    theme: "dog",
    payload: payload,
  });
});

module.exports = router;
