import { useMemo, useState } from "react";
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
  TextField,
  IconButton,
} from "@mui/material";

import InputAdornment from "@mui/material/InputAdornment";

import SearchIcon from "@mui/icons-material/Search";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import WcOutlinedIcon from "@mui/icons-material/WcOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CampaignIcon from "@mui/icons-material/Campaign";

import { useNavigate } from "react-router-dom";

import Footer from "../../components/Footer";
import PublicNavbar from "../../components/PublicNavbar";
import AppBreadcrumbs from "../../components/Breadcrumbs";

const LOST_KEY = "mypet_lost_declarations";

function safeLoad(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function LostCard({ item, onOpen }) {
  return (
    <Paper
      onClick={onOpen}
      elevation={0}
      sx={{
        width: 190,
        border: "1px solid",
        borderColor: "#3b3b3b",
        bgcolor: "white",
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": { transform: "translateY(-2px)" },
        transition: "transform 160ms ease",
      }}
    >
      <Box
        sx={{
          height: 120,
          borderBottom: "1px solid #3b3b3b",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          bgcolor: "#eef1f4",
        }}
      >
        {item?.photoDataUrl ? (
          <Box
            component="img"
            src={item.photoDataUrl}
            alt={item.petName || "pet"}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#6b7a90" }}>
            Φωτογραφία ζώου
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 1.2, minHeight: 80 }}>
        <Typography variant="body2" sx={{ color: "#0d2c54" }}>
          Όνομα: <b>{item?.petName || item?.species || "Κατοικίδιο"}</b>
          <br />
          Περιοχή: <b>{item?.area || "—"}</b>
          <br />
          Ημ/νία: <b>{item?.date || "—"}</b>
        </Typography>
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

export default function Home() {
  const navigate = useNavigate();

  const [area, setArea] = useState("");
  const [species, setSpecies] = useState("");
  const [sex, setSex] = useState("");
  const [color, setColor] = useState("");

  const [carouselIndex, setCarouselIndex] = useState(0);
  const perPage = 4;

  const lostPublic = useMemo(() => {
    const stored = safeLoad(LOST_KEY);

    const list = stored
      .filter((x) => (x?.status || "Πρόχειρη") === "Οριστική")
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

    return list;
  }, []);

  const totalPages = Math.max(1, Math.ceil(lostPublic.length / perPage));

  const visibleLost = useMemo(() => {
    const start = carouselIndex * perPage;
    return lostPublic.slice(start, start + perPage);
  }, [lostPublic, carouselIndex]);

  const canPrev = carouselIndex > 0;
  const canNext = carouselIndex < totalPages - 1;

  function goPrev() {
    setCarouselIndex((p) => Math.max(0, p - 1));
  }

  function goNext() {
    setCarouselIndex((p) => Math.min(totalPages - 1, p + 1));
  }

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

      {/* SEARCH + CAROUSEL */}
      <Container maxWidth="lg" sx={{ mt: 4, pb: 6 }}>
        {/* SEARCH BAR */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#cfe0f7",
            borderRadius: 4,
            p: 2.5,
          }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1.8, color: "#1c2b39" }}>
            Αναζήτηση απολεσθέντων κατοικιδίων
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
                  <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                    {selected || "Περιοχή"}
                  </span>
                )}
              >
                <MenuItem value="">Όλες</MenuItem>
                <MenuItem value="Αθήνα">Αθήνα</MenuItem>
                <MenuItem value="Πειραιάς">Πειραιάς</MenuItem>
                <MenuItem value="Ζωγράφου">Ζωγράφου</MenuItem>
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
                  <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                    {selected || "Είδος Ζώου"}
                  </span>
                )}
              >
                <MenuItem value="">Όλα</MenuItem>
                <MenuItem value="Σκύλος">Σκύλος</MenuItem>
                <MenuItem value="Γάτα">Γάτα</MenuItem>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              hiddenLabel
              sx={{
                minWidth: 150,
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
                  <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
                    {selected || "Φύλο"}
                  </span>
                )}
              >
                <MenuItem value="">Όλα</MenuItem>
                <MenuItem value="Αρσενικό">Αρσενικό</MenuItem>
                <MenuItem value="Θηλυκό">Θηλυκό</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Χρώμα"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              sx={{
                bgcolor: "white",
                borderRadius: 999,
                minWidth: 200,
                "& .MuiOutlinedInput-root": { borderRadius: 999 },
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
              onClick={() => navigate("/lost")}
              sx={{
                textTransform: "none",
                borderRadius: 999,
                px: 3.2,
                ml: { md: "auto" },
                bgcolor: "#0b3d91",
                "&:hover": { bgcolor: "#08316f" },
                boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
              }}
            >
              Αναζήτηση
            </Button>
          </Stack>
        </Paper>

        {/* CAROUSEL AREA (REAL DATA) */}
        <Paper
          elevation={0}
          sx={{
            mt: 2.2,
            bgcolor: "#8f9fb0",
            borderRadius: 3,
            p: 2.2,
            position: "relative",
          }}
        >
          <IconButton
            onClick={goPrev}
            disabled={!canPrev}
            sx={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.35)",
              width: 46,
              height: 46,
              "&:hover": { bgcolor: "rgba(255,255,255,0.55)" },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>

          <IconButton
            onClick={goNext}
            disabled={!canNext}
            sx={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.35)",
              width: 46,
              height: 46,
              "&:hover": { bgcolor: "rgba(255,255,255,0.55)" },
            }}
          >
            <ChevronRightIcon />
          </IconButton>

          <Stack direction="row" spacing={3} justifyContent="center" sx={{ py: 1.5, minHeight: 170 }}>
            {visibleLost.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  p: 2.5,
                  bgcolor: "rgba(255,255,255,0.85)",
                  minWidth: 520,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontWeight: 900, color: "#0d2c54" }}>
                  Δεν υπάρχουν χαμένα κατοικίδια ακόμη
                </Typography>
                <Typography sx={{ mt: 0.6, color: "#0d2c54", opacity: 0.75 }}>
                  Όταν γίνει οριστική υποβολή δήλωσης απώλειας, θα εμφανιστεί εδώ.
                </Typography>
              </Paper>
            ) : (
              visibleLost.map((item) => (
                <LostCard key={item.id} item={item} onOpen={() => navigate(`/lost/${item.id}`)} />
              ))
            )}
          </Stack>
        </Paper>

        <Stack alignItems="flex-end" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/lost")}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Δείτε όλα τα χαμένα κατοικίδια
          </Button>
        </Stack>

        {/* FIND PET SECTION */}
        <Box sx={{ mt: 8 }}>
          <Container maxWidth="lg">
            <Typography
              sx={{
                fontSize: 26,
                fontWeight: 900,
                color: "#0d2c54",
                mb: 5,
              }}
            >
              Εύρεση κατοικιδίου
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={4}>
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

      </Container>
      <Footer />
    </Box>
  );
}
