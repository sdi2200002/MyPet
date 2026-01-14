import { Box, Container, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const COLORS = {
  title: "#0d2c54",
  panelBorder: "#8fb4e8",
};

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 2, py: 0.5 }}>
      <Typography sx={{ fontWeight: 900, color: COLORS.title, opacity: 0.9 }}>{label}:</Typography>
      <Typography sx={{ color: COLORS.title }}>{value || "—"}</Typography>
    </Box>
  );
}

function fmtDate(isoOrYmd) {
  if (!isoOrYmd) return "—";
  const d = new Date(isoOrYmd);
  if (Number.isNaN(d.getTime())) return String(isoOrYmd);
  return d.toLocaleDateString("el-GR");
}

export default function LostPetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ Φέρνουμε τη δήλωση από json-server: /api/lostDeclarations/:id
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!id) {
        if (!alive) return;
        setItem(null);
        setErr("Λείπει το id της δήλωσης.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchJSON(`/api/lostDeclarations/${encodeURIComponent(String(id))}`);
        if (!alive) return;

        setItem(data || null);
        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!alive) return;

        // json-server όταν δεν βρίσκει id συνήθως γυρίζει 404
        setItem(null);
        setErr("Δεν βρέθηκε η δήλωση.");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26, mb: 2 }}>
            Καρτέλα Απώλειας Κατοικιδίου
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: `2px solid ${COLORS.panelBorder}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
              minHeight: 320,
            }}
          >
            {loading ? (
              <Typography sx={{ fontWeight: 900, color: COLORS.title }}>Φόρτωση...</Typography>
            ) : err ? (
              <Box>
                <Typography sx={{ fontWeight: 900, color: COLORS.title }}>{err}</Typography>
                <Typography
                  sx={{ mt: 1, color: COLORS.title, opacity: 0.7, cursor: "pointer" }}
                  onClick={() => navigate("/owner/declarations")}
                >
                  Επιστροφή στη λίστα
                </Typography>
              </Box>
            ) : !item ? (
              <Box>
                <Typography sx={{ fontWeight: 900, color: COLORS.title }}>Δεν βρέθηκε η δήλωση.</Typography>
                <Typography
                  sx={{ mt: 1, color: COLORS.title, opacity: 0.7, cursor: "pointer" }}
                  onClick={() => navigate("/owner/declarations")}
                >
                  Επιστροφή στη λίστα
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
                  gap: 3,
                  alignItems: "start",
                }}
              >
                {/* Image */}
                <Box
                  sx={{
                    width: 240,
                    height: 170,
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "#eef1f4",
                    border: "1px solid #d5deeb",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {item.photoDataUrl ? (
                    <Box
                      component="img"
                      src={item.photoDataUrl}
                      alt={item.petName || "pet"}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Typography sx={{ fontWeight: 800, color: "#6b7a90" }}>Φωτογραφία</Typography>
                  )}
                </Box>

                {/* Details */}
                <Box>
                  <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 28 }}>
                    {item.petName || item.breed || item.species || "Κατοικίδιο"}
                  </Typography>

                  <Box sx={{ height: 2, bgcolor: "#0b3d91", opacity: 0.25, my: 1.5 }} />

                  <Row label="Ημ. Απώλειας" value={fmtDate(item.date)} />
                  <Row label="Περιοχή" value={item.area} />

                  {/* LostWizard fields */}
                  <Row label="Φύλο" value={item.sex} />
                  <Row label="Φυλή/Είδος" value={item.breed || item.species} />
                  <Row label="Χρώμα" value={item.color} />
                  <Row label="Microchip" value={item.microchip} />

                  <Row
                    label="Ιδιοκτήτης"
                    value={`${item.firstName || ""} ${item.lastName || ""}`.trim() || "—"}
                  />
                  <Row label="Τηλ." value={item.phone} />
                  <Row label="Email" value={item.email} />
                  <Row label="Περιγραφή" value={item.notes} />
                </Box>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
