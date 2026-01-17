import * as React from "react";
import { Breadcrumbs, Link as MUILink, Typography, Box } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

// Χάρτης από path -> label (βάζεις ό,τι routes έχεις)
const LABELS = {
  "/": "Αρχική",
  "/login": "Σύνδεση",
  "/forgot-password": "Ανάκτηση Κωδικού",
  "/register/owner": "Εγγραφή Ιδιοκτήτη",
  "/register/vet": "Εγγραφή Κτηνίατρου",

  "/lost": "Εύρεση / Απώλεια Κατοικιδίου",
  "/lost/:id": "Λεπτομέρειες Δήλωσης",
  "/found/:id": "Λεπτομέρειες Δήλωσης",
  "/found": "Εύρεση / Απώλεια Κατοικιδίου",
  "/found/new": "Νέα Δήλωση Εύρεσης Κατοικιδίου",
  "/vets": "Αναζήτηση Κτηνιάτρων",
  "/vets/:vetId": "Προφίλ Κτηνιάτρου",
  "/vets/:vetId/reviews": "Κριτικές",
  "/vets/:vetId/reviews/:reviewId": "Λεπτομέρειες",

  "/contact": "Επικοινωνία",


  "/owner": "Ιδιοκτήτης",
  "/owner/pets": "Τα Κατοικίδιά Μου",
  "/owner/pets/:id/booklet": "Βιβλίο Κατοικιδίου",
  "/owner/pets/:id/booklet/vaccinations": "Εμβολιασμοί",
  "/owner/pets/:id/booklet/acts": "Ιατρικές Πράξεις",

  "/owner/vets": "Αναζήτηση Κτηνιάτρων",
  "/owner/vets/:vetId": "Προφίλ Κτηνιάτρου",
  "/owner/vets/:vetId/new": "Νέο Ραντεβού",
  "/owner/vets/:vetId/reviews": "Κριτικές",
  "/owner/vets/:vetId/reviews/:reviewId": "Λεπτομέρειες",

  "/owner/appointments": "Τα Ραντεβού Μου",
  "/owner/appointments/success": "Επιτυχία Ραντεβού",
  "/owner/appointments/:appId": "Λεπτομέρειες Ραντεβού",
  "/owner/appointments/:appId/review": "Νέα Κριτική",

  "/owner/declarations": "Οι Δηλώσεις Μου",
  "/owner/declarations/new": "Νέα Δήλωση",
  "/owner/declarations/found/new": "Νέα Δήλωση Εύρεσης Κατοικιδίου",
  "/owner/declarations/lost/new": "Νέα Δήλωση Απώλειας Κατοικιδίου",
  "/owner/declarations/success": "Επιτυχία Δήλωσης",
  "/owner/found/:id": "Λεπτομέρειες Δήλωσης",

  "/owner/profile": "Προφίλ Ιδιοκτήτη",


  "/vet": "Κτηνίατρος",
  "/vet/mypets": "Τα Κατοικίδια Μου",
  "/vet/mypets/:id/booklet": "Βιβλίο Κατοικιδίου",
  "/vet/mypets/:id/booklet/vaccinations": "Εμβολιασμοί", 
  "/vet/mypets/:id/booklet/vaccinations/new": "Νέος Εμβολιασμός",
  "/vet/mypets/:id/booklet/acts": "Ιατρικές Πράξεις",
  "/vet/mypets/:id/booklet/acts/new": "Νέα Ιατρική Πράξη",

  "/vet/pets": "Αναζήτηση Κατοικιδίων",
  "/vet/pets/:id/booklet": "Βιβλίο Κατοικιδίου",
  "/vet/pets/:id/booklet/vaccinations": "Εμβολιασμοί", 
  "/vet/pets/:id/booklet/vaccinations/new": "Νέος Εμβολιασμός",
  "/vet/pets/:id/booklet/acts": "Ιατρικές Πράξεις",
  "/vet/pets/:id/booklet/acts/new": "Νέα Ιατρική Πράξη",

  "/vet/appointments": "Τα Ραντεβού Μου",
  "/vet/appointments/VetAppointmentsRequests": "Αιτήματα",
  "/vet/appointments/VetAppointmentsUpdates": "Ενημερώσεις",
  "/vet/appointments/VetAppointmentsAvailability": "Διαθεσιμότητα",
  "/vet/appointments/:appId": "Λεπτομέρειες Ραντεβού",

  "/vet/declarations": "Οι Δηλώσεις Μου",
  "/vet/declarations/new": "Νέα Δήλωση",
  "/vet/declarations/found/new": "Νέα Δήλωση Εύρεσης Κατοικιδίου",
  "/vet/declarations/lost/new": "Νέα Δήλωση Απώλειας Κατοικιδίου",
  "/vet/declarations/newPet/new": "Νέα Καταγραφή Κατοικιδίου",
  "/vet/declarations/adoption/new": "Νέα Δήλωση Υιοθεσίας Κατοικιδίου",
  "/vet/declarations/transfer/new": "Νέα Δήλωση Μεταβίβασης Κατοικιδίου",
  "/vet/declarations/foster/new": "Νέα Δήλωση Αναδοχής Κατοικιδίου",
  "/vet/declarations/:type/:id": "Λεπτομέρειες Δήλωσης",
  "/vet/declarations/success": "Επιτυχία Δήλωσης",

  "/vet/profile": "Προφίλ Κτηνιάτρου",
  "/vet/profile/:vetId/reviews": "Κριτικές",
  "/vet/profile/:vetId/reviews/:reviewId": "Λεπτομέρειες",
};


function compilePattern(pattern) {
  const names = [];
  const regexStr =
    "^" +
    pattern
      .split("/")
      .map((seg) => {
        if (!seg) return "";
        if (seg.startsWith(":")) {
          names.push(seg.slice(1));
          return "([^/]+)";
        }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/") +
    "$";
  return { pattern, names, regex: new RegExp(regexStr) };
}

const COMPILED = Object.keys(LABELS).map(compilePattern);

function resolveLabel(path) {
  // 1) exact
  if (LABELS[path]) return LABELS[path];

  // 2) match /foo/:id
  for (const c of COMPILED) {
    if (c.regex.test(path)) {
      return LABELS[c.pattern];
    }
  }

  // 3) fallback
  return path;
}

export default function AppBreadcrumbs() {
  const location = useLocation();

  // π.χ. "/found" -> ["found"], "/" -> []
  const pathnames = location.pathname.split("/").filter(Boolean);

  // Φτιάχνει τα "σωρευτικά" paths: ["/found", "/found/123", ...]
  const crumbs = pathnames
    .map((_, index) => {
      const to = "/" + pathnames.slice(0, index + 1).join("/");
      return { to, label: resolveLabel(to) };
  })
  // ❌ skip σκέτα id paths (π.χ. /vet/mypets/1)
  .filter((c) => c.label !== c.to);


  // Πάντα ξεκινάμε με Αρχική
  const all = [{ to: "/", label: LABELS["/"] }, ...crumbs];

  const lastIndex = all.length - 1;

  return (
    <Box sx={{  py: 1 }}>
      <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ color: "#0b3d91" }}>
        {all.map((c, i) =>
          i === lastIndex ? (
            <Typography key={c.to} sx={{ fontSize: 13, color: "#111", fontWeight: 500 }}>
              {c.label}
            </Typography>
          ) : (
            <MUILink
              key={c.to}
              component={Link}
              to={c.to}
              underline="none"
              sx={{
                fontSize: 13,
                color: "#0b3d91",
                fontWeight: 600,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {c.label}
            </MUILink>
          )
        )}
      </Breadcrumbs>
    </Box>
  );
}
