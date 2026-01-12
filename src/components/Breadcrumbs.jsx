import * as React from "react";
import { Breadcrumbs, Link as MUILink, Typography, Box } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

// Χάρτης από path -> label (βάζεις ό,τι routes έχεις)
const LABELS = {
  "/": "Αρχική",
  "/owner": "Ιδιοκτήτης",
  "/vet": "Κτηνίατρος",
  "/lost": "Εύρεση / Απώλεια Κατοικίδια",
  "/found": "Εύρεση / Απώλεια Κατοικίδια",
  "/contact": "Επικοινωνία",
  "/login": "Σύνδεση",
};

export default function AppBreadcrumbs() {
  const location = useLocation();

  // π.χ. "/found" -> ["found"], "/" -> []
  const pathnames = location.pathname.split("/").filter(Boolean);

  // Φτιάχνει τα "σωρευτικά" paths: ["/found", "/found/123", ...]
  const crumbs = pathnames.map((_, index) => {
    const to = "/" + pathnames.slice(0, index + 1).join("/");
    return { to, label: LABELS[to] ?? to };
  });

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
