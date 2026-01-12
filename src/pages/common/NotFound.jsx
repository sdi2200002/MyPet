import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        404
      </Typography>
      <Typography sx={{ mb: 3 }}>
        Η σελίδα που ζητήσατε δεν βρέθηκε
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        Επιστροφή στην Αρχική
      </Button>
    </Box>
  );
}
