var express = require("express");
var router = express.Router();
const chuck = require("chuck-norris-jokes");

const MAX = 50;

async function getOne() {
  // chuck-norris-jokes: .hitme() vraća Promise sa objektom { value: { joke: "..." } }
  const r = await chuck.hitme();
  let text;

  if (r && r.value && r.value.joke) {
    text = r.value.joke;
  } else if (r && r.joke) {
    text = r.joke;
  } else if (r && r.text) {
    text = r.text;
  } else {
    text = String(r);
  }

  return { text: String(text) };
}

function buildPayload(route, data) {
  return {
    ok: true,
    route: route,
    source: "chuck-norris-jokes",
    count: data.length,
    data: data,
    timestamp: new Date().toISOString(),
  };
}

/* GET /chuck */
router.get("/", async function (req, res, next) {
  try {
    const payload = buildPayload("/chuck", [await getOne()]);

    if (req.query.json === "1") return res.json(payload);

    res.render("facts-view", {
      title: "CHUCK NORRIS JOKES",
      emoji: "🥋",
      theme: "chuck",
      payload: payload,
    });
  } catch (err) {
    next(err);
  }
});

/* GET /chuck/:count */
router.get("/:count", async function (req, res, next) {
  try {
    let count = Number(req.params.count);
    if (!Number.isFinite(count) || count < 1) count = 1;
    if (count > MAX) count = MAX;

    // Paralelno dohvatanje
    const promises = [];
    for (let i = 0; i < count; i++) promises.push(getOne());
    const data = await Promise.all(promises);

    const payload = buildPayload(`/chuck/${count}`, data);

    if (req.query.json === "1") return res.json(payload);

    res.render("facts-view", {
      title: "CHUCK NORRIS JOKES",
      emoji: "🥋",
      theme: "chuck",
      payload: payload,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
