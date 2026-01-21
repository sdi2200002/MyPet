Επικοινωνία Ανθρώπου–Μηχανής - 2025/26 DiT/UoA
MyPet

ΜΕΛΗ ΟΜΑΔΑΣ
- ΑΓΓΕΛΟΠΟΥΛΟΣ ΝΙΚΟΛΑΟΣ (1115202200002)
- ΚΑΛΑΪΤΖΗ ΜΥΡΤΩ (1115202200055)

ΠΕΡΙΓΡΑΦΗ ΕΡΓΑΣΙΑΣ
Η εφαρμογή MyPet είναι μία web πλατφόρμα διαχείρισης κατοικιδίων, η οποία
υποστηρίζει διαφορετικούς ρόλους χρηστών (Ιδιοκτήτες και Κτηνιάτρους) και
παρέχει λειτουργίες για ραντεβού, δηλώσεις, ιατρικές πράξεις και αξιολογήσεις.

ΤΙ ΥΛΟΠΟΙΗΣΑΜΕ

ΓΕΝΙΚΑ
- Authentication & Authorization με AuthContext και Protected Routes
- Δημόσιες σελίδες (Home, Login, Register, Contact, Lost/Found προβολές)
- Navigation με διαφορετικά Navbars (Public / Owner / Vet)
- Breadcrumbs, Pagination (Pager), Scroll handling

ΙΔΙΟΚΤΗΤΗΣ (OWNER)
- Owner Dashboard με:
  - Προβολή κατοικιδίων
  - Mini Calendar ραντεβού
  - Τελευταίες Ενημερώσεις (notifications)
- Διαχείριση κατοικιδίων (MyPets)
- Ραντεβού:
  - Προβολή ραντεβού
  - Λεπτομέρειες ραντεβού
  - Επιτυχής ολοκλήρωση ραντεβού
- Δηλώσεις:
  - Δήλωση Απώλειας (Lost Wizard)
  - Δήλωση Εύρεσης (Found Wizard)
  - Ιστορικό Δηλώσεων
- Βιβλιάριο Υγείας:
  - Ιατρικές Πράξεις
  - Εμβολιασμοί
- Αξιολόγηση Κτηνιάτρου μετά από ολοκληρωμένο ραντεβού
- Προβολή προφίλ κτηνιάτρου και αξιολογήσεων

ΚΤΗΝΙΑΤΡΟΣ (VET)
- Vet Dashboard με:
  - Γρήγορες ενέργειες
  - Τελευταίες Ενημερώσεις (notifications)
- Καταγραφή νέου κατοικιδίου (NewPet Wizard)
- Καταχώρηση ιατρικών πράξεων
- Καταχώρηση εμβολιασμών
- Διαχείριση ραντεβού:
  - Λίστα ραντεβού
  - Διαθεσιμότητα
  - Αιτήματα ραντεβού
  - Ενημερώσεις κατάστασης
- Δηλώσεις:
  - Απώλειας
  - Εύρεσης
  - Υιοθεσίας
  - Αναδοχής
  - Μεταβίβασης

ΑΞΙΟΛΟΓΗΣΕΙΣ & ΒΑΘΜΟΛΟΓΙΕΣ
- Δημιουργία review από ιδιοκτήτη
- Αποθήκευση reviews στο db.json
- Υπολογισμός και ενημέρωση:
  - Μέσης βαθμολογίας (rating)
  - Πλήθους αξιολογήσεων (reviewsCount)
- Εμφάνιση βαθμολογίας σε:
  - Προφίλ κτηνιάτρου
  - Προτεινόμενους κτηνιάτρους

ΤΕΧΝΟΛΟΓΙΕΣ
- React
- React Router
- Material UI (MUI)
- json-server (db.json)
- Dayjs

ΟΔΗΓΙΕΣ ΕΓΚΑΤΑΣΤΑΣΗΣ
1) Κλωνοποίηση αποθετηρίου:
   git clone https://github.com/sdi2200002/MyPet.git

2) Εγκατάσταση εξαρτήσεων:
   npm install

3) Εκκίνηση json-server:
   npm run server

4) Εκκίνηση εφαρμογής:
   npm run dev

ΔΟΚΙΜΑΣΤΙΚΟΙ ΧΡΗΣΤΕΣ

Owners
- Email: nikos@test.gr
  Password: 1234
- Email: mirto@gmail.gr
  Password: 1234

Vets
- Email: ilab@test.gr
  Password: 1234
- g.papadopoulos.vet@gmail.com / Vet@2024!
- n.antoniou.vet@gmail.com / NikosVet!23
- e.dimitriou.vet@gmail.com / EleniVet@21
- i.lamprou.vet@gmail.com / IoannisVet#7

PRIVATE GITHUB REPOSITORY
https://github.com/sdi2200002/MyPet.git

