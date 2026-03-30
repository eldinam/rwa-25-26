var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Razvoj web aplikacija" });
});

router.get("/users", function (req, res, next) {
  res.render("index", { title: "Users" });
});

router.get("/test", function (req, res, next) {
  res.render("index", { title: "Test ruta" });
});

router.get("/druga-ruta", function (req, res, next) {
  res.render("index", { title: "Druga ruta" });
});

module.exports = router;
