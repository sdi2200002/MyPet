// src/pages/vet/PetSearch.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  IconButton,
  TextField,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import InputAdornment from "@mui/material/InputAdornment";
import { useLocation, useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";

import { useAuth } from "../../auth/AuthContext";

/* ====== THEME ====== */
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const TITLE = "#0d2c54";
const MUTED = "#6b7a90";
const PANEL_BG = "#cfe3ff";
const PANEL_BORDER = "#8fb4e8";

/* ====== API ====== */
async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

function norm(s) {
  return String(s ?? "").trim().toLowerCase();
}
function digitsOnly(s) {
  return String(s ?? "").replace(/\D/g, "");
}

/* ====== CARD ====== */
function PetCard({ pet, onView }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "2px solid #c7d4e8",
        boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
        p: 1.6,
        display: "grid",
        gridTemplateColumns: "86px 1fr 140px",
        gap: 2,
        alignItems: "center",
        bgcolor: "#fff",
      }}
    >
      <Box
        component="img"
        src={pet.photo || "/images/demo-pet-avatar.png"}
        alt={pet.name || "Pet"}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/images/demo-pet-avatar.png";
        }}
        sx={{
          width: 74,
          height: 74,
          borderRadius: 2,
          objectFit: "cover",
          objectPosition: "center",
          border: "1px solid rgba(0,0,0,0.15)",
          bgcolor: "#fff",
        }}
      />

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900, color: "#111" }} noWrap>
          {pet.name || "—"}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 0.6, flexWrap: "wrap" }}>
          <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 12 }}>
            Είδος: {pet.species || "—"}
          </Typography>
          <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 12 }}>
            • Ράτσα: {pet.breed || "—"}
          </Typography>
        </Stack>

        <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: 12, mt: 0.4 }} noWrap>
          Μικροτσίπ: {pet.microchip || "—"}
        </Typography>

        {pet.ownerName || pet.owner?.name ? (
          <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12, mt: 0.3 }} noWrap>
            Ιδιοκτήτης: {pet.ownerName || pet.owner?.name}
          </Typography>
        ) : null}
      </Box>

      <Button
        variant="contained"
        onClick={onView}
        startIcon={<VisibilityOutlinedIcon />}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          bgcolor: PRIMARY,
          "&:hover": { bgcolor: PRIMARY_HOVER },
          fontWeight: 900,
        }}
      >
        Βιβλιάριο
      </Button>
    </Paper>
  );
}

export default function PetSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ✅ είσαι vet logged in;
  const role = (user?.role ?? user?.user?.role ?? "").toString().toLowerCase();
  const isVetLoggedIn = !!user && (role === "vet" || role === "κτηνίατρος");

  // filters
  const [microchip, setMicrochip] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 8;

  // ✅ Read query params
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setMicrochip(p.get("microchip") || "");
    setSpecies(p.get("species") || "");
    setBreed(p.get("breed") || "");
    setPage(1);
  }, [location.search]);

  // ✅ Load data
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // ⚠️ άλλαξε το endpoint αν στο backend σου είναι αλλιώς
        const petsData = await fetchJSON("/api/pets");

        if (!alive) return;
        setPets(Array.isArray(petsData) ? petsData : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("Αποτυχία φόρτωσης κατοικιδίων από τον server.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const chipQ = digitsOnly(microchip);
    const speciesQ = norm(species);
    const breedQ = norm(breed);

    return pets
      .filter((p) => {
        // microchip: match by “contains” digits-only
        if (chipQ) {
          const petChip = digitsOnly(p?.microchip);
          if (!petChip.includes(chipQ)) return false;
        }

        // species: exact compare (case-insensitive) if chosen
        if (speciesQ) {
          if (norm(p?.species) !== speciesQ) return false;
        }

        // breed: exact compare (case-insensitive) if chosen
        if (breedQ) {
          if (norm(p?.breed) !== breedQ) return false;
        }

        return true;
      })
      // μικρή προτεραιοποίηση: πρώτα όσα έχουν microchip
      .sort((a, b) => {
        const ac = digitsOnly(a?.microchip) ? 1 : 0;
        const bc = digitsOnly(b?.microchip) ? 1 : 0;
        if (bc !== ac) return bc - ac;
        return String(a?.name || "").localeCompare(String(b?.name || ""), "el");
      });
  }, [pets, microchip, species, breed]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const view = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hasFilters = useMemo(
    () => !!microchip.trim() || !!species.trim() || !!breed.trim(),
    [microchip, species, breed]
  );

  function applySearch() {
    const params = new URLSearchParams();
    if (microchip.trim()) params.set("microchip", microchip.trim());
    if (species) params.set("species", species);
    if (breed) params.set("breed", breed);

    // ✅ route που ήδη έχεις: /vet/pets
    navigate(`/vet/pets?${params.toString()}`);
  }

  function clearFilters() {
    setMicrochip("");
    setSpecies("");
    setBreed("");
    setPage(1);
    navigate("/vet/pets");
  }

  const pillSx = {
    minWidth: 180,
    bgcolor: "#fff",
    borderRadius: 999,
    "& .MuiOutlinedInput-root": { borderRadius: 999 },
    "& .MuiSelect-select": { fontWeight: 700, color: TITLE },
  };

  const placeholder = (t) => <span style={{ color: MUTED, fontWeight: 700 }}>{t}</span>;

  // προαιρετικά breeds dropdown ανά είδος (μπορείς να το επεκτείνεις)
  const breedOptions = useMemo(() => {
    const s = norm(species);
    if (s === "σκύλος" || s === "dog") return ["Λαμπραντόρ", "Γερμανικός Ποιμενικός", "Ημίαιμο"];
    if (s === "γάτα" || s === "cat") return ["Siamese", "Persian", "Ημίαιμο"];
    return ["Ημίαιμο"];
  }, [species]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      {/* ✅ Αν ΔΕΝ είσαι vet logged in -> καμία sidebar διάταξη */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "block", lg: isVetLoggedIn ? "flex" : "block" },
          alignItems: "flex-start",
        }}
      >
        {isVetLoggedIn ? (
          <>
            <Box
              sx={{
                width: VET_SIDEBAR_W,
                flex: `0 0 ${VET_SIDEBAR_W}px`,
                display: { xs: "none", lg: "block" },
                alignSelf: "flex-start",
              }}
            />
            <VetNavbar mode="navbar" />
          </>
        ) : null}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2.5 }}>
            <Box>
              <AppBreadcrumbs />
            </Box>

            <Paper
              elevation={0}
              sx={{
                bgcolor: PANEL_BG,
                borderRadius: 4,
                p: 2.5,
                border: `2px solid ${PANEL_BORDER}`,
              }}
            >
              <Typography sx={{ fontWeight: 900, color: TITLE, mb: 1.6 }}>
                Αναζήτηση Κατοικιδίων
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="center">
                <TextField
                  size="small"
                  value={microchip}
                  onChange={(e) => setMicrochip(e.target.value)}
                  placeholder="Μικροτσίπ"
                  sx={{
                    bgcolor: "white",
                    borderRadius: 999,
                    minWidth: { xs: "100%", md: 260 },
                    "& .MuiOutlinedInput-root": { borderRadius: 999 },
                    "& input::placeholder": { color: MUTED, opacity: 1, fontWeight: 700 },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeOutlinedIcon sx={{ color: MUTED }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl size="small" sx={pillSx}>
                  <Select
                    value={species}
                    displayEmpty
                    onChange={(e) => {
                      setSpecies(e.target.value);
                      setBreed(""); // reset breed when species changes
                    }}
                    startAdornment={<PetsOutlinedIcon sx={{ mr: 1, color: MUTED }} />}
                    renderValue={(v) => (v ? v : placeholder("Είδος"))}
                  >
                    <MenuItem value="">Είδος</MenuItem>
                    <MenuItem value="Σκύλος">Σκύλος</MenuItem>
                    <MenuItem value="Γάτα">Γάτα</MenuItem>
                    <MenuItem value="Άλλο">Άλλο</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={pillSx} disabled={!species}>
                  <Select
                    value={breed}
                    displayEmpty
                    onChange={(e) => setBreed(e.target.value)}
                    startAdornment={<PetsOutlinedIcon sx={{ mr: 1, color: MUTED }} />}
                    renderValue={(v) => (v ? v : placeholder("Φυλή"))}
                  >
                    <MenuItem value="">Φυλή</MenuItem>
                    {breedOptions.map((b) => (
                      <MenuItem key={b} value={b}>
                        {b}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={applySearch}
                  sx={{
                    ml: { md: "auto" },
                    borderRadius: 999,
                    bgcolor: PRIMARY,
                    "&:hover": { bgcolor: PRIMARY_HOVER },
                    fontWeight: 900,
                  }}
                >
                  Αναζήτηση
                </Button>

                {hasFilters && (
                  <IconButton
                    onClick={clearFilters}
                    aria-label="Καθαρισμός φίλτρων"
                    sx={{
                      ml: 0.6,
                      width: 42,
                      height: 42,
                      bgcolor: "white",
                      border: "1px solid rgba(0,0,0,0.12)",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                    }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 20, color: MUTED }} />
                  </IconButton>
                )}
              </Stack>
            </Paper>

            {loading && (
              <Paper
                elevation={0}
                sx={{
                  mt: 2.5,
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "#f6f8fb",
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
              >
                <Typography sx={{ color: MUTED, fontWeight: 700 }}>Φόρτωση...</Typography>
              </Paper>
            )}

            {!loading && err && (
              <Paper
                elevation={0}
                sx={{
                  mt: 2.5,
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "#fff3f3",
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
              >
                <Typography sx={{ color: "#b00020", fontWeight: 800 }}>{err}</Typography>
              </Paper>
            )}

            {!loading && !err && (
              <>
                <Stack spacing={1.8} sx={{ mt: 2.5 }}>
                  {view.length === 0 ? (
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.12)",
                        p: 2,
                        bgcolor: "#f6f8fb",
                      }}
                    >
                      <Typography sx={{ color: MUTED, fontWeight: 700 }}>
                        Δεν βρέθηκαν κατοικίδια.
                      </Typography>
                    </Paper>
                  ) : (
                    view.map((p) => (
                      <PetCard
                        key={p.id}
                        pet={p}
                        onView={() => navigate(`/vet/pets/${p.id}/booklet`)}
                      />
                    ))
                  )}
                </Stack>

                <Box sx={{ display: "flex", justifyContent: "right", mt: 1.5 }}>
                  <Pager
                    page={page}
                    pageCount={totalPages}
                    onChange={setPage}
                    color={PRIMARY}
                    maxButtons={4}
                  />
                </Box>
              </>
            )}
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
