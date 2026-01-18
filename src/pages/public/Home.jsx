import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Divider,
} from "@mui/material";

import InputAdornment from "@mui/material/InputAdornment";

import SearchIcon from "@mui/icons-material/Search";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CampaignIcon from "@mui/icons-material/Campaign";

import { useNavigate, useLocation } from "react-router-dom";

import Footer from "../../components/Footer";
import PublicNavbar from "../../components/PublicNavbar";
import AppBreadcrumbs from "../../components/Breadcrumbs";

import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

// ✅ DatePicker (χωρίς date-fns error)
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { useAuth } from "../../auth/AuthContext";

const LOST_KEY = "mypet_lost_declarations";

function safeLoad(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

const EDUCATION_LEVELS = [
  "Πτυχίο Κτηνιατρικής",
  "MSc (Μεταπτυχιακό)",
  "PhD (Διδακτορικό)",
];

/** ✅ δέχεται "YYYY-MM-DD" ή "DD/MM/YYYY" ή "DD-MM-YYYY" και το κάνει "YYYY-MM-DD" */
function normalizeGreekDateToISO(s) {
  if (!s) return "";
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return "";
}

function dateToISOFromDayjs(dj) {
  if (!dj) return "";
  const d = dj.toDate();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ✅ resolve user + role (ίδιο pattern με τα άλλα)
  const resolvedUser = user?.user ?? user;
  const isLoggedIn = !!resolvedUser?.id;
  const role = (resolvedUser?.role ?? "").toString().toLowerCase();
  const isOwnerLoggedIn = isLoggedIn && (role === "owner" || role === "ιδιοκτήτης");

  // ✅ ΜΟΝΟ αν είσαι σε owner area ΚΑΙ owner -> πήγαινε σε owner route
  const isOwnerArea = location.pathname === "/owner" || location.pathname.startsWith("/owner/");
  const goOwnerVetProfile = isOwnerLoggedIn || isOwnerArea;

  // ✅ Vet search inputs (ΩΡΑ: ΑΦΑΙΡΕΘΗΚΕ)
  const [vetArea, setVetArea] = useState("");
  const [vetSpecialty, setVetSpecialty] = useState("");
  const [education, setEducation] = useState("");

  // ✅ date: κρατάμε ISO string + Dayjs object
  const [vetDate, setVetDate] = useState(""); // ISO "YYYY-MM-DD"
  const [vetDateObj, setVetDateObj] = useState(null); // dayjs | null

  // ✅ DB data
  const [vets, setVets] = useState([]);
  const [loadingVets, setLoadingVets] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  // ✅ “έγινε αναζήτηση;”
  const [didSearch, setDidSearch] = useState(false);

  const hasActiveVetFilters = Boolean(vetArea?.trim() || vetDate?.trim() || vetSpecialty?.trim() || education?.trim());

  // -----------------------------
  // Fetch vets
  // -----------------------------
  useEffect(() => {
    let alive = true;

    async function loadVets() {
      try {
        setLoadingVets(true);
        const res = await fetch("http://localhost:3001/vets");
        if (!res.ok) throw new Error("Failed to fetch vets");
        const data = await res.json();
        if (!alive) return;
        setVets(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setVets([]);
      } finally {
        if (alive) setLoadingVets(false);
      }
    }

    loadVets();
    return () => {
      alive = false;
    };
  }, []);

  // -----------------------------
  // Fetch appointments
  // -----------------------------
  useEffect(() => {
    let alive = true;

    async function loadAppointments() {
      try {
        setLoadingAppts(true);
        const res = await fetch("http://localhost:3001/appointments");
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const data = await res.json();
        if (!alive) return;
        setAppointments(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setAppointments([]);
      } finally {
        if (alive) setLoadingAppts(false);
      }
    }

    loadAppointments();
    return () => {
      alive = false;
    };
  }, []);

  // -----------------------------
  // Top rated vets (default view)
  // -----------------------------
  const topVets = useMemo(() => {
    return [...vets].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 10);
  }, [vets]);

  // appointments grouped by vetId
  const apptsByVetId = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      const id = String(a?.vetId ?? "");
      if (!id) continue;
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(a);
    }
    return map;
  }, [appointments]);

  // -----------------------------
  // Filtered vets (search results)
  // -----------------------------
  const filteredVets = useMemo(() => {
    const areaQ = vetArea.trim();
    const specQ = vetSpecialty.trim();
    const eduQ = education.trim();
    const dateISO = normalizeGreekDateToISO(vetDate);

    return vets.filter((v) => {
      if (areaQ && String(v.area || "").toLowerCase() !== areaQ.toLowerCase()) return false;
      if (specQ && String(v.specialty || "").toLowerCase() !== specQ.toLowerCase()) return false;
      if (eduQ && String(v.studies || "").toLowerCase() !== eduQ.toLowerCase()) return false;

      // ✅ Αν έχει ημερομηνία: κράτα μόνο vets που έχουν appointment εκείνη τη μέρα
      if (dateISO) {
        const list = apptsByVetId.get(String(v.id)) || [];
        const ok = list.some((a) => {
          if (!a?.when) return false;
          const aDateISO = String(a.when).slice(0, 10); // YYYY-MM-DD
          return aDateISO === dateISO;
        });
        if (!ok) return false;
      }

      return true;
    });
  }, [vets, vetArea, vetSpecialty, vetDate, education, apptsByVetId]);

  // =============================
  // ✅ VETS CAROUSEL
  // =============================
  const [vetCarouselIndex, setVetCarouselIndex] = useState(0);
  const perPageVets = 3;

  const vetsToShow = useMemo(() => {
    return didSearch ? filteredVets : topVets;
  }, [didSearch, filteredVets, topVets]);

  const vetTotalPages = Math.max(1, Math.ceil(vetsToShow.length / perPageVets));

  const visibleVets = useMemo(() => {
    const start = vetCarouselIndex * perPageVets;
    return vetsToShow.slice(start, start + perPageVets);
  }, [vetsToShow, vetCarouselIndex, perPageVets]);

  const canPrevVets = vetCarouselIndex > 0;
  const canNextVets = vetCarouselIndex < vetTotalPages - 1;

  function goPrevVets() {
    setVetCarouselIndex((p) => Math.max(0, p - 1));
  }
  function goNextVets() {
    setVetCarouselIndex((p) => Math.min(vetTotalPages - 1, p + 1));
  }

  useEffect(() => {
    setVetCarouselIndex(0);
  }, [vetsToShow.length]);

  // =============================
  // ✅ Search actions
  // =============================
  function goToVetsSearch() {
    setDidSearch(true);

    const params = new URLSearchParams();
    if (vetArea) params.set("area", vetArea);
    if (vetSpecialty) params.set("specialty", vetSpecialty);
    if (education) params.set("education", education);    

    const dateISO = normalizeGreekDateToISO(vetDate);
    if (dateISO) params.set("date", dateISO);

    navigate(`/vets?${params.toString()}`);
  }

  function clearVetFilters() {
    setVetArea("");
    setVetSpecialty("");
    setEducation("");
    setVetDate("");
    setVetDateObj(null);
    setDidSearch(false);
  }

  const isLoadingAny = loadingVets || loadingAppts;

  // ✅ helper για profile path (εδώ είναι όλη η ουσία)
  const goVetProfile = (vetId) => {
    const target = goOwnerVetProfile ? `/owner/vets/${vetId}` : `/vets/${vetId}`;
    navigate(target);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "white" }}>
      <PublicNavbar />

      {/* HERO */}
      <Box
        sx={{
          bgcolor: "#eaf2fb",
          height: { xs: 230, md: 240 },
          position: "relative",
          overflow: "visible",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Container maxWidth="lg" sx={{ height: "100%", position: "relative" }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Box sx={{ pt: { xs: 7, md: 3 } }}>
            <Grid container>
              <Grid item xs={12} md={7}>
                <Typography
                  sx={{
                    fontSize: { xs: 26, md: 34 },
                    fontWeight: 900,
                    color: "#1c2b39",
                    lineHeight: 1.1,
                  }}
                >
                  Ό,τι χρειάζεστε για το κατοικίδιό σας.
                </Typography>

                <Typography sx={{ mt: 1, mb: 2 }} color="text.secondary">
                  Απώλειες, ευρέσεις, ιατρικές πράξεις και ραντεβού – γρήγορα και εύκολα.
                </Typography>
              </Grid>

              <Grid item xs={12} md={5} />
            </Grid>
          </Box>
        </Container>

        <Box
          component="img"
          src="/images/hero-pets.png"
          alt="Pets"
          sx={{
            position: "absolute",
            left: 1000,
            bottom: -100,
            width: 450,
            height: "auto",
          }}
        />
      </Box>

      {/* WHAT YOU CAN DO */}
      <Container maxWidth="lg" sx={{ mt: { xs: 7, md: 9 }, mb: 4 }}>
        <Box sx={{ width: 1060, mx: "auto", textAlign: "left" }}>
          <Typography sx={{ fontSize: 24, fontWeight: 900, color: "#0d2c54" }}>
            Τι μπορείτε να κάνετε στο MyPet
          </Typography>

          <Typography sx={{ mt: 0.8, color: "text.secondary", maxWidth: 900 }}>
            Η πλατφόρμα προσφέρει προσωποποιημένες λειτουργίες για Ιδιοκτήτες και Κτηνιάτρους,
            ενώ η αναζήτηση απολεσθέντων είναι διαθέσιμη και χωρίς σύνδεση.
          </Typography>

          <Grid container spacing={2.4} sx={{ mt: 2 }} justifyContent="center" alignItems="stretch">
            {/* OWNER CARD */}
            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <Paper
                elevation={0}
                sx={{
                  width: 480,
                  p: 2.2,
                  borderRadius: 3,
                  border: "1px solid rgba(13,44,84,0.12)",
                  bgcolor: "#f7faff",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack direction="row" spacing={1.4} alignItems="center" sx={{ mb: 1 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: "#dbe9ff",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <PetsOutlinedIcon sx={{ color: "#0b3d91" }} />
                  </Paper>
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: "#0d2c54" }}>Για Ιδιοκτήτες</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Υγεία, δηλώσεις, ραντεβού — όλα σε ένα μέρος.
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={0.9} sx={{ mt: 1.2 }}>
                  <Stack direction="row" spacing={1}>
                    <MedicalServicesOutlinedIcon sx={{ color: "#0b3d91" }} />
                    <Typography variant="body2">Βιβλιάριο υγείας & ιατρικές πράξεις</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <CampaignIcon sx={{ color: "#0b3d91" }} />
                    <Typography variant="body2">Δήλωση απώλειας/εύρεσης & ιστορικό</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <EventAvailableOutlinedIcon sx={{ color: "#0b3d91" }} />
                    <Typography variant="body2">Αναζήτηση κτηνιάτρων & ραντεβού</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <EditNoteIcon sx={{ color: "#0b3d91" }} />
                    <Typography variant="body2">Πρόχειρη / Οριστική υποβολή</Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: "auto", pt: 1.6 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate("/register/owner")}
                    sx={{
                      textTransform: "none",
                      borderRadius: 999,
                      px: 2.4,
                      bgcolor: "#0b3d91",
                      color: "white",
                      fontWeight: 800,
                      boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                      "&:hover": {
                        bgcolor: "#08316f",
                      },
                    }}
                  >
                    Εγγραφή ως Ιδιοκτήτης
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* VET CARD */}
            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <Paper
                elevation={0}
                sx={{
                  width: 480,
                  p: 2.2,
                  borderRadius: 3,
                  border: "1px solid rgba(13,44,84,0.12)",
                  bgcolor: "#f7faff",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack direction="row" spacing={1.4} alignItems="center" sx={{ mb: 1 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: "#dbe9ff",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <MedicalServicesOutlinedIcon sx={{ color: "#0b3d91" }} />
                  </Paper>
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: "#0d2c54" }}>Για Κτηνιάτρους</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Προφίλ, καταγραφές, διαθεσιμότητα & ραντεβού.
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={0.9} sx={{ mt: 1.2 }}>
                  <Stack direction="row" spacing={1}>
                    <EditNoteIcon sx={{ color: "#0b3d91" }} />
                    <Typography variant="body2">Καταγραφή ταυτότητας & πράξεων</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <EventAvailableOutlinedIcon sx={{ color: "#0b3d91" }} />
                    <Typography variant="body2">Διαθεσιμότητα & αιτήματα</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <CampaignIcon sx={{ color: "#0b3d91" }} />
                    <Typography variant="body2">Αξιολογήσεις & ιστορικό</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <PetsOutlinedIcon sx={{ color: "#0b3d91" }} />
                    <Typography variant="body2">Συμβάντα ζωής & ραντεβού</Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: "auto", pt: 1.6 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate("/register/vet")}
                    sx={{
                      textTransform: "none",
                      borderRadius: 999,
                      px: 2.4,
                      bgcolor: "#0b3d91",
                      color: "white",
                      fontWeight: 800,
                      boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                      "&:hover": {
                        bgcolor: "#08316f",
                      },
                    }}
                  >
                    Εγγραφή ως Κτηνίατρος
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 4 }} />
      </Container>

      {/* VETS SEARCH + CAROUSEL */}
      <Container maxWidth="lg" sx={{ mt: 2.5, pb: 2 }}>
        <Box sx={{ maxWidth: 1060, mx: "auto", width: "100%" }}>
          {/* SEARCH BAR */}
          <Paper elevation={0} sx={{ bgcolor: "#cfe0f7", borderRadius: 4, p: 2.2 }}>
            <Typography sx={{ fontWeight: 800, mb: 1.8, color: "#1c2b39" }}>
              Αναζήτηση Κτηνιάτρων
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.6} alignItems="center">
              {/* Περιοχή */}
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
                  value={vetArea}
                  onChange={(e) => setVetArea(e.target.value)}
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
                  <MenuItem value="Πειραιάς">Πειραιάς</MenuItem>
                  <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
                </Select>
              </FormControl>

              {/* Ημερομηνία */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={vetDateObj}
                  minDate={dayjs()}
                  maxDate={dayjs().add(1, "year")}
                  onChange={(newValue) => {
                    setVetDateObj(newValue);
                    setVetDate(dateToISOFromDayjs(newValue));
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      placeholder: "Ημερομηνία",
                      sx: {
                        bgcolor: "white",
                        borderRadius: 999,
                        minWidth: 230,
                        "& .MuiOutlinedInput-root": { borderRadius: 999 },
                        "& input::placeholder": { color: "#6b7a90", opacity: 1 },
                      },
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonthOutlinedIcon sx={{ color: "#6b7a90" }} />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              </LocalizationProvider>

              {/* Ειδικότητα */}
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
                  value={vetSpecialty}
                  onChange={(e) => setVetSpecialty(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <LocalHospitalOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
                    </InputAdornment>
                  }
                  renderValue={(selected) => (
                    <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                      {selected || "Ειδικότητα"}
                    </span>
                  )}
                >
                  <MenuItem value="">Όλες</MenuItem>
                  <MenuItem value="Γενικός">Γενικός</MenuItem>
                  <MenuItem value="Χειρουργός">Χειρουργός</MenuItem>
                  <MenuItem value="Δερματολόγος">Δερματολόγος</MenuItem>
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
                  value={education}
                  displayEmpty
                  onChange={(e) => setEducation(e.target.value)}
                  renderValue={(selected) => (
                    <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                      {selected || "Σπουδές"}
                    </span>
                  )}
                >
                  <MenuItem value="">Σπουδές</MenuItem>
                  {EDUCATION_LEVELS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={goToVetsSearch}
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: 3.2,
                  ml: { md: "auto" },
                  bgcolor: "#0b3d91",
                  "&:hover": { bgcolor: "#08316f" },
                  boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
                  minWidth: 140,
                  fontWeight: 800,
                }}
              >
                Αναζήτηση
              </Button>

              {hasActiveVetFilters && (
                <IconButton
                  onClick={clearVetFilters}
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

          {/* TITLE */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2.2, mb: 1.4 }}>
            <StarRoundedIcon sx={{ color: "#0b3d91" }} />
            <Typography sx={{ fontWeight: 900, color: "#0d2c54", fontSize: 20 }}>
              {didSearch ? "Αποτελέσματα αναζήτησης" : "Προτεινόμενοι κτηνίατροι"}
            </Typography>
          </Stack>

          {/* CAROUSEL */}
          {isLoadingAny ? (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid rgba(0,0,0,0.08)",
                bgcolor: "white",
              }}
            >
              <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>Φόρτωση κτηνιάτρων...</Typography>
            </Paper>
          ) : vetsToShow.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid rgba(0,0,0,0.08)",
                bgcolor: "white",
              }}
            >
              <Typography sx={{ fontWeight: 900, color: "#0d2c54" }}>Δεν βρέθηκαν κτηνίατροι</Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                position: "relative",
                border: "1px solid rgba(11,61,145,0.10)",
                bgcolor: "rgba(207,224,247,0.25)",
                borderRadius: 3,
                px: { xs: 5.5, md: 6.5 },
                py: { xs: 1.6, md: 2 },
                overflow: "hidden",
              }}
            >
              {/* arrows */}
              <IconButton
                onClick={goPrevVets}
                disabled={!canPrevVets}
                sx={{
                  position: "absolute",
                  left: 5,
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: "white",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": { bgcolor: "white" },
                  zIndex: 2,
                }}
              >
                <ChevronLeftIcon />
              </IconButton>

              <IconButton
                onClick={goNextVets}
                disabled={!canNextVets}
                sx={{
                  position: "absolute",
                  right: 5,
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: "white",
                  border: "1px solid rgba(0,0,0,0.12)",
                  "&:hover": { bgcolor: "white" },
                  zIndex: 2,
                }}
              >
                <ChevronRightIcon />
              </IconButton>

              {/* cards */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                alignItems="stretch"
                justifyContent="center"
                sx={{ mt: 0.6 }}
              >
                {visibleVets.map((v) => (
                  <Paper
                    key={v.id}
                    elevation={0}
                    onClick={() => goVetProfile(v.id)}   // ✅ ΕΔΩ ΑΛΛΑΞΕ
                    sx={{
                      width: { xs: "100%", md: 300 },
                      borderRadius: 3,
                      border: "1px solid rgba(0,0,0,0.10)",
                      bgcolor: "white",
                      cursor: "pointer",
                      overflow: "hidden",
                      "&:hover": { transform: "translateY(-3px)" },
                      transition: "transform 160ms ease",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <Box sx={{ height: 150, bgcolor: "#eef1f4", overflow: "hidden" }}>
                      <Box
                        component="img"
                        src={v.photo || "/images/demo-vet-avatar.png"}
                        alt={v.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "top",
                        }}
                      />
                    </Box>

                    <Box sx={{ p: 1.6, display: "flex", flexDirection: "column", flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ pr: 1 }}>
                          <Typography sx={{ color: "#0d2c54", fontWeight: 900, lineHeight: 1.2 }}>
                            {v.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.2 }}>
                            {v.specialty}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            px: 1,
                            py: 0.4,
                            borderRadius: 999,
                            bgcolor: "#eef3ff",
                            border: "1px solid rgba(11,61,145,0.18)",
                            fontWeight: 900,
                            color: "#0b3d91",
                            fontSize: 13,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.rating?.toFixed?.(1) ?? v.rating} ★
                        </Box>
                      </Stack>

                      <Typography variant="body2" sx={{ color: "#4b5b6b", mt: 1 }}>
                        Περιοχή: <b>{v.area}</b>
                      </Typography>

                      <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mt: "auto", pt: 1.2 }}>
                        <Typography variant="body2" sx={{ color: "#0b3d91", fontWeight: 800 }}>
                          Προβολή
                        </Typography>
                        <ArrowForwardIosRoundedIcon sx={{ ml: 0.6, fontSize: 16, color: "#0b3d91" }} />
                      </Stack>
                    </Box>
                  </Paper>
                ))}
              </Stack>

              {/* dots */}
              <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 1.4 }}>
                {Array.from({ length: vetTotalPages }).map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: i === vetCarouselIndex ? "#0b3d91" : "rgba(11,61,145,0.25)",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Stack alignItems="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="text"
              onClick={() => navigate("/vets")}
              sx={{ textTransform: "none", borderRadius: 2, fontWeight: 800, color: "#0b3d91" }}
            >
              Δείτε όλους τους κτηνιάτρους →
            </Button>
          </Stack>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
