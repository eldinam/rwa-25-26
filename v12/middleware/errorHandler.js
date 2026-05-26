// ==========================================================
// -V12 NOVI FAJL — custom error handler middleware
// ==========================================================
// Express ima default error handler (vidi dno app.js u v10).
// On uvijek vraca HTML, sto je problem ako frontend zove API
// preko fetch() i ocekuje JSON. Ova verzija PAMETNO bira:
//   - ako je ruta /api/... -> vrati JSON odgovor
//   - inace -> renderuj HTML error stranicu
//
// === Kako Express prepoznaje error handler? ===
// Obican middleware ima 3 argumenta: (req, res, next).
// Error handler ima 4 argumenta: (err, req, res, next).
// Express to detektuje po broju argumenata. VAZNO: argument
// `next` MORA postojati, cak i ako ga ne koristimo, inace
// Express nece prepoznati funkciju kao error handler.

function errorHandler(err, req, res, next) {
  // Status: ako je greska imala .status (npr. http-errors paket),
  // koristimo to. Inace 500 (Internal Server Error).
  const status = err.status || 500;

  // Log u konzolu - u produkciji bi islo u logger (winston, pino...).
  console.error("[errorHandler]", status, err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  // Da li klijent zove API ili stranicu? Provjeravamo na DVA nacina:
  //   1. URL pocinje sa /api/  -> definitivno API
  //   2. Accept header sadrzi "application/json" -> klijent ocekuje JSON
  const jeApi =
    req.path.startsWith("/api/") ||
    (req.headers.accept && req.headers.accept.includes("application/json"));

  if (jeApi) {
    // === JSON odgovor ===
    // U dev modu vracamo i stack trace za lakse debugiranje.
    // U produkciji NE - moglo bi otkriti putanje fajlova, lozinke iz env-a itd.
    return res.status(status).json({
      ok: false,
      error: {
        status: status,
        message: err.message || "Greska na serveru",
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
      },
    });
  }

  // === HTML odgovor ===
  // Renderujemo views/error.ejs (koju view engine vec ima iz v10).
  res.status(status);
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.render("error");
}

module.exports = errorHandler;
