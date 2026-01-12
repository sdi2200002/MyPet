import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
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

const LOST_KEY = "mypet_lost_declarations";

function safeLoad(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

const COLORS = {
  primary: "#0b3d91",
  primaryHover: "#08316f",
  panelBg: "#cfe3ff",
  panelBorder: "#8fb4e8",
  fieldBorder: "#a7b8cf",
  title: "#0d2c54",
  muted: "#6b7a90",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#fff",
    borderRadius: 999,
    "& fieldset": { borderColor: COLORS.fieldBorder },
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary },
};

// fallback demo items (μόνο αν το storage είναι άδειο)
const demoLost = [
  {
    id: "demo1",
    status: "Οριστική",
    petName: "Σκύλος",
    date: "2025-10-12",
    area: "Αθήνα",
    sex: "Αρσενικό",
    species: "Σκύλος",
    color: "Καφέ",
    notes: "Φορούσε κόκκινο λουράκι.",
    photoDataUrl: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo2",
    status: "Οριστική",
    petName: "Γάτα",
    date: "2025-11-10",
    area: "Παγκράτι",
    sex: "Θηλυκό",
    species: "Γάτα",
    color: "Λευκό",
    notes: "Μικρόσωμη, πολύ φιλική.",
    photoDataUrl: "",
    createdAt: new Date().toISOString(),
  },
];

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
          <Typography sx={{ fontWeight: 800, color: COLORS.muted }}>Φωτογραφία ζώου</Typography>
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

export default function LostPets() {
  const navigate = useNavigate();

  // Φίλτρα
  const [area, setArea] = useState("");
  const [species, setSpecies] = useState("");
  const [sex, setSex] = useState("");
  const [color, setColor] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Πάρε public lost (μόνο Οριστική)
    const allLost = useMemo(() => {
    let stored = safeLoad(LOST_KEY);

    // ✅ Αν δεν υπάρχει τίποτα στο localStorage, βάλε τα demoLost ΜΙΑ φορά μέσα
    if (!stored.length) {
        stored = demoLost.map((x) => ({ ...x }));
        localStorage.setItem(LOST_KEY, JSON.stringify(stored));
    }

    return stored
        .filter((x) => (x?.status || "Πρόχειρη") === "Οριστική")
        .map((x) => ({ ...x, type: "lost" }))
        .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    }, []);


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

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Typography sx={{ fontWeight: 900, color: COLORS.title, fontSize: 26, mb: 2 }}>
            Απολεσθέντα Κατοικίδια
          </Typography>

          {/* Search panel */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 4,
              bgcolor: COLORS.panelBg,
              border: `2px solid ${COLORS.panelBorder}`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
            }}
          >
            <Typography sx={{ fontWeight: 900, color: COLORS.title, mb: 1 }}>
              Αναζήτηση Απολεσθέντων Κατοικιδίων
            </Typography>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Περιοχή</InputLabel>
                <Select
                  value={area}
                  label="Περιοχή"
                  onChange={(e) => setArea(e.target.value)}
                  startAdornment={<LocationOnOutlinedIcon sx={{ mr: 1, color: COLORS.primary }} />}
                >
                  <MenuItem value="">Όλες</MenuItem>
                  <MenuItem value="Αθήνα">Αθήνα</MenuItem>
                  <MenuItem value="Παγκράτι">Παγκράτι</MenuItem>
                  <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
                  <MenuItem value="Πάτρα">Πάτρα</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Είδος Ζώου</InputLabel>
                <Select
                  value={species}
                  label="Είδος Ζώου"
                  onChange={(e) => setSpecies(e.target.value)}
                  startAdornment={<PetsOutlinedIcon sx={{ mr: 1, color: COLORS.primary }} />}
                >
                  <MenuItem value="">Όλα</MenuItem>
                  <MenuItem value="Σκύλος">Σκύλος</MenuItem>
                  <MenuItem value="Γάτα">Γάτα</MenuItem>
                  <MenuItem value="Άλλο">Άλλο</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Φύλο</InputLabel>
                <Select
                  value={sex}
                  label="Φύλο"
                  onChange={(e) => setSex(e.target.value)}
                  startAdornment={<WcOutlinedIcon sx={{ mr: 1, color: COLORS.primary }} />}
                >
                  <MenuItem value="">Όλα</MenuItem>
                  <MenuItem value="Αρσενικό">Αρσενικό</MenuItem>
                  <MenuItem value="Θηλυκό">Θηλυκό</MenuItem>
                  <MenuItem value="Άγνωστο">Άγνωστο</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Χρώμα"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  startAdornment: <PaletteOutlinedIcon sx={{ mr: 1, color: COLORS.primary }} />,
                }}
              />

              <Button
                onClick={doSearch}
                variant="contained"
                startIcon={<SearchIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: 3,
                  bgcolor: COLORS.primary,
                  "&:hover": { bgcolor: COLORS.primaryHover },
                  boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
                  minWidth: 140,
                }}
              >
                Αναζήτηση
              </Button>
            </Stack>
          </Paper>

          {/* Cards grid */}
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

          {/* Pagination */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              shape="rounded"
            />
          </Box>
        </Container>
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          <Typography sx={{ mt: 4, fontSize: 26, fontWeight: 900, color: "#0d2c54" }}>
            Εύρεση κατοικιδίου
          </Typography>

          {/* steps */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={4}
            sx={{ mt: 6 }}
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

          {/* CTA button */}
          <Stack alignItems="center" sx={{ mt: 5 }}>
            <Button
              variant="contained"
              onClick={() => navigate("/lost/new")}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                bgcolor: "#0b3d91",
                "&:hover": { bgcolor: "#08316f" },
                boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
              }}
            >
              + Δήλωση Εύρεσης
            </Button>
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
