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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import { useNavigate } from "react-router-dom";
import PublicNavbar from "../../components/PublicNavbar";
import OwnerNavbar from "../../components/OwnerNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";


/* ====== THEME ====== */
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const TITLE = "#0d2c54";
const MUTED = "#6b7a90";
const PANEL_BG = "#cfe3ff";
const PANEL_BORDER = "#8fb4e8";

/* ====== STORAGE ====== */
const VETS_KEY = "mypet_vets";

function safeLoad(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
function safeSave(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ====== SEED ====== */
function seedVetsIfMissing() {
  const existing = safeLoad(VETS_KEY, []);
  if (existing.length) return;

  const demo = [
    {
      id: "vet_kyriaki",
      name: "Κυριακή Νικολάου",
      clinic: "Κλινική μικρών ζώων",
      rating: 4.8,
      reviewsCount: 120,
      priceRange: "40€ - 50€",
      specialty: "Γενικός",
      area: "Αθήνα",
      address: "Λεωφόρος Κηφισίας 124, Αμπελόκηποι",
      phone: "6900000000",
      email: "doc@gmail.com",
      experience: "10+ χρόνια",
      studies:
        "Πτυχίο Κτηνιατρικής – ΑΠΘ",
      photo: "/images/vet1.png",
    },
    {
      id: "vet_demo_2",
      name: "Ονοματεπώνυμο",
      clinic: "—",
      rating: 4.4,
      reviewsCount: 38,
      priceRange: "30€ - 45€",
      specialty: "Χειρουργός",
      area: "Πειραιάς",
      photo: "",
    },
    {
      id: "vet_demo_3",
      name: "Ονοματεπώνυμο",
      clinic: "—",
      rating: 4.2,
      reviewsCount: 16,
      priceRange: "35€ - 60€",
      specialty: "Δερματολόγος",
      area: "Θεσσαλονίκη",
      photo: "",
    },
    {
      id: "vet_demo_3",
      name: "Ονοματεπώνυμο",
      clinic: "—",
      rating: 4.2,
      reviewsCount: 16,
      priceRange: "35€ - 60€",
      specialty: "Δερματολόγος",
      area: "Θεσσαλονίκη",
      photo: "",
    },
  ];

  safeSave(VETS_KEY, demo);
}

/* ====== CARD ====== */
function VetCard({ vet, onView }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "2px solid #c7d4e8",
        boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
        p: 1.6,
        display: "grid",
        gridTemplateColumns: "86px 1fr 120px",
        gap: 2,
        alignItems: "center",
      }}
    >
      <Box
        component="img"
        src={vet.photo || "/images/demo-vet-avatar.png"}
        alt={vet.name}
        onError={(e) => {
          e.currentTarget.src = "/images/demo-vet-avatar.png";
        }}
        sx={{
          width: 74,
          height: 74,
          borderRadius: 2,
          objectFit: "cover",
          border: "1px solid rgba(0,0,0,0.15)",
          bgcolor: "#fff",
        }}
      />

      <Box>
        <Typography sx={{ fontWeight: 900, color: "#111" }}>{vet.name}</Typography>
        <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>
          {vet.clinic}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 0.6 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 12 }}>
            ⭐ {vet.rating}
          </Typography>
          <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12 }}>
            ({vet.reviewsCount})
          </Typography>
        </Stack>

        <Typography sx={{ color: MUTED, fontWeight: 700, fontSize: 12, mt: 0.4 }}>
          Ιδιωτικό Ιατρείο: {vet.priceRange}
        </Typography>
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
        Προβολή
      </Button>
    </Paper>
  );
}

/* ====== PAGE ====== */
export default function VetSearch() {
  const navigate = useNavigate();

  useEffect(() => {
    seedVetsIfMissing();
  }, []);

  const vets = useMemo(() => safeLoad(VETS_KEY, []), []);

  const [area, setArea] = useState("");
  const [spec, setSpec] = useState("");

  const filtered = useMemo(() => {
    return vets.filter((v) => {
      if (area && v.area !== area) return false;
      if (spec && v.specialty !== spec) return false;
      return true;
    });
  }, [vets, area, spec]);

  const pillSx = {
    minWidth: 160,
    bgcolor: "#fff",
    borderRadius: 999,
    "& .MuiOutlinedInput-root": { borderRadius: 999 },
    "& .MuiSelect-select": { fontWeight: 700, color: TITLE },
  };
  const placeholder = (t) => <span style={{ color: MUTED, fontWeight: 700 }}>{t}</span>;

  const [page, setPage] = useState(1);
  const perPage = 8; // άλλαξέ το όπως θες (π.χ. 4 ή 6)

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const view = filtered.slice((page - 1) * perPage, page * perPage);
  if (page > totalPages) setPage(totalPages);

  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

      <Container maxWidth="lg" sx={{ py: 2.5, flex: 1 }}>
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
            Αναζήτηση Κτηνιάτρων
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
            <FormControl size="small" sx={pillSx}>
              <Select
                value={area}
                displayEmpty
                onChange={(e) => setArea(e.target.value)}
                startAdornment={<LocationOnOutlinedIcon sx={{ mr: 1, color: MUTED }} />}
                renderValue={(v) => (v ? v : placeholder("Περιοχή"))}
              >
                <MenuItem value="">Περιοχή</MenuItem>
                <MenuItem value="Αθήνα">Αθήνα</MenuItem>
                <MenuItem value="Πειραιάς">Πειραιάς</MenuItem>
                <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={pillSx}>
              <Select
                value={spec}
                displayEmpty
                onChange={(e) => setSpec(e.target.value)}
                startAdornment={<LocalHospitalOutlinedIcon sx={{ mr: 1, color: MUTED }} />}
                renderValue={(v) => (v ? v : placeholder("Ειδικότητα"))}
              >
                <MenuItem value="">Ειδικότητα</MenuItem>
                <MenuItem value="Γενικός">Γενικός</MenuItem>
                <MenuItem value="Χειρουργός">Χειρουργός</MenuItem>
                <MenuItem value="Δερματολόγος">Δερματολόγος</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
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
          </Stack>
        </Paper>

        <Stack spacing={1.8} sx={{ mt: 2.5 }}>
          {view.map((v) => (
            <VetCard
              key={v.id}
              vet={v}
              onView={() => navigate(`/owner/vets/${v.id}`)}
            />
          ))}
        </Stack>

        {/* Pager κάτω από τα cards */}
        <Box sx={{ display: "flex", justifyContent: "right", mt: 1.5 }}>
          <Pager
            page={page}
            pageCount={totalPages}
            onChange={setPage}
            color={PRIMARY}
            maxButtons={4}
          />
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
