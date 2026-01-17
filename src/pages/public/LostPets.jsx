import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CampaignIcon from "@mui/icons-material/Campaign";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import WcOutlinedIcon from "@mui/icons-material/WcOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const COLORS = {
  primary: "#0b3d91",
  primaryHover: "#08316f",
  panelBg: "#cfe3ff",
  panelBorder: "#8fb4e8",
  fieldBorder: "#a7b8cf",
  title: "#0d2c54",
  muted: "#6b7a90",
};

function PetCard({ item, onOpen }) {
  return (
    <Paper
      onClick={onOpen}
      elevation={0}
      sx={{
        cursor: "pointer",
        borderRadius: 2,
        overflow: "hidden",
        border: "2px solid #c7d4e8",
        boxShadow: "0 6px 16px rgba(0,0,0,0.10)",
        bgcolor: "#fff",
        "&:hover": { transform: "translateY(-2px)" },
        transition: "transform 160ms ease",
      }}
    >
      <Box
        sx={{
          height: 140,
          bgcolor: "#eef1f4",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
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
          <Typography sx={{ fontWeight: 800, color: COLORS.muted }}>
            Φωτογραφία ζώου
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 1.2 }}>
        <Typography sx={{ fontWeight: 900, color: COLORS.title, mb: 0.5 }} noWrap>
          {item.petName || item.species || "Κατοικίδιο"}
        </Typography>

        <Typography sx={{ fontSize: 12, color: COLORS.title }}>
          Περιοχή: <b>{item.area || "—"}</b>
        </Typography>
        <Typography sx={{ fontSize: 12, color: COLORS.title }}>
          Ημ/νία: <b>{item.date || "—"}</b>
        </Typography>

        <Box sx={{ mt: 1 }}>
          <Typography
            sx={{
              fontSize: 12,
              color: COLORS.muted,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 32,
            }}
          >
            {item.notes || "περιγραφή"}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function StepCard({ icon, title, text }) {
  return (
    <Stack alignItems="center" spacing={2} sx={{ textAlign: "center", maxWidth: 260 }}>
      <Paper
        elevation={0}
        sx={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          bgcolor: "#b8c9e6",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Paper>

      <Typography sx={{ fontWeight: 800, color: "#0d2c54" }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: "#4b5b6b" }}>
        {text}
      </Typography>
    </Stack>
  );
}

/** μικρό helper για να κάνει string match */
function includesText(hay, needle) {
  if (!needle) return true;
  return String(hay || "").toLowerCase().includes(String(needle).toLowerCase());
}

export default function LostPets() {
  const navigate = useNavigate();

  // ---------- LOST FILTERS ----------
  const [area, setArea] = useState("");
  const [species, setSpecies] = useState("");
  const [sex, setSex] = useState("");
  const [color, setColor] = useState("");

  const [allLost, setAllLost] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 4;

  // ---------- FOUND FILTERS (ίδια λογική/φίλτρα με LOST) ----------
  const [foundArea, setFoundArea] = useState("");
  const [foundSpecies, setFoundSpecies] = useState("");
  const [foundSex, setFoundSex] = useState("");
  const [foundColor, setFoundColor] = useState("");

  const [foundAll, setFoundAll] = useState([]);
  const [foundLoading, setFoundLoading] = useState(true);
  const [foundErr, setFoundErr] = useState("");

  const [foundPage, setFoundPage] = useState(1);
  const foundPageSize = 4;

  // ✅ Load LOST
  useEffect(() => {
    let alive = true;

    async function loadLost() {
      try {
        setLoading(true);
        setError("");

        // ⬅️ άλλαξε το endpoint αν θες (ιδανικά: /api/lostDeclarations)
        const res = await fetch("/db.json");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();

        const items = Array.isArray(json?.lostDeclarations)
          ? json.lostDeclarations
          : Array.isArray(json)
          ? json
          : [];

        const normalized = items
          .filter((x) => (x?.status || "") === "Οριστική")
          .map((x) => ({
            ...x,
            species: x?.breedOrSpecies || x?.species || "",
            type: "lost",
          }))
          .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

        if (alive) setAllLost(normalized);
      } catch (e) {
        if (alive) setError(e?.message || "Κάτι πήγε στραβά στο φόρτωμα.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadLost();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ Load FOUND (για τις καρτέλες κάτω από “Δήλωση Εύρεσης”)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setFoundLoading(true);
        setFoundErr("");

        // ⬅️ άλλαξε το endpoint αν θες (ιδανικά: /api/foundDeclarations)
        const res = await fetch("/db.json");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();

        const items = Array.isArray(json?.foundDeclarations) ? json.foundDeclarations : [];

        const normalized = items
          .filter((x) => (x?.status || "") === "Οριστική")
          .map((x) => ({
            ...x,
            species: x?.breedOrSpecies || x?.species || "",
            type: "found",
          }))
          .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

        if (alive) setFoundAll(normalized);
      } catch (e) {
        if (alive) setFoundErr(e?.message || "Αποτυχία φόρτωσης ευρεθέντων.");
      } finally {
        if (alive) setFoundLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ---------- LOST FILTERING ----------
  const filtered = useMemo(() => {
    return allLost.filter((x) => {
      const okArea = !area || (x.area || "").toLowerCase() === area.toLowerCase();
      const okSpecies = !species || (x.species || "").toLowerCase() === species.toLowerCase();
      const okSex = !sex || (x.sex || "").toLowerCase() === sex.toLowerCase();
      const okColor = !color || (x.color || "").toLowerCase().includes(color.toLowerCase());
      return okArea && okSpecies && okSex && okColor;
    });
  }, [allLost, area, species, sex, color]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  function doSearch() {
    setPage(1);
  }

  const hasActiveFilters = useMemo(() => {
    return !!area || !!species || !!sex || !!(color || "").trim();
  }, [area, species, sex, color]);

  function clearFilters() {
    setArea("");
    setSpecies("");
    setSex("");
    setColor("");
    setPage(1);
  }

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // ---------- FOUND FILTERING (ίδια φίλτρα με LOST) ----------
  const foundFiltered = useMemo(() => {
    return (foundAll || []).filter((x) => {
      const okArea = !foundArea || String(x?.area || "").toLowerCase() === String(foundArea).toLowerCase();
      const okSpecies =
        !foundSpecies || String(x?.species || "").toLowerCase() === String(foundSpecies).toLowerCase();
      const okSex = !foundSex || String(x?.sex || "").toLowerCase() === String(foundSex).toLowerCase();
      const okColor =
        !foundColor || String(x?.color || "").toLowerCase().includes(String(foundColor).toLowerCase());
      return okArea && okSpecies && okSex && okColor;
    });
  }, [foundAll, foundArea, foundSpecies, foundSex, foundColor]);

  const foundTotalPages = Math.max(1, Math.ceil(foundFiltered.length / foundPageSize));
  const foundPaged = useMemo(() => {
    const start = (foundPage - 1) * foundPageSize;
    return foundFiltered.slice(start, start + foundPageSize);
  }, [foundFiltered, foundPage]);

  function doFoundSearch() {
    setFoundPage(1);
  }

  const foundHasActiveFilters = useMemo(() => {
    return !!foundArea || !!foundSpecies || !!foundSex || !!(foundColor || "").trim();
  }, [foundArea, foundSpecies, foundSex, foundColor]);

  function clearFoundFilters() {
    setFoundArea("");
    setFoundSpecies("");
    setFoundSex("");
    setFoundColor("");
    setFoundPage(1);
  }

  useEffect(() => {
    if (foundPage > foundTotalPages) setFoundPage(foundTotalPages);
  }, [foundPage, foundTotalPages]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ mt: 2, pb: 3 }}>
          <AppBreadcrumbs />

          {/* SEARCH BAR (LOST) */}
          <Paper elevation={0} sx={{ bgcolor: "#cfe0f7", borderRadius: 4, p: 2.2, mt: 1.5 }}>
            <Typography sx={{ fontWeight: 800, mb: 1.8, color: "#1c2b39" }}>
              Αναζήτηση Απολεσθέντων Κατοικιδίων
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.6} alignItems="center">
              <FormControl
                size="small"
                hiddenLabel
                sx={{
                  minWidth: 170,
                  bgcolor: "white",
                  borderRadius: 999,
                  "& .MuiOutlinedInput-root": { borderRadius: 999 },
                }}
              >
                <Select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <LocationOnOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
                    </InputAdornment>
                  }
                  renderValue={(selected) => (
                    <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>{selected || "Περιοχή"}</span>
                  )}
                >
                  <MenuItem value="">Όλες</MenuItem>
                  <MenuItem value="Αθήνα">Αθήνα</MenuItem>
                  <MenuItem value="Παγκράτι">Παγκράτι</MenuItem>
                  <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
                  <MenuItem value="Πάτρα">Πάτρα</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                size="small"
                hiddenLabel
                sx={{
                  minWidth: 170,
                  bgcolor: "white",
                  borderRadius: 999,
                  "& .MuiOutlinedInput-root": { borderRadius: 999 },
                }}
              >
                <Select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <PetsOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
                    </InputAdornment>
                  }
                  renderValue={(selected) => (
                    <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>{selected || "Είδος"}</span>
                  )}
                >
                  <MenuItem value="">Όλα</MenuItem>
                  <MenuItem value="Σκύλος">Σκύλος</MenuItem>
                  <MenuItem value="Γάτα">Γάτα</MenuItem>
                  <MenuItem value="Άλλο">Άλλο</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                size="small"
                hiddenLabel
                sx={{
                  minWidth: 170,
                  bgcolor: "white",
                  borderRadius: 999,
                  "& .MuiOutlinedInput-root": { borderRadius: 999 },
                }}
              >
                <Select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <WcOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
                    </InputAdornment>
                  }
                  renderValue={(selected) => (
                    <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>{selected || "Φύλο"}</span>
                  )}
                >
                  <MenuItem value="">Όλα</MenuItem>
                  <MenuItem value="Αρσενικό">Αρσενικό</MenuItem>
                  <MenuItem value="Θηλυκό">Θηλυκό</MenuItem>
                  <MenuItem value="Άγνωστο">Άγνωστο</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Χρώμα"
                sx={{
                  bgcolor: "white",
                  borderRadius: 999,
                  minWidth: 230,
                  "& .MuiOutlinedInput-root": { borderRadius: 999 },
                  "& input::placeholder": { color: "#6b7a90", opacity: 1 },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PaletteOutlinedIcon sx={{ color: "#6b7a90" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={doSearch}
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: 3.2,
                  ml: { md: "auto" },
                  bgcolor: COLORS.primary,
                  "&:hover": { bgcolor: COLORS.primaryHover },
                  boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                  minWidth: 140,
                  fontWeight: 800,
                }}
              >
                Αναζήτηση
              </Button>

              {hasActiveFilters && (
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
                  <CloseRoundedIcon sx={{ fontSize: 20, color: "#6b7a90" }} />
                </IconButton>
              )}
            </Stack>
          </Paper>
          {/* LOST: Loading / Error */}
          {loading && (
            <Typography sx={{ mt: 2, color: COLORS.muted, fontWeight: 800 }}>
              Φόρτωση δηλώσεων...
            </Typography>
          )}

          {!!error && (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                border: "1px solid rgba(180,35,24,0.35)",
                bgcolor: "rgba(180,35,24,0.06)",
              }}
            >
              <Typography sx={{ fontWeight: 900, color: "#b42318" }}>Αποτυχία φόρτωσης</Typography>
              <Typography sx={{ color: "#7a1b14" }}>{error}</Typography>
            </Paper>
          )}

          {/* LOST Cards */}
          {!loading && !error && (
            <>
              <Box
                sx={{
                  mt: 3,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                {paged.map((item) => (
                  <PetCard key={item.id} item={item} onOpen={() => navigate(`/lost/${item.id}`)} />
                ))}
              </Box>

              {filtered.length === 0 && (
                <Typography sx={{ mt: 2, color: COLORS.muted, fontWeight: 800 }}>
                  Δεν βρέθηκαν δηλώσεις με τα φίλτρα που επέλεξες.
                </Typography>
              )}

              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} shape="rounded" />
              </Box>
            </>
          )}
          <Divider sx={{ my: 4 }} />
          {/* SECTION: Εύρεση κατοικιδίου (⬇️ χαμήλωσε όλο το section) */}
          <Box sx={{ mt: 6 }}>
            <Typography sx={{ mt: 0, fontSize: 26, fontWeight: 900, color: "#0d2c54" }}>
              Εύρεση κατοικιδίου
            </Typography>

            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={4}
              sx={{ mt: 2.2 }}
            >
              <StepCard
                icon={<SearchIcon sx={{ fontSize: 52, color: "#0b3d91" }} />}
                title="1. Συγκέντρωση Στοιχείων"
                text="Δείτε αν το ζώο που βρήκατε έχει κάποια ιδιαίτερα χαρακτηριστικά και καταγράψτε τα."
              />
              <StepCard
                icon={<EditNoteIcon sx={{ fontSize: 52, color: "#0b3d91" }} />}
                title="2. Συνθήκες Εύρεσης"
                text="Τραβήξτε μια καθαρή φωτογραφία και σημειώστε την τοποθεσία και την ημερομηνία εύρεσης."
              />
              <StepCard
                icon={<CampaignIcon sx={{ fontSize: 52, color: "#0b3d91" }} />}
                title="3. Κάντε αναφορά εύρεσης"
                text="Συμπληρώστε τη σύντομη φόρμα για να ενημερωθεί ο ιδιοκτήτης."
              />
            </Stack>

            {/* ✅ BUTTON */}
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => navigate("/found/new")}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  bgcolor: COLORS.primary,
                  "&:hover": { bgcolor: COLORS.primaryHover },
                  boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                  fontWeight: 900,
                }}
              >
                + Δήλωση Εύρεσης
              </Button>
            </Stack>

            {/* ✅ SEARCH BAR (FOUND) — ίδια φίλτρα + ίδιος καθαρισμός με LOST */}
            <Paper elevation={0} sx={{ bgcolor: "#cfe0f7", borderRadius: 4, p: 2.2, mt: 5 }}>
              <Typography sx={{ fontWeight: 900, color: "#1c2b39", mb: 1.2 }}>
                Δηλώσεις Εύρεσης
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.6} alignItems="center">
                <FormControl
                  size="small"
                  hiddenLabel
                  sx={{
                    minWidth: 170,
                    bgcolor: "white",
                    borderRadius: 999,
                    "& .MuiOutlinedInput-root": { borderRadius: 999 },
                  }}
                >
                  <Select
                    value={foundArea}
                    onChange={(e) => setFoundArea(e.target.value)}
                    displayEmpty
                    startAdornment={
                      <InputAdornment position="start">
                        <LocationOnOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
                      </InputAdornment>
                    }
                    renderValue={(selected) => (
                      <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                        {selected || "Περιοχή"}
                      </span>
                    )}
                  >
                    <MenuItem value="">Όλες</MenuItem>
                    <MenuItem value="Αθήνα">Αθήνα</MenuItem>
                    <MenuItem value="Παγκράτι">Παγκράτι</MenuItem>
                    <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
                    <MenuItem value="Πάτρα">Πάτρα</MenuItem>
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  hiddenLabel
                  sx={{
                    minWidth: 170,
                    bgcolor: "white",
                    borderRadius: 999,
                    "& .MuiOutlinedInput-root": { borderRadius: 999 },
                  }}
                >
                  <Select
                    value={foundSpecies}
                    onChange={(e) => setFoundSpecies(e.target.value)}
                    displayEmpty
                    startAdornment={
                      <InputAdornment position="start">
                        <PetsOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
                      </InputAdornment>
                    }
                    renderValue={(selected) => (
                      <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                        {selected || "Είδος"}
                      </span>
                    )}
                  >
                    <MenuItem value="">Όλα</MenuItem>
                    <MenuItem value="Σκύλος">Σκύλος</MenuItem>
                    <MenuItem value="Γάτα">Γάτα</MenuItem>
                    <MenuItem value="Άλλο">Άλλο</MenuItem>
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  hiddenLabel
                  sx={{
                    minWidth: 170,
                    bgcolor: "white",
                    borderRadius: 999,
                    "& .MuiOutlinedInput-root": { borderRadius: 999 },
                  }}
                >
                  <Select
                    value={foundSex}
                    onChange={(e) => setFoundSex(e.target.value)}
                    displayEmpty
                    startAdornment={
                      <InputAdornment position="start">
                        <WcOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
                      </InputAdornment>
                    }
                    renderValue={(selected) => (
                      <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                        {selected || "Φύλο"}
                      </span>
                    )}
                  >
                    <MenuItem value="">Όλα</MenuItem>
                    <MenuItem value="Αρσενικό">Αρσενικό</MenuItem>
                    <MenuItem value="Θηλυκό">Θηλυκό</MenuItem>
                    <MenuItem value="Άγνωστο">Άγνωστο</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  value={foundColor}
                  onChange={(e) => setFoundColor(e.target.value)}
                  placeholder="Χρώμα"
                  sx={{
                    bgcolor: "white",
                    borderRadius: 999,
                    minWidth: 230,
                    "& .MuiOutlinedInput-root": { borderRadius: 999 },
                    "& input::placeholder": { color: "#6b7a90", opacity: 1 },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PaletteOutlinedIcon sx={{ color: "#6b7a90" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={doFoundSearch}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    px: 3.2,
                    ml: { md: "auto" },
                    bgcolor: COLORS.primary,
                    "&:hover": { bgcolor: COLORS.primaryHover },
                    boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                    minWidth: 140,
                    fontWeight: 800,
                  }}
                >
                  Αναζήτηση
                </Button>

                {foundHasActiveFilters && (
                  <IconButton
                    onClick={clearFoundFilters}
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
                    <CloseRoundedIcon sx={{ fontSize: 20, color: "#6b7a90" }} />
                  </IconButton>
                )}
              </Stack>
            </Paper>

            {/* FOUND: loading/error/cards */}
            {foundLoading ? (
              <Typography sx={{ mt: 2, color: COLORS.muted, fontWeight: 800 }}>
                Φόρτωση δηλώσεων εύρεσης...
              </Typography>
            ) : foundErr ? (
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(180,35,24,0.35)",
                  bgcolor: "rgba(180,35,24,0.06)",
                }}
              >
                <Typography sx={{ fontWeight: 900, color: "#b42318" }}>
                  Αποτυχία φόρτωσης (εύρεσης)
                </Typography>
                <Typography sx={{ color: "#7a1b14" }}>{foundErr}</Typography>
              </Paper>
            ) : (
              <>
                <Box
                  sx={{
                    mt: 2,
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                    gap: 2,
                  }}
                >
                  {foundPaged.map((item) => (
                    <PetCard
                      key={`found-${item.id}`}
                      item={item}
                      onOpen={() => navigate(`/found/${item.id}`)}
                    />
                  ))}
                </Box>

                {foundFiltered.length === 0 && (
                  <Typography sx={{ mt: 2, color: COLORS.muted, fontWeight: 800 }}>
                    Δεν υπάρχουν δηλώσεις εύρεσης με αυτά τα φίλτρα.
                  </Typography>
                )}

                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Pagination
                    count={foundTotalPages}
                    page={foundPage}
                    onChange={(_, p) => setFoundPage(p)}
                    shape="rounded"
                  />
                </Box>
              </>
            )}
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
