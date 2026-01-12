const VETS_KEY = "mypet_owner_vets";
const REVIEWS_KEY = "mypet_owner_vet_reviews";
const APPTS_KEY = "mypet_owner_appointments";

const demoVets = [
  {
    id: "vet_kyriaki",
    name: "Κυριακή Νικολάου",
    clinic: "Κλινική μικρών ζώων",
    rating: 4.8,
    reviewsCount: 120,
    priceRange: "40€ - 50€",
    photo: "/images/vet1.jpg", // βάλε μια εικόνα στο public/images ή άλλαξε path
    address: "Λεωφόρος Κηφισίας 124, Αμπελόκηποι, Αθήνα 11526",
    phone: "6900000000",
    email: "doc@gmail.com",
    experience: "10+ χρόνια",
    studies:
      "Πτυχίο Κτηνιατρικής, Τμήμα Κτηνιατρικής, Σχολή Επιστημών Υγείας, Αριστοτέλειο Πανεπιστήμιο Θεσσαλονίκης",
    specialties: ["Βασική Κλινική Εξέταση", "Εμβολιασμοί", "Διαγνωστικές Εξετάσεις"],
    // demo εβδομάδα/ώρες (για να ζωγραφίσεις slots)
    availability: {
      "2025-11-17": ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00"],
      "2025-11-18": ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00"],
      "2025-11-19": ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00"],
      "2025-11-20": ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00"],
      "2025-11-21": ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00"],
    },
  },
];

const demoReviews = {
  vet_kyriaki: [
    { id: "r1", stars: 5, author: "Μαρία Κ.", date: "2024-11-12", text: "Εξαιρετική κτηνίατρος, πολύ ήρεμη με τη γάτα μου." },
    { id: "r2", stars: 4.8, author: "Γιάννης Π.", date: "2024-03-01", text: "Άμεση διάγνωση και καθαρή εξήγηση, με βοήθησε πολύ." },
    { id: "r3", stars: 5, author: "Ελένη Μ.", date: "2024-10-28", text: "Καταπληκτική! Το σκυλάκι μου την λάτρεψε." },
    { id: "r4", stars: 3, author: "Γιώργος Α.", date: "2023-11-03", text: "Πολύ καλή." },
  ],
};

function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function safeSave(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/** Κάλεσέ το 1 φορά (πχ στο VetSearch useEffect/useMemo) */
export function seedVetsIfEmpty() {
  const vets = safeLoad(VETS_KEY, null);
  if (!vets || !Array.isArray(vets) || vets.length === 0) safeSave(VETS_KEY, demoVets);

  const reviews = safeLoad(REVIEWS_KEY, null);
  if (!reviews || typeof reviews !== "object") safeSave(REVIEWS_KEY, demoReviews);

  const appts = safeLoad(APPTS_KEY, null);
  if (!appts || !Array.isArray(appts)) safeSave(APPTS_KEY, []);
}

export function getVets() {
  return safeLoad(VETS_KEY, []);
}

export function getVetById(vetId) {
  return getVets().find((v) => v.id === vetId);
}

export function getReviewsByVetId(vetId) {
  const all = safeLoad(REVIEWS_KEY, {});
  return all[vetId] || [];
}

// για το confirm ραντεβού (αν το θες)
export function addAppointment(appt) {
  const list = safeLoad(APPTS_KEY, []);
  const next = [{ ...appt, id: appt.id || `appt_${Date.now()}` }, ...list];
  safeSave(APPTS_KEY, next);
  return next[0];
}
