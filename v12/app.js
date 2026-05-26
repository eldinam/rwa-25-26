// =====================================================================
// -V12  Ucitaj environment varijable iz .env fajla
// =====================================================================
// Ovo MORA biti prvi require - jer ostali fajlovi citaju process.env.*
// odmah pri ucitavanju (npr. session secret).
// Ako .env ne postoji, dotenv samo preskoci (ne baca gresku).
/* -V12 */ require("dotenv").config();

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const listEndpoints = require("express-list-endpoints");
/* -V10 */ const session = require("express-session");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const funFactsRouter = require("./routes/funFacts");
const catRouter = require("./routes/cat");
const dogRouter = require("./routes/dog");
const chuckRouter = require("./routes/chuck");
/* -V5 */ require("./db");
/* -V5 */ const studentiRouter = require("./routes/studenti");
/* -V9 */ const predmetiRouter = require("./routes/predmeti");
/* -V10 */ const authRouter = require("./routes/auth");
/* -V10 */ const requireLogin = require("./middleware/requireLogin");
/* -V12 */ const zadaciRouter = require("./routes/zadaci"); // AJAX CRUD
/* -V12 */ const errorHandler = require("./middleware/errorHandler"); // custom error handler

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// =====================================================================
// -V10/V12 SESSION MIDDLEWARE
// =====================================================================
// V12 promjena: secret se cita iz process.env (dotenv) umjesto da bude
// hardkodovan. Ako .env nije postavljen, fallback na default - ali
// ce ispisati upozorenje u konzolu.
/* -V12 */ const sessionSecret = process.env.SESSION_SECRET;
/* -V12 */ if (!sessionSecret) {
/* -V12 */   console.warn(
/* -V12 */     "[app] UPOZORENJE: SESSION_SECRET nije postavljen u .env! Koristim default (NESIGURNO).",
/* -V12 */   );
/* -V12 */ }

app.use(
  session({
    /* -V12 */ secret: sessionSecret || "fallback-tajni-kljuc-promijeni-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 sata
    },
  }),
);

// -V10 Helper middleware: ubaci podatke prijavljenog korisnika u res.locals
app.use(function (req, res, next) {
  if (req.session.userId) {
    res.locals.korisnik = require("./db")
      .prepare("SELECT id, korisnicko_ime, email FROM korisnik WHERE id = ?")
      .get(req.session.userId);
  } else {
    res.locals.korisnik = null;
  }
  next();
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/fun-facts", funFactsRouter);
app.use("/cat", catRouter);
app.use("/dog", dogRouter);
app.use("/chuck", chuckRouter);
/* -V5  */ app.use("/studenti", requireLogin, studentiRouter);
/* -V9  */ app.use("/predmeti", requireLogin, predmetiRouter);
/* -V10 */ app.use("/", authRouter);
/* -V12 */
/* -V12 */ // Zadaci ruter ima dvije grupe ruta:
/* -V12 */ //   - GET /zadaci          (HTML stranica)  -> stiti requireLogin
/* -V12 */ //   - /api/zadaci/*        (JSON API)       -> internal requireLoginApi (zadaci.js)
/* -V12 */ // Posto je sve u istom ruteru, ne mozemo staviti requireLogin na cijeli mount
/* -V12 */ // (jer bi API rute dobile redirect umjesto 401 JSON). Zato requireLogin za
/* -V12 */ // HTML rutu radimo unutar samog rutera (provjeravamo path u middleware-u).
/* -V12 */ app.use("/", function (req, res, next) {
/* -V12 */   // Stiti samo GET /zadaci HTML stranicu (ne i API rute)
/* -V12 */   if (req.path === "/zadaci" && !req.session.userId) {
/* -V12 */     return res.redirect("/login");
/* -V12 */   }
/* -V12 */   next();
/* -V12 */ }, zadaciRouter);

app.get("/routes", (req, res) => {
  res.json(listEndpoints(app));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// -V12 custom error handler (vraca JSON za /api/*, HTML za ostalo)
/* -V12 */ app.use(errorHandler);

module.exports = app;
