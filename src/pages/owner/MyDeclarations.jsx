import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Tabs,
  Tab,
  Typography,
  Divider,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import { useNavigate } from "react-router-dom";

const FOUND_KEY = "mypet_found_declarations";
const LOST_KEY = "mypet_lost_declarations";

function safeLoad(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function safeSave(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function StatusChip({ status }) {
  const label = status || "Πρόχειρη";
  const color = label === "Οριστική" ? "success" : label === "Ακυρωμένη" ? "default" : "warning";
  return <Chip size="small" label={label} color={color} variant="filled" />;
}

function Row({ item, onPreview, onEdit, onDelete }) {
  const status = item?.status || "Πρόχειρη";
  const canEdit = status === "Πρόχειρη";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "2px solid #c7d4e8",
        bgcolor: "white",
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        {/* left: image + info */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #d5deeb",
              flex: "0 0 auto",
              bgcolor: "#eef1f4",
              display: "grid",
              placeItems: "center",
            }}
          >
            {item?.photoDataUrl ? (
              <Box
                component="img"
                src={item.photoDataUrl}
                alt="pet"
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Typography sx={{ fontSize: 11, color: "#6b7a90", fontWeight: 700 }}>Χωρίς φωτο</Typography>
            )}
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontWeight: 900, color: "#0d2c54" }} noWrap>
                {item?.petName || "Κατοικίδιο"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#6b7a90" }}>
                {item?.type === "lost" ? "Δήλωση Απώλειας" : "Δήλωση Εύρεσης"}
              </Typography>
              
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 0.5, color: "#0d2c54" }}>
              <Typography sx={{ fontSize: 12, color: "#0d2c54" }}>
                Περιοχή: <b>{item?.area || "—"}</b>
                <br />
                Ημ. {item?.type === "lost" ? "Απώλειας" : "Εύρεσης"}: <b>{item?.date ? new Date(item?.date).toLocaleDateString("el-GR") : "—"}</b>
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* right: actions */}
        <Stack direction="column" spacing={1} alignItems="flex-end">
          <Typography sx={{ fontSize: 12, color: "#0d2c54", mr: 1, display: { xs: "none", md: "block" } }}>
            Υποβλήθηκε: {item?.createdAt ? new Date(item.createdAt).toLocaleDateString("el-GR") : "—"}
          </Typography>

          <Stack direction="column" spacing={1} alignItems="center">
            <Button
            onClick={() => onPreview(item)}
            variant="contained"
            startIcon={<VisibilityOutlinedIcon />}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              bgcolor: "#0b3d91",
              "&:hover": { bgcolor: "#08316f" },
            }}
          >
            Προβολή
          </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function MyDeclarations() {
  const navigate = useNavigate();

  // tab: 0=Υποβεβλημένες, 1=Πρόχειρες
  const [tab, setTab] = useState(0);

  // “βάση” μας = localStorage
  const [lost, setLost] = useState([]);
  const [found, setFound] = useState([]);

  // φόρτωσε από storage
  useEffect(() => {
    const foundItems = safeLoad(FOUND_KEY).map((x) => ({ ...x, type: "found" }));
    const lostItems = safeLoad(LOST_KEY).map((x) => ({ ...x, type: "lost" }));

    setFound(foundItems);
    setLost(lostItems);
  }, []);

  const all = useMemo(() => {
    // ενιαία λίστα (lost + found)
    const merged = [...lost, ...found];

    // sort newest first
    merged.sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return tb - ta;
    });

    return merged;
  }, [lost, found]);

  const filtered = useMemo(() => {
    if (tab === 0) return all.filter((x) => (x?.status || "Πρόχειρη") === "Οριστική");
    return all.filter((x) => (x?.status || "Πρόχειρη") !== "Οριστική");
  }, [all, tab]);

  const handleCreate = () => {
    // Πήγαινε στη φόρμα εύρεσης (αλλάζεις το route αν έχεις άλλο)
    navigate("/found/declaration");
  };

  const handlePreview = (item) => {
    if (item?.status === "Οριστική" && item.type === "lost") {
      navigate(`/lost/${item.id}`);
      return;
    }
    else if (item?.status === "Οριστική" && item.type === "found") {
      navigate(`/found/${item.id}`);
      return;
    }
    else if (item?.status === "Πρόχειρη" && item.type === "lost") {
      navigate("/owner/lost/new", { state: { draftId: item.id, step: 1 } });
      return;
    }

    else if (item?.status === "Πρόχειρη" && item.type === "found") {
      navigate("/lost/new", { state: { draftId: item.id, step: 2 } });
      return;
    }

    // fallback (προαιρετικό)
    alert("Η δήλωση δεν έχει υποβληθεί οριστικά ή δεν είναι απώλεια.");
  };

  const handleEdit = (item) => {
    if ((item?.status || "Πρόχειρη") !== "Πρόχειρη") return;

    // απλό: για τώρα alert. Αν θέλεις, στο επόμενο βήμα το κάνουμε “φορτώνω το draft στη φόρμα”.
    alert(`Επεξεργασία draft #${item.id} (στο επόμενο βήμα το συνδέουμε με τη φόρμα).`);
  };

  const handleDelete = (item) => {
    const ok = confirm("Θες σίγουρα να διαγράψεις τη δήλωση;");
    if (!ok) return;

    if (item.type === "found") {
      const next = found.filter((x) => x.id !== item.id);
      setFound(next);
      safeSave(FOUND_KEY, next.map(({ type, ...rest }) => rest));
    } else {
      const next = lost.filter((x) => x.id !== item.id);
      setLost(next);
      safeSave(LOST_KEY, next.map(({ type, ...rest }) => rest));
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box>
            <AppBreadcrumbs />
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontWeight: 900, color: "#0d2c54", fontSize: 28 }}>Δηλώσεις</Typography>
              <Typography sx={{ mt: 0.6, color: "#6b7a90", maxWidth: 820 }}>
                Εδώ θα βρείτε όλες τις δηλώσεις που έχετε καταχωρίσει για τα κατοικίδια σας. 
                 <br />
                Παρακολουθήστε την πορεία τους ή ξεκινήστε μια νέα δήλωση εύκολα και γρήγορα.
              </Typography>
            </Box>

            <Button
              onClick={handleCreate}
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
                bgcolor: "#0b3d91",
                "&:hover": { bgcolor: "#08316f" },
                boxShadow: "0px 6px 16px rgba(0,0,0,0.18)",
              }}
            >
              Νέα Δήλωση
            </Button>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid #d6e2f5",
              overflow: "hidden",
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >
            {/* Tabs like screenshot: Υποβεβλημένες / Πρόχειρες */}
            <Box sx={{ bgcolor: "#ffffff" }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  px: 1,
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 900,
                    color: "#0d2c54",
                  },
                  "& .MuiTabs-indicator": {
                    height: 4,
                    borderRadius: 99,
                  },
                }}
              >
                <Tab label="Υποβεβλημένες" />
                <Tab label="Πρόχειρες" />
              </Tabs>
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
              {filtered.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    border: "1px solid #e6edf7",
                    bgcolor: "#ffffff",
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontWeight: 900, color: "#0d2c54" }}>Δεν υπάρχουν δηλώσεις εδώ</Typography>
                  <Typography sx={{ mt: 0.6, color: "#6b7a90" }}>
                    Πάτησε “Νέα Δήλωση” για να δημιουργήσεις μία νέα.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1.3}>
                  {filtered.map((item) => (
                    <Row
                      key={item.id}
                      item={item}
                      onPreview={handlePreview}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
