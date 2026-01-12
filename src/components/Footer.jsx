import { Box, Container, Stack, Typography, Link as MLink } from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <Box sx={{ mt: 8 }}>
      {/* WAVE */}
      <Box sx={{ position: "relative", height: 380, overflow: "hidden" }}>
        <Box
          component="svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {/* το πάνω μέρος μένει λευκό, το κάτω είναι το wave */}
          <path
            fill="#cfe0f7"
            d="M0,224
               C160,160 320,128 480,144
               C640,160 800,224 960,224
               C1120,224 1280,160 1440,128
               L1440,320 L0,320 Z"
          />
        </Box>

        {/* CONTENT πάνω στο wave */}
        <Box
            sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,   // ⬅️ καρφώνει κάτω
                pb: 4,       // ⬅️ απόσταση από την κάτω άκρη
            }}
        >

          <Container maxWidth="lg">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
              {/* Left: logo + copyright */}
              <Stack spacing={1} sx={{ ml: 7 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <img src="/images/logo.png" alt="MyPet" height={26} />
                    <Typography
                      component={Link}
                      to="/"
                      sx={{
                        textDecoration: "none",
                        color: "#0d2c54",
                        fontWeight: 600,
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                    MyPet
                    </Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: "#0d2c54" }}>
                    © 2025 MyPet
                </Typography>
               </Stack>


              {/* Middle: links + social */}
              <Stack spacing={0.6} sx={{ color: "#0d2c54" }}>
                <Typography
                  component={Link}
                  to="/contact"
                  sx={{
                    textDecoration: "none",
                    color: "#0d2c54",
                    fontWeight: 600,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Επικοινωνία
                </Typography>

                <Typography
                  component={Link}
                  sx={{
                    textDecoration: "none",
                    color: "#0d2c54",
                    fontWeight: 600,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Όροι χρήσης
                </Typography>
                
                <Typography
                  component={Link}
                  sx={{
                    textDecoration: "none",
                    color: "#0d2c54",
                    fontWeight: 600,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Πολιτική απορρήτου
                </Typography>

                <Typography
                  sx={{
                    textDecoration: "none",
                    color: "#0d2c54",
                    fontWeight: 600,
                  }}
                >
                  Βρείτε μας:
                </Typography>

                <Stack direction="row" spacing={1}>
                  <InstagramIcon />
                  <FacebookIcon />
                  <MailOutlineIcon />
                </Stack>
              </Stack>

              {/* Right: κενό (για να μοιάζει με το wireframe που έχει “άδειο χώρο”) */}
              <Box sx={{ width: 500 }} />
            </Stack>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
