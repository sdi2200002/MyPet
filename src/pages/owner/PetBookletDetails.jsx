import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const dog1 = "/images/dog1.png";
const cat1 = "/images/cat1.png";

const TITLE = "#0d2c54";
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const PANEL_BG = "#dfeeff";
const BORDER = "#8fb4e8";
const MUTED = "#6b7a90";

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function Tab({ active, label, to }) {
  return (
    <Box component={Link} to={to} sx={{ textDecoration: "none" }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          bgcolor: active ? PRIMARY : "#cfd7e8",
          color: active ? "#fff" : "#111",
          fontWeight: 900,
          fontSize: 16,
          boxShadow: active ? "0 10px 22px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

function FieldRow({ label, value }) {
  return (
    <Box
      sx={{
        bgcolor: PANEL_BG,
        borderRadius: 999,
        px: 2,
        py: 0.7,
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 1,
        alignItems: "center",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <Typography sx={{ color: MUTED, fontWeight: 900, fontSize: 12 }}>
        {label}:
      </Typography>
      <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 12 }}>
        {value || "-"}
      </Typography>
    </Box>
  );
}

export default function PetBookletDetails() {
  const { id } = useParams();
  const petId = Number(id); // ✅ json-server έχει numeric ids

  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      // 1) pet
      const p = await fetchJSON(`/api/pets/${petId}`);

      // 2) owner (από ownerId)
      let o = null;
      if (p?.ownerId != null) {
        o = await fetchJSON(`/api/users/${Number(p.ownerId)}`);
      }

      if (!alive) return;
      setPet(p);
      setOwner(o);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setErr("Δεν βρέθηκαν στοιχεία για το κατοικίδιο.");
      setPet(null);
      setOwner(null);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [petId]);

  const photo = useMemo(() => {
    if (!pet) return dog1;
    return pet.photo || (pet.name === "Λούνα" ? cat1 : dog1);
  }, [pet]);

  const speciesOrBreed = pet?.breed || pet?.species || "-";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 2.5 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Stack direction="row" spacing={1.2} sx={{ mb: -1, position: "relative", zIndex: 1 }}>
            <Tab active label="Στοιχεία Κατοικιδίου" to={`/owner/pets/${petId}/booklet`} />
            <Tab label="Εμβολιασμοί" to={`/owner/pets/${petId}/booklet/vaccinations`} />
            <Tab label="Ιατρικές Πράξεις" to={`/owner/pets/${petId}/booklet/acts`} />
          </Stack>

          <Paper
            elevation={0}
            sx={{
              position: "relative",
              zIndex: 2,
              borderRadius: 2,
              border: `2px solid ${BORDER}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
              p: 2.2,
            }}
          >
            {loading ? (
              <Typography sx={{ color: MUTED, fontWeight: 800 }}>Φόρτωση...</Typography>
            ) : err ? (
              <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Box
                    sx={{
                      width: 160,
                      height: 160,
                      bgcolor: "#e3f1ff",
                      borderRadius: 2,
                      border: "1px solid rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  >
                    <Box
                      component="img"
                      src={photo}
                      alt={pet?.name || "pet"}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = dog1;
                      }}
                      sx={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "cover",
                        borderRadius: 1.5,
                      }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 22, mb: 1 }}>
                    {pet?.name || "—"}
                  </Typography>

                  <Stack spacing={1}>
                    <FieldRow label="Ημ. Γέννησης" value={pet?.birthDate || "-"} />
                    <FieldRow label="Φύλο" value={pet?.sex || "-"} />
                    <FieldRow label="Είδος / Φυλή" value={speciesOrBreed} />
                    <FieldRow label="Χρώμα" value={pet?.color || "-"} />
                    <FieldRow label="Microchip" value={pet?.microchip || "-"} />
                    <FieldRow label="Ομάδα αίματος" value={pet?.blood || "-"} />

                    {/* ✅ owner από users */}
                    <FieldRow label="Ιδιοκτήτης" value={owner?.name || "-"} />
                    <FieldRow label="Τηλ." value={owner?.phone || "-"} />
                    <FieldRow label="Διεύθυνση" value={owner?.address || "-"} />
                  </Stack>
                </Box>
              </Box>
            )}
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: PRIMARY,
                "&:hover": { bgcolor: PRIMARY_HOVER },
                fontWeight: 900,
                px: 3,
              }}
              onClick={() => window.print()}
            >
              Εκτύπωση
            </Button>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
