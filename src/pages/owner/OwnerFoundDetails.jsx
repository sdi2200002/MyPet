import { Box, Container, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import OwnerNavbar from "../../components/OwnerNavbar";

const COLORS = {
  title: "#0d2c54",
  panelBorder: "#8fb4e8",
  link: "#0b3d91",
};

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 2, py: 0.6 }}>
      <Typography sx={{ fontWeight: 900, color: COLORS.title }}>{label}:</Typography>
      <Typography sx={{ color: COLORS.title }}>{value || "—"}</Typography>
    </Box>
  );
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("el-GR");
}

export default function OwnerFoundDetails() {
  const { id } = useParams(); // foundDeclaration id

  const [found, setFound] = useState(null);
  const [lost, setLost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const f = await fetchJSON(`/api/foundDeclarations/${encodeURIComponent(String(id))}`);
        if (!alive) return;
        setFound(f);

        if (f?.lostDeclarationId) {
          const l = await fetchJSON(
            `/api/lostDeclarations/${encodeURIComponent(String(f.lostDeclarationId))}`
          );
          if (!alive) return;
          setLost(l);
        } else {
          setLost(null);
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("Δεν βρέθηκε η δήλωση εύρεσης.");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      {/* ✅ Owner layout: sidebar/topbar */}
      <OwnerNavbar />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26, mb: 2 }}>
          Δήλωση Εύρεσης
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: `2px solid ${COLORS.panelBorder}`,
            boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
          }}
        >
          {loading ? (
            <Typography sx={{ fontWeight: 900, color: COLORS.title }}>Φόρτωση...</Typography>
          ) : err ? (
            <Typography sx={{ fontWeight: 900, color: COLORS.title }}>{err}</Typography>
          ) : (
            <>
              <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 20, mb: 1 }}>
                Στοιχεία ατόμου που βρήκε το κατοικίδιο
              </Typography>

              <Row label="Όνομα" value={`${found.firstName || ""} ${found.lastName || ""}`.trim()} />
              <Row label="Τηλέφωνο" value={found.phone} />
              <Row label="Email" value={found.email} />
              <Row label="Περιοχή εύρεσης" value={found.area} />
              <Row label="Ημ/νία εύρεσης" value={fmtDate(found.date)} />
              <Row label="Μήνυμα" value={found.notes} />

              {lost?.id && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 900, color: COLORS.title, mb: 0.5 }}>
                    Σχετική δήλωση απώλειας
                  </Typography>

                  {/* ✅ ΣΩΣΤΟ PATH ΓΙΑ OWNER */}
                  <Typography
                    sx={{ color: COLORS.link, fontWeight: 900, cursor: "pointer" }}
                    onClick={() => (window.location.href = `/lost/${lost.id}`)}
                  >
                    Άνοιγμα καρτέλας απώλειας: {lost.petName || "Κατοικίδιο"}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
