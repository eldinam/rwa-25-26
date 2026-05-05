// ==========================================================
// -V9  Rute za predmete — drugi CRUD primjer
// ==========================================================
// Iste vrste operacija kao kod studenata, na novoj tabeli `predmet`.
// Dodatno: detalji predmeta prikazuju SVE STUDENTE koji slusaju
// taj predmet (3-way JOIN kroz student_predmet).
//
// Rute:
//   GET  /predmeti              -> lista
//   GET  /predmeti/novi         -> forma za unos
//   POST /predmeti              -> dodaj (INSERT)
//   GET  /predmeti/:id          -> detalji + lista upisanih studenata
//   GET  /predmeti/:id/uredi    -> forma za izmjenu
//   POST /predmeti/:id/uredi    -> snimi izmjenu (UPDATE)
//   POST /predmeti/:id/obrisi   -> obrisi (DELETE)

const express = require("express");
const router = express.Router();
const db = require("../db");

// ------------------------------------------------------------
// GET /predmeti  —  lista svih predmeta
// ------------------------------------------------------------
// Dodajemo COUNT() kroz LEFT JOIN da prikazemo i broj upisanih
// studenata uz svaki predmet.
router.get("/", function (req, res) {
  const predmeti = db
    .prepare(
      `SELECT p.id, p.naziv, p.ects,
              COUNT(sp.student_id) AS broj_studenata
         FROM predmet p
         LEFT JOIN student_predmet sp ON sp.predmet_id = p.id
        GROUP BY p.id, p.naziv, p.ects
        ORDER BY p.naziv`,
    )
    .all();

  res.render("predmeti", { predmeti });
});

// ------------------------------------------------------------
// GET /predmeti/novi
// ------------------------------------------------------------
router.get("/novi", function (req, res) {
  res.render("predmet-forma", { predmet: null, greska: null });
});

// ------------------------------------------------------------
// POST /predmeti  —  INSERT
// ------------------------------------------------------------
router.post("/", function (req, res) {
  const { naziv, ects } = req.body;

  if (!naziv || !ects) {
    return res.render("predmet-forma", {
      predmet: req.body,
      greska: "Naziv i ECTS su obavezni.",
    });
  }

  try {
    db.prepare("INSERT INTO predmet (naziv, ects) VALUES (?, ?)").run(
      naziv,
      Number(ects),
    );
  } catch (err) {
    return res.render("predmet-forma", {
      predmet: req.body,
      greska: "Greska: " + err.message, // npr. UNIQUE constraint
    });
  }

  res.redirect("/predmeti");
});

// ------------------------------------------------------------
// GET /predmeti/:id  —  detalji + lista studenata koji slusaju
// ------------------------------------------------------------
router.get("/:id", function (req, res, next) {
  const predmet = db
    .prepare("SELECT * FROM predmet WHERE id = ?")
    .get(req.params.id);

  if (!predmet) return next();

  // 3-way JOIN: koji studenti su upisani na ovaj predmet?
  const studenti = db
    .prepare(
      `SELECT s.id, s.ime, s.prezime, s.broj_indeksa, sp.ocjena
         FROM student_predmet sp
         JOIN student s ON s.id = sp.student_id
        WHERE sp.predmet_id = ?
        ORDER BY s.prezime, s.ime`,
    )
    .all(req.params.id);

  res.render("predmet-detalji", { predmet, studenti });
});

// ------------------------------------------------------------
// GET /predmeti/:id/uredi
// ------------------------------------------------------------
router.get("/:id/uredi", function (req, res, next) {
  const predmet = db
    .prepare("SELECT * FROM predmet WHERE id = ?")
    .get(req.params.id);

  if (!predmet) return next();
  res.render("predmet-forma", { predmet, greska: null });
});

// ------------------------------------------------------------
// POST /predmeti/:id/uredi  —  UPDATE
// ------------------------------------------------------------
router.post("/:id/uredi", function (req, res) {
  const { naziv, ects } = req.body;
  const id = req.params.id;

  if (!naziv || !ects) {
    return res.render("predmet-forma", {
      predmet: { id, naziv, ects },
      greska: "Naziv i ECTS su obavezni.",
    });
  }

  try {
    db.prepare("UPDATE predmet SET naziv = ?, ects = ? WHERE id = ?").run(
      naziv,
      Number(ects),
      id,
    );
  } catch (err) {
    return res.render("predmet-forma", {
      predmet: { id, naziv, ects },
      greska: "Greska: " + err.message,
    });
  }

  res.redirect("/predmeti/" + id);
});

// ------------------------------------------------------------
// POST /predmeti/:id/obrisi  —  DELETE
// ------------------------------------------------------------
// ON DELETE CASCADE u student_predmet ce automatski pobrisati
// sve upise studenata na ovaj predmet.
router.post("/:id/obrisi", function (req, res) {
  db.prepare("DELETE FROM predmet WHERE id = ?").run(req.params.id);
  res.redirect("/predmeti");
});

module.exports = router;
