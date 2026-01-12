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

import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";


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

{/* WHAT YOU CAN DO (NEW SECTION) */}
<Container maxWidth="lg" sx={{ mt: { xs: 7, md: 9 }, mb: 6 }}>
  <Typography sx={{ fontSize: 24, fontWeight: 900, color: "#0d2c54" }}>
    Τι μπορείτε να κάνετε στο MyPet
  </Typography>

  <Typography sx={{ mt: 0.8, color: "text.secondary", maxWidth: 900 }}>
    Η πλατφόρμα προσφέρει προσωποποιημένες λειτουργίες για Ιδιοκτήτες και Κτηνιάτρους, ενώ η αναζήτηση
    απολεσθέντων είναι διαθέσιμη και χωρίς σύνδεση.
  </Typography>

  <Grid container spacing={2.2} sx={{ mt: 2 }}>
    {/* OWNER CARD */}
    <Grid item xs={12} md={6}>
      <Paper
        elevation={0}
        sx={{
          p: 2.2, // ⬅️ λίγο πιο μικρή
          borderRadius: 3,
          border: "1px solid rgba(13,44,84,0.12)",
          bgcolor: "#f7faff", // ⬅️ ίδιο χρώμα και στις 2
          height: "100%",
          minHeight: 250, // ⬅️ λίγο πιο μικρή
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
          <Stack direction="row" spacing={1} alignItems="center">
            <MedicalServicesOutlinedIcon sx={{ color: "#0b3d91" }} />
            <Typography variant="body2" sx={{ color: "#1c2b39", lineHeight: 1.35 }}>
              Βιβλιάριο υγείας & ιατρικές πράξεις (προβολή/εκτύπωση)
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <CampaignIcon sx={{ color: "#0b3d91" }} />
            <Typography variant="body2" sx={{ color: "#1c2b39", lineHeight: 1.35 }}>
              Δήλωση απώλειας/εύρεσης & ιστορικό δηλώσεων
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <EventAvailableOutlinedIcon sx={{ color: "#0b3d91" }} />
            <Typography variant="body2" sx={{ color: "#1c2b39", lineHeight: 1.35 }}>
              Αναζήτηση κτηνιάτρων & προγραμματισμός ραντεβού
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <EditNoteIcon sx={{ color: "#0b3d91" }} />
            <Typography variant="body2" sx={{ color: "#1c2b39", lineHeight: 1.35 }}>
              Πρόχειρη/Οριστική υποβολή δηλώσεων & ιστορικό ραντεβού
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: "auto", pt: 1.6 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/register/owner")}
            sx={{ textTransform: "none", borderRadius: 999, px: 2.2 }}
          >
            Εγγραφή ως Ιδιοκτήτης
          </Button>
        </Stack>
      </Paper>
    </Grid>

    {/* VET CARD */}
    <Grid item xs={12} md={6}>
      <Paper
        elevation={0}
        sx={{
          p: 2.2, // ⬅️ ίδιο padding
          borderRadius: 3,
          border: "1px solid rgba(13,44,84,0.12)",
          bgcolor: "#f7faff", // ⬅️ ίδιο χρώμα
          height: "100%",
          minHeight: 250, // ⬅️ ίδιο ύψος
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
          <Stack direction="row" spacing={1} alignItems="center">
            <EditNoteIcon sx={{ color: "#0b3d91" }} />
            <Typography variant="body2" sx={{ color: "#1c2b39", lineHeight: 1.35 }}>
              Καταγραφή ταυτότητας κατοικιδίου & ιατρικών πράξεων
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <EventAvailableOutlinedIcon sx={{ color: "#0b3d91" }} />
            <Typography variant="body2" sx={{ color: "#1c2b39", lineHeight: 1.35 }}>
              Ορισμός διαθεσιμότητας & διαχείριση αιτημάτων ραντεβού
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <CampaignIcon sx={{ color: "#0b3d91" }} />
            <Typography variant="body2" sx={{ color: "#1c2b39", lineHeight: 1.35 }}>
              Παρακολούθηση αξιολογήσεων & ιστορικού επισκέψεων
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <PetsOutlinedIcon sx={{ color: "#0b3d91" }} />
            <Typography variant="body2" sx={{ color: "#1c2b39", lineHeight: 1.35 }}>
              Συμβάντα ζωής (απώλεια/εύρεση/υιοθεσία) & αιτήματα ραντεβού (επιβεβαίωση/απόρριψη)
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: "auto", pt: 1.6 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/register/vet")}
            sx={{ textTransform: "none", borderRadius: 999, px: 2.2 }}
          >
            Εγγραφή ως Κτηνίατρος
          </Button>
        </Stack>
      </Paper>
    </Grid>
  </Grid>
</Container>



{/* VETS SEARCH + PREVIEW */}
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
          <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
        </Select>
      </FormControl>

      {/* Ημερομηνία (απλό input για τώρα) */}
      <TextField
        size="small"
        placeholder="Ημερομηνία"
        sx={{
          bgcolor: "white",
          borderRadius: 999,
          minWidth: 200,
          "& .MuiOutlinedInput-root": { borderRadius: 999 },
          "& input::placeholder": { color: "#6b7a90", opacity: 1 },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonthOutlinedIcon sx={{ color: "#6b7a90" }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Ώρα */}
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
          value=""
          displayEmpty
          startAdornment={
            <InputAdornment position="start">
              <AccessTimeOutlinedIcon sx={{ color: "#6b7a90", ml: 0.5 }} />
            </InputAdornment>
          }
          renderValue={(selected) => (
            <span style={{ color: selected ? "#1c2b39" : "#6b7a90" }}>
              {selected || "Ώρα"}
            </span>
          )}
        >
          <MenuItem value="">Όλες</MenuItem>
          <MenuItem value="10:00">10:00</MenuItem>
          <MenuItem value="12:00">12:00</MenuItem>
          <MenuItem value="17:30">17:30</MenuItem>
        </Select>
      </FormControl>

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
          value=""
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

      <Button
        variant="contained"
        startIcon={<SearchIcon />}
        onClick={() => navigate("/owner/vets")}
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
    </Stack>
  </Paper>

  {/* PREVIEW RESULTS (STATIC DEMO) */}
  <Paper
    elevation={0}
    sx={{
      mt: 2.2,
      bgcolor: "#8f9fb0",
      borderRadius: 3,
      p: 2.2,
    }}
  >
    <Typography sx={{ fontWeight: 900, color: "white", mb: 1.5 }}>
      Προτεινόμενοι κτηνίατροι
    </Typography>

    <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="center">
      {[
        { id: 1, name: "Ιωάννα Παπαδοπούλου", area: "Αθήνα", specialty: "Γενικός" },
        { id: 2, name: "Νίκος Γεωργίου", area: "Πειραιάς", specialty: "Χειρουργός" },
      ].map((v) => (
        <Paper
          key={v.id}
          elevation={0}
          onClick={() => navigate(`/vets/${v.id}`)}
          sx={{
            width: { xs: "100%", md: 280 },
            borderRadius: 2,
            border: "1px solid #3b3b3b",
            bgcolor: "rgba(255,255,255,0.92)",
            cursor: "pointer",
            overflow: "hidden",
            "&:hover": { transform: "translateY(-2px)" },
            transition: "transform 160ms ease",
          }}
        >
          <Box
            sx={{
              height: 90,
              bgcolor: "#eef1f4",
              display: "grid",
              placeItems: "center",
              borderBottom: "1px solid #3b3b3b",
            }}
          >
            <Typography sx={{ fontWeight: 900, color: "#0d2c54" }}>
              {v.specialty}
            </Typography>
          </Box>

          <Box sx={{ p: 1.4 }}>
            <Typography sx={{ color: "#0d2c54", fontWeight: 900 }}>
              {v.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "#4b5b6b", mt: 0.4 }}>
              Περιοχή: <b>{v.area}</b>
              <br />
              Διαθεσιμότητα: <b>Σήμερα</b>
            </Typography>
          </Box>
        </Paper>
      ))}
    </Stack>
  </Paper>

  <Stack alignItems="flex-end" sx={{ mt: 2 }}>
    <Button
      variant="outlined"
     onClick={() => navigate("/owner/vets")}
      sx={{ textTransform: "none", borderRadius: 2 }}
    >
      Δείτε όλους τους κτηνιάτρους
    </Button>
  </Stack>
</Container>

      <Footer />
    </Box>
  );
}
