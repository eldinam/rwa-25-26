var express = require("express");
var router = express.Router();
const facts = require("fun-facts");

/* GET home page. */
router.get("/", function (req, res, next) {
  const options = {
    category: "all",
    maxLength: 0,
    maxDLength: 0,
    useDesc: 0,
    safe: false,
  };

  const funFact = facts.get(options);

  console.log(funFact);

  res.render("fun-facts-view", {
    title: "FACTS",
    factText: funFact.fact,
    factDescription: funFact.desc,
  });
});

router.get("/object", function (req, res, next) {
  const options = {
    category: "all",
    maxLength: 0,
    maxDLength: 0,
    useDesc: 0,
    safe: false,
  };

  const funFact = facts.get(options);

  console.log(funFact);

  res.render("fun-facts-object", {
    title: "FACTS",
    factObject: funFact,
  });
});

router.get("/:number", function (req, res, next) {
  const number = Number(req.params.number);

  console.log(number);

  const options = {
    category: "all",
    maxLength: 0,
    maxDLength: 0,
    useDesc: 0,
    safe: false,
  };

  const list = [];

  for (let i = 0; i < number; i++) {
    list.push(facts.get(options));
  }

  res.render("fun-facts-list", {
    title: "DINAMIČKA RUTA",
    listObjects: JSON.stringify(list),
  });
});

module.exports = router;
