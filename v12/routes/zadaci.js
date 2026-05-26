// ==========================================================
// -V12 NOVI FAJL — AJAX CRUD nad tabelom `zadatak`
// ==========================================================
// Ovaj ruter ima DVIJE GRUPE ruta:
//
//   1. HTML ruta (server-rendered) — samo jedna, vraca stranicu:
//        GET  /zadaci          -> render views/zadaci.ejs
//
//   2. JSON API rute (za fetch() iz browsera):
//        GET    /api/zadaci         -> svi zadaci prijavljenog korisnika
//        POST   /api/zadaci         -> kreiraj novi zadatak
//        PUT    /api/zadaci/:id     -> azuriraj postojeci (npr. toggle uradjeno)
//        DELETE /api/zadaci/:id     -> obrisi zadatak
//
// === Razlika u odnosu na /studenti (klasicni CRUD iz v9)? ===
//   - /studenti koristi <form method="POST"> + res.redirect(). Browser
//     posalje formu, server odgovori 302 redirect, browser ucita NOVU stranicu.
//   - /zadaci koristi fetch() iz JavaScript-a u browseru. Server vrati
//     JSON, JavaScript update-uje DOM bez reload-a.
//
// === Zasto smo razdvojili /zadaci i /api/zadaci? ===
// /zadaci sluzi samo da posalje HTML + JS browseru (samo jedna ruta).
// Sve OPERACIJE (citanje, dodavanje, brisanje, mijenjanje) idu kroz
// /api/zadaci jer vracaju JSON. Ovo je standardna podjela: HTML rute
// vrate stranice, API rute vrate podatke.

const express = require("express");
const router = express.Router();
const db = require("../db");

// ------------------------------------------------------------
// GET /zadaci  —  HTML stranica (samo jedna jer ostalo radi fetch)
// ------------------------------------------------------------
// Ova ruta NE vraca podatke o zadacima! Samo posalje HTML + JS.
// Kad se stranica ucita, JavaScript u njoj ce pozvati /api/zadaci
// preko fetch() da ucita listu.
router.get("/zadaci", function (req, res) {
  res.render("zadaci");
});

// ============================================================
// JSON API rute — sve pocinju sa /api/zadaci
// ============================================================
//
// VAZNO O AUTORIZACIJI:
// requireLogin middleware iz v10 vraca redirect na /login.
// To je OK za HTML rute, ali za API NIJE - fetch ne razumije
// redirect kao "ti nisi prijavljen", samo ga slijedi i dobije
// HTML stranicu login forme nazad kao odgovor, sto zbuni JS.
// Zato pravimo NOVI middleware koji za API vraca 401 JSON.

function requireLoginApi(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      ok: false,
      error: { status: 401, message: "Niste prijavljeni." },
    });
  }
  next();
}

// ------------------------------------------------------------
// GET /api/zadaci  —  vrati SVE zadatke prijavljenog korisnika
// ------------------------------------------------------------
// Vraca JSON niz objekata. Frontend ce ih iterirati i ispisati.
//
// Primjer odgovora:
//   { "ok": true, "data": [
//     { "id": 1, "naslov": "Predati v12", "uradjeno": 0, ... },
//     ...
//   ]}
router.get("/api/zadaci", requireLoginApi, function (req, res) {
  const zadaci = db
    .prepare(
      `SELECT id, naslov, opis, uradjeno, rok, datum_kreiranja
         FROM zadatak
        WHERE korisnik_id = ?
        ORDER BY uradjeno ASC, datum_kreiranja DESC`,
    )
    .all(req.session.userId);

  res.json({ ok: true, data: zadaci });
});

// ------------------------------------------------------------
// POST /api/zadaci  —  kreiraj novi zadatak
// ------------------------------------------------------------
// Primjer zahtjeva sa fronta:
//   fetch("/api/zadaci", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ naslov: "Kupiti hljeb", rok: "2026-06-01" })
//   })
//
// Express prepoznaje "Content-Type: application/json" i automatski
// parsuje req.body iz JSON-a (jer imamo app.use(express.json()) u app.js).
router.post("/api/zadaci", requireLoginApi, function (req, res, next) {
  const { naslov, opis, rok } = req.body;

  // Validacija: naslov je obavezan.
  // Vracamo 400 (Bad Request) jer je problem u podacima korisnika.
  if (!naslov || naslov.trim() === "") {
    return res.status(400).json({
      ok: false,
      error: { status: 400, message: "Naslov je obavezan." },
    });
  }

  try {
    const info = db
      .prepare(
        `INSERT INTO zadatak (naslov, opis, rok, korisnik_id)
         VALUES (?, ?, ?, ?)`,
      )
      .run(naslov.trim(), opis || null, rok || null, req.session.userId);

    // Vracamo NOVI red iz baze (sa svim poljima ukljucujuci id, datum_kreiranja).
    // Tako frontend ne mora gadjati GET ponovo - dobio je kompletan objekat.
    const noviZadatak = db
      .prepare(
        `SELECT id, naslov, opis, uradjeno, rok, datum_kreiranja
           FROM zadatak WHERE id = ?`,
      )
      .get(info.lastInsertRowid);

    // HTTP 201 = "Created". 200 bi takodjer radilo, ali 201 je preciznije.
    res.status(201).json({ ok: true, data: noviZadatak });
  } catch (err) {
    // Prosljedi gresku error handler-u (errorHandler.js)
    next(err);
  }
});

// ------------------------------------------------------------
// PUT /api/zadaci/:id  —  azuriraj zadatak
// ------------------------------------------------------------
// PUT je HTTP metoda za "update". HTML forme ne podrzavaju PUT
// (samo GET i POST), ali fetch() podrzava sve metode:
//   fetch("/api/zadaci/3", { method: "PUT", ... })
//
// U body-ju moze doci bilo koja kombinacija: naslov, opis, rok, uradjeno.
// Ovdje koristimo COALESCE u SQL-u za "ako nije proslijedjeno, ostavi staro".
router.put("/api/zadaci/:id", requireLoginApi, function (req, res, next) {
  const id = req.params.id;
  const { naslov, opis, rok, uradjeno } = req.body;

  // Provjeri da zadatak postoji i pripada ovom korisniku.
  // BEZ ove provjere, korisnik bi mogao mijenjati TUDJE zadatke
  // tako sto bi pogodio njihov id. SIGURNOST!
  const postojeci = db
    .prepare("SELECT id FROM zadatak WHERE id = ? AND korisnik_id = ?")
    .get(id, req.session.userId);

  if (!postojeci) {
    return res.status(404).json({
      ok: false,
      error: { status: 404, message: "Zadatak nije pronadjen." },
    });
  }

  try {
    // uradjeno je boolean - pretvorimo u 0/1 ako je proslijedjeno.
    // Ako NIJE proslijedjeno (undefined), prosljedjujemo null pa COALESCE
    // u SQL-u zadrzi staru vrijednost.
    const uradjenoVal =
      uradjeno === undefined ? null : uradjeno ? 1 : 0;

    db.prepare(
      `UPDATE zadatak
          SET naslov = COALESCE(?, naslov),
              opis = COALESCE(?, opis),
              rok = COALESCE(?, rok),
              uradjeno = COALESCE(?, uradjeno)
        WHERE id = ? AND korisnik_id = ?`,
    ).run(
      naslov || null,
      opis === undefined ? null : opis,
      rok === undefined ? null : rok,
      uradjenoVal,
      id,
      req.session.userId,
    );

    const azurirani = db
      .prepare(
        `SELECT id, naslov, opis, uradjeno, rok, datum_kreiranja
           FROM zadatak WHERE id = ?`,
      )
      .get(id);

    res.json({ ok: true, data: azurirani });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------
// DELETE /api/zadaci/:id  —  obrisi zadatak
// ------------------------------------------------------------
// DELETE je HTTP metoda za brisanje. Ima dvije konvencije:
//   - vratiti 204 No Content (bez body-ja)
//   - vratiti 200 sa porukom { ok: true }
// Mi koristimo drugi pristup jer je lakse za frontend (uvijek
// dobije isti format odgovora).
router.delete("/api/zadaci/:id", requireLoginApi, function (req, res, next) {
  try {
    const info = db
      .prepare("DELETE FROM zadatak WHERE id = ? AND korisnik_id = ?")
      .run(req.params.id, req.session.userId);

    if (info.changes === 0) {
      return res.status(404).json({
        ok: false,
        error: { status: 404, message: "Zadatak nije pronadjen." },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
