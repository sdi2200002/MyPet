import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Paper, Stack, Typography, Divider } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/PublicNavbar";
import Footer from "../../components/Footer";
import AppBreadcrumbs from "../../components/Breadcrumbs";
import Pager from "../../components/Pager";
import VetNavbar, { VET_SIDEBAR_W } from "../../components/VetNavbar";
import { useAuth } from "../../auth/AuthContext";

const PRIMARY = "#0b3d91";
const PRIMARY_HOVER = "#08316f";
const TITLE = "#0d2c54";
const MUTED = "#6b7a90";
const BORDER = "#8fb4e8";

async function fetchJSON(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.json();
}

/** ✅ Tabs όπως screenshot (ίδιο στυλ/μορφή) */
function TabPill({ active, label, to }) {
  return (
    <Box component={Link} to={to} sx={{ textDecoration: "none" }}>
      <Box
        sx={{
          px: 3.4,
          py: 1.8,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          bgcolor: active ? PRIMARY : "#cfd6e6",
          color: active ? "#fff" : "#111",
          fontWeight: 900,
          fontSize: 15,
          lineHeight: 1,
          boxShadow: active ? "0 10px 22px rgba(0,0,0,0.12)" : "none",
          userSelect: "none",
          "&:hover": { bgcolor: active ? PRIMARY : "#bcc6da" },
          transition: "all .15s",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

function VetShell({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      <PublicNavbar />

      <Box sx={{ flex: 1, display: { xs: "block", lg: "flex" }, alignItems: "flex-start" }}>
        {/* spacer ώστε το content να μην πάει κάτω από fixed sidebar */}
        <Box
          sx={{
            width: VET_SIDEBAR_W,
            flex: `0 0 ${VET_SIDEBAR_W}px`,
            display: { xs: "none", lg: "block" },
          }}
        />

        <VetNavbar mode="navbar" />
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>

      <Footer />
    </Box>
  );
}


/* ------------------ Page ------------------ */
export default function VetAppointments() {
  const { pathname } = useLocation();

  const TABS = useMemo(
    () => [
      { label: "Ραντεβού", to: "/vet/appointments" },
      { label: "Αιτήματα", to: "/vet/appointments/VetAppointmentsRequests" },
      { label: "Ενημερώσεις", to: "/vet/appointments/VetAppointmentsUpdates" },
      { label: "Διαθεσιμότητα", to: "/vet/appointments/VetAppointmentsAvailability" },
    ],
    []
  );

  return (
    <VetShell>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <AppBreadcrumbs />

        {/* ✅ Tabs */}
        <Stack direction="row" spacing={1.2} sx={{ mb: -1, position: "relative", zIndex: 1 }}>
          {TABS.map((t) => (
            <TabPill key={t.to} label={t.label} to={t.to} active={pathname === t.to} />
          ))}
        </Stack>

        {/* ✅ ίδια κεντρική κάρτα, άλλο περιεχόμενο */}
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            zIndex: 2,
            borderRadius: 2,
            border: `2px solid ${BORDER}`,
            boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
            p: 2,
            minHeight: 520,
          }}
        >
          <Typography sx={{ fontWeight: 900, color: TITLE, fontSize: 18, mb: 1 }}>
            Εβδομαδιαία Ραντεβού
          </Typography>

          <Divider sx={{ mb: 2 }} />

        </Paper>
      </Container>
    </VetShell>
  );
}
