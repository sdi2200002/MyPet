import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  TextField,
  Divider,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CampaignIcon from "@mui/icons-material/Campaign";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import OwnerNavbar, { OWNER_SIDEBAR_W } from "../../components/OwnerNavbar";

import { useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";

// ✅ public/images -> ΔΕΝ κάνουμε import, βάζουμε απευθείας paths
const dog1 = "/images/dog1.png";
const cat1 = "/images/cat1.png";

const PETS_KEY = "mypet_owner_pets";
const MUTED = "#6b7a90";
const TITLE = "#0d2c54";
const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const PANEL_BG = "#cfe3ff";
const PANEL_BORDER = "#8fb4e8";

// ✅ Sidebar layout constants
const NAVBAR_H = 72; // άλλαξέ το αν το navbar σου έχει άλλο ύψος
const SIDEBAR_W = 280;
const HERO_H = 240; 

function safeLoad(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function safeSave(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function isLikelyValidPhotoPath(p) {
  if (!p) return false;
  if (typeof p !== "string") return false;
  return p.startsWith("/") || p.startsWith("data:");
}

/** ✅ πιο “μαζεμένο” calendar όπως στο mock */
function MiniCalendar() {
  const monthLabel = "November";
  const yearLabel = "2025";

  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const padStart = 5;

  const mark = { 7: "red", 19: "blue", 24: "orange", 26: "gray" };

  return (
    <Paper
      elevation={0}
      sx={{
        width: 280,
        borderRadius: 3,
        bgcolor: "#fff",
        border: "2px solid #c7d4e8",
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.8,
          py: 1.1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 14 }}>
          {monthLabel}{" "}
          <span style={{ fontWeight: 700, opacity: 0.8 }}>{yearLabel}</span>
        </Typography>
        <CalendarMonthOutlinedIcon sx={{ color: PRIMARY }} fontSize="small" />
      </Box>

      <Box sx={{ px: 1.8, pb: 1.4 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.55,
            fontSize: 11,
            color: MUTED,
            mb: 0.8,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <Box key={d} sx={{ textAlign: "center", fontWeight: 800 }}>
              {d}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.55 }}>
          {Array.from({ length: padStart }).map((_, i) => (
            <Box key={`pad-${i}`} sx={{ height: 26 }} />
          ))}

          {days.map((d) => (
            <Box
              key={d}
              sx={{
                height: 26,
                borderRadius: 99,
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                fontWeight: 800,
                color: TITLE,
                border: mark[d] ? `2px solid ${mark[d]}` : "1px solid rgba(0,0,0,0.08)",
                bgcolor: mark[d] ? "rgba(11,61,145,0.04)" : "transparent",
              }}
            >
              {d}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 1.1, fontSize: 11, color: TITLE }}>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "blue" }} />
              <Typography sx={{ fontSize: 11 }}>Προγραμματισμένο ραντεβού</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "red" }} />
              <Typography sx={{ fontSize: 11 }}>Εκκρεμές</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "orange" }} />
              <Typography sx={{ fontSize: 11 }}>Ακυρωμένο</Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

function PetTile({ pet }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        bgcolor: PANEL_BG,
        border: `2px solid ${PANEL_BORDER}`,
        boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
        p: 1.2,
        width: 190,
        textAlign: "center",
      }}
    >
      <Box
        component="img"
        src={pet.photo}
        alt={pet.name}
        sx={{
          width: 110,
          height: 110,
          borderRadius: 2,
          objectFit: "cover",
          bgcolor: "#fff",
          border: "1px solid rgba(0,0,0,0.10)",
          display: "block",
          mx: "auto",
        }}
      />
      <Typography sx={{ mt: 1, fontWeight: 900, color: TITLE, fontSize: 14 }}>
        {pet.name}
      </Typography>
      <Button
        variant="contained"
        size="small"
        sx={{
          mt: 1,
          textTransform: "none",
          borderRadius: 2,
          bgcolor: PRIMARY,
          "&:hover": { bgcolor: PRIMARY_HOVER },
          fontWeight: 900,
          boxShadow: "0px 3px 10px rgba(0,0,0,0.15)",
        }}
      >
        Βιβλιάριο Υγείας
      </Button>
    </Paper>
  );
}

function QuickAction({ icon, title, text, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: 260,
        height: 410,
        borderRadius: 2,
        bgcolor: "#fff",
        border: "2px solid #3b3b3b",
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": { transform: "translateY(-2px)" },
        transition: "transform 160ms ease",
      }}
    >
      <Box
        sx={{
          height: 160,
          bgcolor: PANEL_BG,
          borderBottom: "2px solid #3b3b3b",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ p: 1.4 }}>
        <Typography sx={{ mt: 2, fontWeight: 900, color: PRIMARY, textAlign: "center" }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 3, fontSize: 12.5, color: "#4b5b6b", textAlign: "center" }}>
          {text}
        </Typography>
      </Box>
    </Paper>
  );
}

/** ✅ Searchbar: placeholders γκρι + ίδιο “feeling” με Home */
function VetsSearchPanel() {
  const pillSx = {
    minWidth: 160,
    bgcolor: "#fff",
    borderRadius: 999,
    "& .MuiOutlinedInput-root": { borderRadius: 999 },
    "& .MuiOutlinedInput-input": { fontWeight: 700, color: TITLE },
    "& .MuiSelect-select": { fontWeight: 700, color: TITLE },
  };

  const placeholderSpan = (text) => <span style={{ color: MUTED, fontWeight: 700 }}>{text}</span>;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: PANEL_BG,
        borderRadius: 4,
        p: 2.5,
        border: `2px solid ${PANEL_BORDER}`,
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
      }}
    >
      <Typography sx={{ fontWeight: 900, color: TITLE, mb: 1.6 }}>
        Αναζήτηση Κτηνιάτρων
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="center">
        <FormControl size="small" sx={pillSx}>
          <Select
            value=""
            displayEmpty
            startAdornment={<LocationOnOutlinedIcon sx={{ mr: 1, color: MUTED }} />}
            renderValue={(v) => (v ? v : placeholderSpan("Περιοχή"))}
          >
            <MenuItem value="">Περιοχή</MenuItem>
            <MenuItem value="Αθήνα">Αθήνα</MenuItem>
            <MenuItem value="Πειραιάς">Πειραιάς</MenuItem>
            <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="DD / MM / YYYY"
          sx={{
            ...pillSx,
            minWidth: 220,
            "& input::placeholder": { color: MUTED, opacity: 1, fontWeight: 700 },
          }}
          InputProps={{
            startAdornment: <CalendarMonthOutlinedIcon sx={{ mr: 1, color: MUTED }} />,
          }}
        />

        <FormControl size="small" sx={pillSx}>
          <Select
            value=""
            displayEmpty
            startAdornment={<AccessTimeOutlinedIcon sx={{ mr: 1, color: MUTED }} />}
            renderValue={(v) => (v ? v : placeholderSpan("Ώρα"))}
          >
            <MenuItem value="">Ώρα</MenuItem>
            <MenuItem value="10:00">10:00</MenuItem>
            <MenuItem value="12:00">12:00</MenuItem>
            <MenuItem value="17:30">17:30</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={pillSx}>
          <Select
            value=""
            displayEmpty
            startAdornment={<LocalHospitalOutlinedIcon sx={{ mr: 1, color: MUTED }} />}
            renderValue={(v) => (v ? v : placeholderSpan("Ειδικότητα"))}
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
            textTransform: "none",
            borderRadius: 999,
            px: 3.2,
            ml: { md: "auto" },
            bgcolor: PRIMARY,
            "&:hover": { bgcolor: PRIMARY_HOVER },
            boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
            minWidth: 140,
            fontWeight: 900,
          }}
        >
          Αναζήτηση
        </Button>
      </Stack>
    </Paper>
  );
}

function LatestUpdates() {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ fontWeight: 900, color: TITLE, mb: 1.2 }}>
        Τελευταίες Ενημερώσεις
      </Typography>

      <Paper
        elevation={0}
        sx={{
          bgcolor: "#eef5ff",
          borderRadius: 3,
          p: 2.2,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Typography sx={{ color: "#4b5b6b", fontWeight: 700, fontSize: 13 }}>
          Δεν έχετε καινούριες ενημερώσεις.
        </Typography>
      </Paper>
    </Box>
  );
}



export default function OwnerDashboard() {
  const navigate = useNavigate();

  // ✅ demo pets
  const pets = useMemo(() => {
    const stored = safeLoad(PETS_KEY);

    const fallback = [
      { id: "p1", name: "Μπρούνο", photo: dog1 },
      { id: "p2", name: "Λούνα", photo: cat1 },
    ];

    if (!stored.length) {
      safeSave(PETS_KEY, fallback);
      return fallback;
    }

    const normalized = stored.slice(0, 2).map((p, idx) => ({
      id: p?.id || fallback[idx].id,
      name: p?.name || fallback[idx].name,
      photo: isLikelyValidPhotoPath(p?.photo) ? p.photo : fallback[idx].photo,
    }));

    safeSave(PETS_KEY, normalized);
    return normalized;
  }, []);

  const [petIndex, setPetIndex] = useState(0);
  const canUp = petIndex > 0;
  const canDown = petIndex < Math.max(0, pets.length - 2);
  const visiblePets = pets.slice(petIndex, petIndex + 2);

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
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 34 },
                  fontWeight: 900,
                  color: "#1c2b39",
                  lineHeight: 1.1,
                }}
              >
                Όλες οι ανάγκες του κατοικιδίου σας,
                <br />
                συγκεντρωμένες εδώ.
              </Typography>

              <Typography sx={{ mt: 1, mb: 2 }} color="text.secondary">
                Ραντεβού, κτηνίατροι, βιβλιάρια και δηλώσεις με ένα κλικ.
              </Typography>
            </Box>
          </Box>
        </Container>

        <Box
          component="img"
          src="/images/owner.png"
          alt="Owner"
          sx={{
            position: "absolute",
            right: 200,
            bottom: 0,
            width: { xs: 200, md: 180 },
            height: "auto",
            display: { xs: "none", md: "block" },
          }}
        />
      </Box>

      {/* ✅ 2-column layout: sidebar + content */}
      <Box
        sx={{
          display: { xs: "block", lg: "flex" },
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: sticky sidebar column */}
        <Box
          sx={{
            width: OWNER_SIDEBAR_W,
            flex: `0 0 ${OWNER_SIDEBAR_W}px`,
            display: { xs: "none", lg: "block" },
            alignSelf: "flex-start",
          }}
        >
          <Box
            sx={{
              position: "sticky",
              top: 16, // ✅ αρχίζει αμέσως κάτω από hero (επειδή μπαίνει μετά το hero)
              maxHeight: "calc(100vh - 16px)",
            }}
          >
            <OwnerNavbar />
          </Box>
        </Box>

        {/* RIGHT: content column */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2.5 }}>
            {/* TOP SECTION */}
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "260px 1fr 300px" },
                gap: 3,
                alignItems: "start",
              }}
            >
            {/* Left: pets panel */}
            <Box sx={{ pt: 0.2 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: TITLE,
                  mb: 1.2,
                  fontSize: 20,
                  textAlign: "center",
                }}
              >
                Τα Κατοικίδια μου
              </Typography>

              <Stack alignItems="center" spacing={1.2}>
                <IconButton
                  disabled={!canUp}
                  onClick={() => setPetIndex((p) => Math.max(0, p - 1))}
                  sx={{
                    width: 44,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: "rgba(11,61,145,0.08)",
                    "&:hover": { bgcolor: "rgba(11,61,145,0.14)" },
                  }}
                >
                  <KeyboardArrowUpIcon sx={{ color: PRIMARY }} />
                </IconButton>

                <Stack spacing={2}>
                  {visiblePets.map((p) => (
                    <PetTile key={p.id} pet={p} />
                  ))}
                </Stack>

                <IconButton
                  disabled={!canDown}
                  onClick={() => setPetIndex((p) => Math.min(pets.length - 2, p + 1))}
                  sx={{
                    width: 44,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: "rgba(11,61,145,0.08)",
                    "&:hover": { bgcolor: "rgba(11,61,145,0.14)" },
                  }}
                >
                  <KeyboardArrowDownIcon sx={{ color: PRIMARY }} />
                </IconButton>
              </Stack>
            </Box>

            {/* Center: quick actions */}
            <Box sx={{ pt: 0.2 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: TITLE,
                  mb: 6.5,
                  fontSize: 20,
                  textAlign: "center",
                }}
              >
                Γρήγορες Ενέργειες
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <QuickAction
                  icon={<CampaignIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Δήλωση Απώλειας"
                  text="Καταχωρίστε την απώλεια του κατοικιδίου σας για άμεση ενημέρωση."
                  onClick={() => navigate("/owner/lost/new")}
                />

                <QuickAction
                  icon={<SearchIcon sx={{ fontSize: 100, color: PRIMARY }} />}
                  title="Δήλωση Εύρεσης"
                  text="Καταχωρίστε την εύρεση για να εντοπιστεί ο ιδιοκτήτης."
                  onClick={() => navigate("/lost/new")}
                />
              </Stack>
            </Box>

            {/* Right: calendar */}
            <Box sx={{ pt: 10, display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
              <MiniCalendar />
            </Box>
           </Box>

      {/* SCROLL PART */}
      <Box sx={{ mt: 4 }}>
        <VetsSearchPanel />
        <LatestUpdates />
      </Box>
    </Container>
  </Box>
</Box>

      <Footer />
    </Box>
  );
}
