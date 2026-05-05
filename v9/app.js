var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const listEndpoints = require("express-list-endpoints");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const funFactsRouter = require("./routes/funFacts");
// *************************************************
const catRouter = require("./routes/cat");
const dogRouter = require("./routes/dog");
const chuckRouter = require("./routes/chuck");
// *************************************************
/* -V5 */ // Ucitavanje baze — pri prvom require-u, db.js otvori/kreira
/* -V5 */ // fajl skola.db i kreira tabele. Samo require je dovoljan.
/* -V5 */ require("./db");
/* -V5 */ const studentiRouter = require("./routes/studenti");
/* -V9 */ const predmetiRouter = require("./routes/predmeti");
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/fun-facts", funFactsRouter);
// *************************************************
app.use("/cat", catRouter);
app.use("/dog", dogRouter);
app.use("/chuck", chuckRouter);
// *************************************************
/* -V5 */ app.use("/studenti", studentiRouter);
/* -V9 */ app.use("/predmeti", predmetiRouter);

app.get("/routes", (req, res) => {
  res.json(listEndpoints(app));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
