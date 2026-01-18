import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // άμεσο scroll στην κορυφή σε κάθε αλλαγή route
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search, hash]);

  return null;
}
