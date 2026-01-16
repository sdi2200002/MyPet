import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ role }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  // ✅ Αν δεν περιμένεις εδώ, στο refresh θα σε πετάει login πριν φορτώσει ο user
  if (authLoading) return null; // ή βάλε spinner

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role) {
    const r = String(user?.role || "").toLowerCase();
    const wanted = String(role).toLowerCase();

    const isOwner = r === "owner" || r === "ιδιοκτήτης";
    const isVet = r === "vet" || r === "κτηνίατρος";

    if (wanted === "owner" && !isOwner) return <Navigate to="/login" replace state={{ from: location }} />;
    if (wanted === "vet" && !isVet) return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
