var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const listEndpoints = require("express-list-endpoints");
/* -V10 */ const session = require("express-session"); // session middleware

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
/* -V10 */ const authRouter = require("./routes/auth"); // login/registracija/logout
/* -V10 */ const requireLogin = require("./middleware/requireLogin"); // zastita ruta
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
// -V10 SESSION MIDDLEWARE
// =====================================================================
// express-session pravi za nas:
//   - kad korisnik dodje prvi put, generise nasumicni "session ID"
//   - taj ID salje browseru kao cookie ("connect.sid")
//   - na serveru cuva podatke (req.session.*) vezane za taj ID
//   - kad browser sljedeci put posalje isti cookie, vraca nam podatke
//
// `secret` je tajni kljuc kojim server POTPISUJE cookie da ga niko
// ne moze falsifikovati. U pravoj aplikaciji ide u .env.
// `resave: false` -> ne snimaj sesiju ako se nije promijenila
// `saveUninitialized: false` -> ne pravi sesiju za neprijavljene goste
// `cookie.maxAge` -> koliko dugo cookie traje (24h ovdje)
// `cookie.httpOnly: true` -> JS u browseru NE moze procitati cookie
//                            (zastita od XSS napada)
app.use(
  session({
    secret: "skola-tajni-kljuc-promijeni-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 sata
    },
  }),
);

// -V10 Helper middleware: dohvati podatke prijavljenog korisnika iz baze
// i stavi ih u res.locals.korisnik. Tako su DOSTUPNI U SVAKOM EJS
// view-u kao varijabla `korisnik` (npr. da prikazemo "Prijavljen kao...").
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
// *************************************************
app.use("/cat", catRouter);
app.use("/dog", dogRouter);
app.use("/chuck", chuckRouter);
// *************************************************
// -V10 ZASTITA: studenti i predmeti su SAMO za prijavljene korisnike.
// requireLogin middleware se izvrsi PRIJE rutera — ako korisnik
// nije ulogovan, dobija redirect na /login i ruter se nikad ne pozove.
// Fun facts, cat, dog, chuck rute ostaju javne (bez requireLogin).
/* -V5  */ app.use("/studenti", requireLogin, studentiRouter);
/* -V9  */ app.use("/predmeti", requireLogin, predmetiRouter);
/* -V10 */ app.use("/", authRouter); // /login, /registracija, /logout

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
