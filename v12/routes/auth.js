// ==========================================================
// -V10 NOVI FAJL — rute za autentifikaciju
// ==========================================================
// Autentifikacija = "ko si ti?" (login + registracija + logout)
//
// Rute u ovom fajlu:
//   GET  /registracija   -> forma za registraciju
//   POST /registracija   -> obradi registraciju (HASH lozinke + INSERT)
//   GET  /login          -> forma za prijavu
//   POST /login          -> provjeri lozinku, postavi sesiju
//   POST /logout         -> unisti sesiju (odjavljivanje)
//
// Kako tece prijava (cijeli "puzzle"):
//   1. Korisnik posalje korisnicko_ime + lozinku iz forme
//   2. Server iz baze ucita korisnika sa tim imenom
//   3. Provjeri lozinku: bcrypt.compareSync(plain, hash)
//   4. Ako se poklapa => req.session.userId = korisnik.id
//   5. express-session sam posalje "set-cookie" header sa
//      session ID-em. Browser ce taj cookie slati sa SVAKIM
//      narednim zahtjevom => server zna koji si korisnik.

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // -V10 hashing lozinki
const db = require("../db");

// ------------------------------------------------------------
// GET /registracija — forma
// ------------------------------------------------------------
router.get("/registracija", function (req, res) {
  // Ako je vec prijavljen, nema smisla otvarati registraciju.
  if (req.session.userId) return res.redirect("/");
  res.render("registracija", { greska: null, vrijednosti: {} });
});

// ------------------------------------------------------------
// POST /registracija — obradi formu
// ------------------------------------------------------------
// Koraci:
//   1. uzmi podatke iz forme
//   2. validiraj (sva polja, lozinke se poklapaju, dovoljno duga)
//   3. provjeri da li korisnicko_ime ili email vec postoji
//   4. HASH-iraj lozinku sa bcrypt-om (10 = "salt rounds")
//   5. INSERT u tabelu korisnik
//   6. (auto-login) postavi req.session.userId = noviKorisnik.id
//   7. redirect na pocetnu
router.post("/registracija", function (req, res) {
  const { korisnicko_ime, email, lozinka, lozinka2 } = req.body;
  const vrijednosti = { korisnicko_ime, email }; // za vracanje u formu pri gresci

  // ---- 2. validacija ----
  if (!korisnicko_ime || !email || !lozinka) {
    return res.render("registracija", {
      greska: "Sva polja su obavezna.",
      vrijednosti,
    });
  }
  if (lozinka.length < 6) {
    return res.render("registracija", {
      greska: "Lozinka mora imati najmanje 6 karaktera.",
      vrijednosti,
    });
  }
  if (lozinka !== lozinka2) {
    return res.render("registracija", {
      greska: "Lozinke se ne poklapaju.",
      vrijednosti,
    });
  }

  // ---- 3. provjera duplikata (UNIQUE bi i sam pukao, ali lijepa poruka) ----
  const postoji = db
    .prepare("SELECT id FROM korisnik WHERE korisnicko_ime = ? OR email = ?")
    .get(korisnicko_ime, email);

  if (postoji) {
    return res.render("registracija", {
      greska: "Korisnicko ime ili email vec postoje.",
      vrijednosti,
    });
  }

  // ---- 4. HASH lozinke ----
  // bcrypt.hashSync(plainText, saltRounds)
  // saltRounds=10 => prihvatljivo sporo (otprilike 100ms) -> tesko za napadace
  const hash = bcrypt.hashSync(lozinka, 10);

  // ---- 5. INSERT ----
  let info;
  try {
    info = db
      .prepare(
        `INSERT INTO korisnik (korisnicko_ime, email, password_hash)
         VALUES (?, ?, ?)`,
      )
      .run(korisnicko_ime, email, hash);
  } catch (err) {
    return res.render("registracija", {
      greska: "Greska: " + err.message,
      vrijednosti,
    });
  }

  // ---- 6. AUTO-LOGIN ----
  // info.lastInsertRowid = id novog korisnika.
  req.session.userId = info.lastInsertRowid;
  req.session.korisnickoIme = korisnicko_ime;

  // ---- 7. redirect ----
  res.redirect("/");
});

// ------------------------------------------------------------
// GET /login — forma
// ------------------------------------------------------------
router.get("/login", function (req, res) {
  if (req.session.userId) return res.redirect("/");
  res.render("login", { greska: null, vrijednosti: {} });
});

// ------------------------------------------------------------
// POST /login — provjeri kredencijale, otvori sesiju
// ------------------------------------------------------------
router.post("/login", function (req, res) {
  const { korisnicko_ime, lozinka } = req.body;

  if (!korisnicko_ime || !lozinka) {
    return res.render("login", {
      greska: "Unesite korisnicko ime i lozinku.",
      vrijednosti: { korisnicko_ime },
    });
  }

  // Trazimo korisnika u bazi.
  const korisnik = db
    .prepare("SELECT * FROM korisnik WHERE korisnicko_ime = ?")
    .get(korisnicko_ime);

  // VAZNO: ne otkrivaj DA LI postoji korisnik sa tim imenom.
  // Vrati istu poruku za "krivi user" i "kriva lozinka" (sigurnost).
  if (!korisnik) {
    return res.render("login", {
      greska: "Pogresno korisnicko ime ili lozinka.",
      vrijednosti: { korisnicko_ime },
    });
  }

  // bcrypt.compareSync(plainText, hashIzBaze) -> true/false
  const lozinkaOk = bcrypt.compareSync(lozinka, korisnik.password_hash);
  if (!lozinkaOk) {
    return res.render("login", {
      greska: "Pogresno korisnicko ime ili lozinka.",
      vrijednosti: { korisnicko_ime },
    });
  }

  // Sve OK -> postavi sesiju. Od sad pa nadalje, dok god browser
  // salje session cookie, server zna koji je userId.
  req.session.userId = korisnik.id;
  req.session.korisnickoIme = korisnik.korisnicko_ime;

  res.redirect("/");
});

// ------------------------------------------------------------
// POST /logout — odjavi korisnika
// ------------------------------------------------------------
// req.session.destroy() obrise sesiju na serveru. Cookie u browseru
// se i dalje moze poslati, ali kad ga server primi, ne nadje sesiju
// u memoriji => req.session.userId je undefined => korisnik je odjavljen.
router.post("/logout", function (req, res) {
  req.session.destroy(function (err) {
    if (err) console.error("[auth] greska pri logout:", err);
    res.clearCookie("connect.sid"); // obrisi i cookie u browseru (cisto)
    res.redirect("/login");
  });
});

module.exports = router;
