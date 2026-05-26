// ==========================================================
// -V9  Rute za studente — KOMPLETAN CRUD + N:M veza sa predmetima
// ==========================================================
// Iz V5 vec imamo:
//   GET  /studenti                  -> lista
//   GET  /studenti/novi             -> forma za unos
//   POST /studenti                  -> dodaj studenta (INSERT)
//   POST /studenti/:id/obrisi       -> obrisi studenta (DELETE)
//
// NOVO U V9:
//   GET  /studenti/:id              -> detalji jednog studenta
//   GET  /studenti/:id/uredi        -> forma za izmjenu (popunjena)
//   POST /studenti/:id/uredi        -> snimi izmjenu (UPDATE)
//
//   POST /studenti/:id/predmeti              -> upisi studenta na predmet
//   POST /studenti/:id/predmeti/:pid/obrisi  -> ispisi studenta sa predmeta
//   POST /studenti/:id/predmeti/:pid/ocjena  -> upisi/promijeni ocjenu

const express = require("express");
const router = express.Router();
const db = require("../db");

// ------------------------------------------------------------
// GET /studenti  —  lista svih studenata (SELECT + LEFT JOIN)
// ------------------------------------------------------------
router.get("/", function (req, res) {
  const studenti = db
    .prepare(
      `SELECT s.id, s.ime, s.prezime, s.email, s.broj_indeksa,
              g.naziv AS grupa_naziv
         FROM student s
         LEFT JOIN grupa g ON g.id = s.grupa_id
        ORDER BY s.prezime, s.ime`,
    )
    .all();

  res.render("studenti", { studenti });
});

// ------------------------------------------------------------
// GET /studenti/novi  —  forma za novi unos
// ------------------------------------------------------------
router.get("/novi", function (req, res) {
  const grupe = db.prepare("SELECT * FROM grupa ORDER BY naziv").all();
  // student = null  =>  forma zna da je u "novi" rezimu
  res.render("student-forma", { student: null, grupe, greska: null });
});

// ------------------------------------------------------------
// POST /studenti  —  obradi formu i dodaj studenta (INSERT)
// ------------------------------------------------------------
router.post("/", function (req, res) {
  const { ime, prezime, email, broj_indeksa, grupa_id } = req.body;

  if (!ime || !prezime || !broj_indeksa) {
    const grupe = db.prepare("SELECT * FROM grupa ORDER BY naziv").all();
    return res.render("student-forma", {
      student: req.body,
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
    const grupe = db.prepare("SELECT * FROM grupa ORDER BY naziv").all();
    return res.render("student-forma", {
      student: req.body,
      grupe,
      greska: "Greska pri unosu: " + err.message,
    });
  }

  res.redirect("/studenti");
});

// ============================================================
// -V9 NOVO: detalji + UPDATE + N:M operacije
// ============================================================

// ------------------------------------------------------------
// GET /studenti/:id  —  detalji jednog studenta
// ------------------------------------------------------------
// Trebamo:
//   1) podatke o studentu (sa grupom — LEFT JOIN kao i prije)
//   2) listu predmeta KOJE STUDENT VEC SLUSA (3-way JOIN)
//   3) listu predmeta na koje JOS NIJE upisan (za dropdown "dodaj")
router.get("/:id", function (req, res, next) {
  const student = db
    .prepare(
      `SELECT s.*, g.naziv AS grupa_naziv
         FROM student s
         LEFT JOIN grupa g ON g.id = s.grupa_id
        WHERE s.id = ?`,
    )
    .get(req.params.id);

  if (!student) return next(); // 404 ako ne postoji

  // Predmeti koje student VEC slusa — 3-way JOIN
  const upisani = db
    .prepare(
      `SELECT p.id, p.naziv, p.ects, sp.ocjena
         FROM student_predmet sp
         JOIN predmet p ON p.id = sp.predmet_id
        WHERE sp.student_id = ?
        ORDER BY p.naziv`,
    )
    .all(req.params.id);

  // Predmeti na koje student JOS NIJE upisan
  // (svi predmeti MINUS oni koji su vec u student_predmet za ovog studenta)
  const dostupni = db
    .prepare(
      `SELECT * FROM predmet
        WHERE id NOT IN (
          SELECT predmet_id FROM student_predmet WHERE student_id = ?
        )
        ORDER BY naziv`,
    )
    .all(req.params.id);

  res.render("student-detalji", { student, upisani, dostupni });
});

// ------------------------------------------------------------
// GET /studenti/:id/uredi  —  forma za izmjenu (popunjena)
// ------------------------------------------------------------
router.get("/:id/uredi", function (req, res, next) {
  const student = db
    .prepare("SELECT * FROM student WHERE id = ?")
    .get(req.params.id);

  if (!student) return next();

  const grupe = db.prepare("SELECT * FROM grupa ORDER BY naziv").all();
  res.render("student-forma", { student, grupe, greska: null });
});

// ------------------------------------------------------------
// POST /studenti/:id/uredi  —  snimi izmjenu (UPDATE)
// ------------------------------------------------------------
router.post("/:id/uredi", function (req, res) {
  const { ime, prezime, email, broj_indeksa, grupa_id } = req.body;
  const id = req.params.id;

  if (!ime || !prezime || !broj_indeksa) {
    const student = { id, ime, prezime, email, broj_indeksa, grupa_id };
    const grupe = db.prepare("SELECT * FROM grupa ORDER BY naziv").all();
    return res.render("student-forma", {
      student,
      grupe,
      greska: "Ime, prezime i broj indeksa su obavezni.",
    });
  }

  try {
    db.prepare(
      `UPDATE student
          SET ime = ?, prezime = ?, email = ?, broj_indeksa = ?, grupa_id = ?
        WHERE id = ?`,
    ).run(
      ime,
      prezime,
      email || null,
      broj_indeksa,
      grupa_id ? Number(grupa_id) : null,
      id,
    );
  } catch (err) {
    const student = { id, ime, prezime, email, broj_indeksa, grupa_id };
    const grupe = db.prepare("SELECT * FROM grupa ORDER BY naziv").all();
    return res.render("student-forma", {
      student,
      grupe,
      greska: "Greska: " + err.message,
    });
  }

  res.redirect("/studenti/" + id);
});

// ------------------------------------------------------------
// POST /studenti/:id/obrisi  —  obrisi studenta (DELETE)
// ------------------------------------------------------------
// Zbog ON DELETE CASCADE u tabeli student_predmet, automatski
// se brisu i svi upisi tog studenta na predmete.
router.post("/:id/obrisi", function (req, res) {
  db.prepare("DELETE FROM student WHERE id = ?").run(req.params.id);
  res.redirect("/studenti");
});

// ============================================================
// -V9 N:M operacije — upis/ispis/ocjena
// ============================================================

// ------------------------------------------------------------
// POST /studenti/:id/predmeti  —  upisi studenta na predmet
// ------------------------------------------------------------
// Forma salje predmet_id (iz dropdown-a). Pravimo INSERT u
// SPOJNU tabelu student_predmet.
router.post("/:id/predmeti", function (req, res) {
  const studentId = req.params.id;
  const { predmet_id } = req.body;

  try {
    db.prepare(
      `INSERT INTO student_predmet (student_id, predmet_id) VALUES (?, ?)`,
    ).run(studentId, predmet_id);
  } catch (err) {
    // npr. PK violation ako je vec upisan — sa nasim UI-jem
    // se to ne moze desiti, ali za svaki slucaj.
    console.error("[studenti] greska pri upisu na predmet:", err.message);
  }

  res.redirect("/studenti/" + studentId);
});

// ------------------------------------------------------------
// POST /studenti/:id/predmeti/:pid/obrisi  —  ispisi sa predmeta
// ------------------------------------------------------------
router.post("/:id/predmeti/:pid/obrisi", function (req, res) {
  db.prepare(
    `DELETE FROM student_predmet WHERE student_id = ? AND predmet_id = ?`,
  ).run(req.params.id, req.params.pid);

  res.redirect("/studenti/" + req.params.id);
});

// ------------------------------------------------------------
// POST /studenti/:id/predmeti/:pid/ocjena  —  upisi/promijeni ocjenu
// ------------------------------------------------------------
router.post("/:id/predmeti/:pid/ocjena", function (req, res) {
  const ocjena = req.body.ocjena ? Number(req.body.ocjena) : null;

  db.prepare(
    `UPDATE student_predmet
        SET ocjena = ?
      WHERE student_id = ? AND predmet_id = ?`,
  ).run(ocjena, req.params.id, req.params.pid);

  res.redirect("/studenti/" + req.params.id);
});

module.exports = router;
