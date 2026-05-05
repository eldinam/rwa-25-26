// ==========================================================
// -V5  NOVI FAJL — rute za studente (lista, forma, unos)
// ==========================================================
// Rute:
//   GET  /studenti          -> prikazi sve studente (SELECT)
//   GET  /studenti/novi     -> prikazi formu za unos
//   POST /studenti          -> dodaj studenta u bazu (INSERT)
//   POST /studenti/:id/obrisi -> obrisi studenta (DELETE)

const express = require("express");
const router = express.Router();
const db = require("../db"); // konekcija na bazu iz db.js

// ------------------------------------------------------------
// GET /studenti  —  prikazi tabelu svih studenata
// ------------------------------------------------------------
// SELECT sa JOIN: povezujemo student.grupa_id -> grupa.id
// da mozemo prikazati NAZIV grupe, ne samo broj.
// LEFT JOIN = prikazi studenta i ako nema grupu.
router.get("/", function (req, res) {
  const studenti = db
    .prepare(
      `SELECT s.id, s.ime, s.prezime, s.email, s.broj_indeksa,
              g.naziv AS grupa_naziv
         FROM student s
         LEFT JOIN grupa g ON g.id = s.grupa_id
        ORDER BY s.prezime, s.ime`,
    )
    .all(); // .all() vraca niz svih redova

  res.render("studenti", { studenti });
});

// ------------------------------------------------------------
// GET /studenti/novi  —  forma za unos novog studenta
// ------------------------------------------------------------
// Prvo ucitamo sve grupe iz baze da ih stavimo u <select> dropdown.
router.get("/novi", function (req, res) {
  const grupe = db.prepare("SELECT * FROM grupa ORDER BY naziv").all();
  res.render("student-forma", { grupe, greska: null });
});

// ------------------------------------------------------------
// POST /studenti  —  obradi formu i ubaci u bazu
// ------------------------------------------------------------
// Podaci iz forme dolaze u req.body (zahvaljujuci express.urlencoded u app.js).
// Koristimo ? kao placeholdere — NIKAD ne spajati string-ove rucno
// (SQL injection!). better-sqlite3 sam pazi na escape.
router.post("/", function (req, res) {
  const { ime, prezime, email, broj_indeksa, grupa_id } = req.body;

  // osnovna validacija
  if (!ime || !prezime || !broj_indeksa) {
    const grupe = db.prepare("SELECT * FROM grupa ORDER BY naziv").all();
    return res.render("student-forma", {
      grupe,
      greska: "Ime, prezime i broj indeksa su obavezni.",
    });
  }

  try {
    db.prepare(
      `INSERT INTO student (ime, prezime, email, broj_indeksa, grupa_id)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      ime,
      prezime,
      email || null,
      broj_indeksa,
      grupa_id ? Number(grupa_id) : null,
    );
  } catch (err) {
    // npr. duplikat email-a ili broja indeksa (UNIQUE constraint)
    const grupe = db.prepare("SELECT * FROM grupa ORDER BY naziv").all();
    return res.render("student-forma", {
      grupe,
      greska: "Greska pri unosu: " + err.message,
    });
  }

  // nakon uspjesnog unosa -> vrati se na listu
  res.redirect("/studenti");
});

// ------------------------------------------------------------
// POST /studenti/:id/obrisi  —  obrisi jednog studenta
// ------------------------------------------------------------
router.post("/:id/obrisi", function (req, res) {
  db.prepare("DELETE FROM student WHERE id = ?").run(req.params.id);
  res.redirect("/studenti");
});

module.exports = router;
