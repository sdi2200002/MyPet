import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import { useAuth } from "../../auth/AuthContext"; // ✅ το δικό σου AuthContext

const dog1 = "/images/dog1.png";
const cat1 = "/images/cat1.png";

const TITLE = "#0d2c54";
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const MUTED = "#6b7a90";

function isValidPhoto(p) {
  return typeof p === "string" && (p.startsWith("/") || p.startsWith("data:") || p.startsWith("http"));
}
function isCatSpecies(species) {
  const s = (species || "").toString().trim().toLowerCase();
  return s.includes("γάτ") || s.includes("cat");
}
function getPetPhoto(pet) {
  if (isValidPhoto(pet?.photo)) return pet.photo;
  return isCatSpecies(pet?.species) ? cat1 : dog1;
}
function getFallbackPhoto(pet) {
  return isCatSpecies(pet?.species) ? cat1 : dog1;
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function PetRow({ pet, onOpenBooklet }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "2px solid #8fb4e8",
        boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          component="img"
          src={getPetPhoto(pet)}
          alt={pet?.name || "pet"}
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            objectFit: "cover",
            border: "1px solid rgba(0,0,0,0.15)",
            bgcolor: "#fff",
          }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackPhoto(pet);
          }}
        />

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 20, lineHeight: 1.1 }}>
            {pet?.name || "—"}
          </Typography>

          <Stack spacing={0.2} sx={{ mt: 0.6 }}>
            <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 13 }}>
              Microchip: {pet?.microchip || "—"}
            </Typography>
            <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 13 }}>
              {pet?.breed || pet?.species || "—"}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Button
        variant="contained"
        onClick={onOpenBooklet}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          bgcolor: PRIMARY,
          "&:hover": { bgcolor: PRIMARY_HOVER },
          fontWeight: 900,
          boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
          px: 2.2,
          py: 1.1,
          lineHeight: 1.1,
        }}
      >
        Βιβλιάριο
        <br />
        Υγείας
      </Button>
    </Paper>
  );
}

export default function MyPets() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [q, setQ] = useState("");
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      if (!user?.id) {
        if (!alive) return;
        setPets([]);
        setErr("Δεν υπάρχει συνδεδεμένος χρήστης.");
        setLoading(false);
        return;
      }

      // ✅ μόνο τα pets αυτού του owner
      const data = await fetchJSON(`/api/pets?ownerId=${encodeURIComponent(String(user.id))}`);

      if (!alive) return;
      setPets(Array.isArray(data) ? data : []);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (!alive) return;
      setErr("Αποτυχία φόρτωσης κατοικιδίων από τον server.");
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [user?.id]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return pets;

    return pets.filter((p) => {
      const hay = `${p.name || ""} ${p.breed || ""} ${p.species || ""} ${p.microchip || ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [pets, q]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 26 }}>
            Τα Κατοικίδια μου
          </Typography>
          <Typography sx={{ color: MUTED, fontWeight: 600, mt: 0.5 }}>
            Εδώ θα βρείτε όλα τα κατοικίδια σας.
          </Typography>

          <Box sx={{ mt: 2.2, mb: 2 }}>
            <TextField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Αναζήτηση"
              size="small"
              sx={{
                width: 230,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 999,
                  bgcolor: "#d8e7ff",
                  border: "1px solid #8fb4e8",
                },
                "& input::placeholder": { color: "#2f3a4a", opacity: 0.7, fontWeight: 700 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#2f3a4a", opacity: 0.7 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {loading && (
            <Paper elevation={0} sx={{ borderRadius: 2, p: 2, bgcolor: "#f6f8fb", border: "1px solid rgba(0,0,0,0.12)" }}>
              <Typography sx={{ color: MUTED, fontWeight: 700 }}>Φόρτωση...</Typography>
            </Paper>
          )}

          {!loading && err && (
            <Paper elevation={0} sx={{ borderRadius: 2, p: 2, bgcolor: "#fff3f3", border: "1px solid rgba(0,0,0,0.12)" }}>
              <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>
            </Paper>
          )}

          {!loading && !err && (
            <Stack spacing={2}>
              {filtered.length === 0 ? (
                <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid rgba(0,0,0,0.12)", p: 2, bgcolor: "#f6f8fb" }}>
                  <Typography sx={{ color: MUTED, fontWeight: 700 }}>Δεν βρέθηκαν κατοικίδια.</Typography>
                </Paper>
              ) : (
                filtered.map((pet) => (
                  <PetRow
                    key={pet.id}
                    pet={pet}
                    onOpenBooklet={() => navigate(`/owner/pets/${pet.id}/booklet`)}
                  />
                ))
              )}
            </Stack>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
