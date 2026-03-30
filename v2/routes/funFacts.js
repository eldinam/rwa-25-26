var express = require("express");
var router = express.Router();
const facts = require("fun-facts");

/* GET home page. */
router.get("/", function (req, res, next) {
  let options = {
    category: "all",
    maxLength: 0,
    maxDLength: 0,
    useDesc: 0,
    safe: false,
  };

  const fun_fact = facts.get(options);

  res.render("fun-facts-view", {
    title: "Fun facts - title",
    fact: fun_fact.fact,
    description: fun_fact.desc,
  });
});

module.exports = router;
