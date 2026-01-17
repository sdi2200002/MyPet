import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/public/Home.jsx";
import OwnerDashboard from "./pages/owner/OwnerDashboard.jsx";
import VetDashboard from "./pages/vet/VetDashboard.jsx";
import Contact from "./pages/public/Contact.jsx";
import NotFound from "./pages/common/NotFound.jsx";
import Login from "./pages/public/Login.jsx";
import ForgotPassword from "./pages/public/ForgotPassword.jsx";
import RegisterOwner from "./pages/public/RegisterOwner.jsx";
import RegisterVet from "./pages/public/RegisterVet.jsx";

import MyDeclarations from "./pages/owner/MyDeclarations.jsx";
import DeclarationsNew from "./pages/owner/DeclarationsNew.jsx";
import LostWizard from "./pages/owner/LostWizard.jsx";
import FoundWizard from "./pages/public/FoundWizard.jsx";
import DeclarationSuccess from "./pages/owner/DeclarationSuccess.jsx";
import AdoptionWizard from "./pages/vet/AdoptionWizard.jsx";
import TransferWizard from "./pages/vet/TransferWizard.jsx";
import FosterWizard from "./pages/vet/FosterWizard.jsx";

import MyAppointments from "./pages/owner/MyAppointments.jsx";
import VetNewAppointment from "./pages/owner/VetNewAppointment.jsx";
import AppointmentSuccess from "./pages/owner/AppointmentSuccess.jsx";
import AppointmentDetails from "./pages/owner/AppointmentDetails.jsx";
import VetAppointments from "./pages/vet/VetAppointments.jsx";
import VetAppointmentsRequests from "./pages/vet/VetAppointmentsRequests.jsx";
import VetAppointmentsUpdates from "./pages/vet/VetAppointmentsUpdates.jsx";
import VetAppointmentsAvailability from "./pages/vet/VetAppointmentsAvailability.jsx";

import LostPets from "./pages/public/LostPets";
import LostPetDetails from "./pages/public/LostPetDetails";
import FoundPetDetails from "./pages/public/FoundPetDetails";

import MyPets from "./pages/owner/MyPets.jsx";
import PetSearch from "./pages/vet/PetSearch.jsx";
import PetBookletDetails from "./pages/owner/PetBookletDetails.jsx";
import PetBookletVaccinations from "./pages/owner/PetBookletVaccinations.jsx";
import VetVaccinationsNew from "./pages/vet/VetVaccinationNew.jsx";
import PetBookletActs from "./pages/owner/PetBookletActs.jsx";
import VetActNew from "./pages/vet/VetActNew.jsx";

import VetSearch from "./pages/owner/VetSearch.jsx";
import VetProfile from "./pages/owner/VetProfile.jsx";
import VetReviews from "./pages/owner/VetReviews.jsx";
import VetNewReview from "./pages/owner/VetNewReview.jsx";
import VetReviewDetails from "./pages/owner/VetReviewDetails.jsx";
import OwnerProfile from "./pages/owner/Profile.jsx";
import OwnerFoundDetails from "./pages/owner/OwnerFoundDetails.jsx";

// ✅ Auth
import { AuthProvider } from "./auth/AuthContext.jsx";

// ✅ NEW: Route Guard
import ProtectedRoute from "./components/ProtectedRoute.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ---------------- Public ---------------- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register/owner" element={<RegisterOwner />} />
          <Route path="/register/vet" element={<RegisterVet />} />

          <Route path="/lost" element={<LostPets />} />
          <Route path="/lost/:id" element={<LostPetDetails />} />
          <Route path="/found/:id" element={<FoundPetDetails />} />
          <Route path="/found/new" element={<FoundWizard role="public" />} />
          <Route path="/vets" element={<VetSearch role="public" />} />
          <Route path="/vets/:vetId" element={<VetProfile role="public" />} />
          
          <Route path="/vets/:vetId/reviews" element={<VetReviews role="public" />} />
          <Route path="/vets/:vetId/reviews/:reviewId" element={<VetReviewDetails role="public" />} />
          <Route path="/vets/:vetId/reviews" element={<VetReviews role="public" />} />
          <Route path="/vets/:vetId/reviews/:reviewId" element={<VetReviewDetails role="public" />} />

          <Route path="/contact" element={<Contact />} />

          {/* ---------------- Owner (Protected) ---------------- */}
          <Route element={<ProtectedRoute allow={["owner"]} />}>
            <Route path="/owner" element={<OwnerDashboard />} />

            <Route path="/owner/pets" element={<MyPets role="owner" />} />
            <Route path="/owner/pets/:id/booklet" element={<PetBookletDetails role="owner" />} />
            <Route path="/owner/pets/:id/booklet/vaccinations" element={<PetBookletVaccinations role="owner" />} />
            <Route path="/owner/pets/:id/booklet/acts" element={<PetBookletActs role="owner" />} />

            <Route path="/owner/vets" element={<VetSearch />} />
            <Route path="/owner/vets/:vetId" element={<VetProfile />} />
            <Route path="/owner/vets/:vetId/new" element={<VetNewAppointment />} />
            <Route path="/owner/vets/:vetId/reviews" element={<VetReviews role="owner" />} />
            <Route path="/owner/vets/:vetId/reviews/:reviewId" element={<VetReviewDetails role="owner" />} />

            <Route path="/owner/appointments" element={<MyAppointments />} />
            <Route path="/owner/appointments/success" element={<AppointmentSuccess />} />
            <Route path="/owner/appointments/:appId" element={<AppointmentDetails role="vet" />} />
            <Route path="/owner/appointments/:appId/review" element={<VetNewReview />} />

            <Route path="/owner/declarations" element={<MyDeclarations role="owner" />} />
            <Route path="/owner/declarations/new" element={<DeclarationsNew role="owner" />} />
            <Route path="/owner/declarations/found/new" element={<FoundWizard role="owner" />} />
            <Route path="/owner/declarations/lost/new" element={<LostWizard role="owner" />} />
            <Route path="/owner/declarations/success" element={<DeclarationSuccess role="owner" />} />
            <Route path="/owner/found/:id" element={<OwnerFoundDetails />} />

            <Route path="/owner/profile" element={<OwnerProfile role="owner" />} />
          </Route>

          {/* ---------------- Vet (Protected) ---------------- */}
          <Route element={<ProtectedRoute allow={["vet"]} />}>
            <Route path="/vet" element={<VetDashboard />} />

            <Route path="/vet/mypets" element={<MyPets role="vet" />} />
            <Route path="/vet/mypets/:id/booklet" element={<PetBookletDetails role="vet" />} />
            <Route path="/vet/mypets/:id/booklet/vaccinations" element={<PetBookletVaccinations role="vet" />} />
            <Route path="/vet/mypets/:id/booklet/vaccinations/new" element={<VetVaccinationsNew />} />
            <Route path="/vet/mypets/:id/booklet/acts" element={<PetBookletActs role="vet" />} />
            <Route path="/vet/mypets/:id/booklet/acts/new" element={<VetActNew />} />

            <Route path="/vet/pets" element={<PetSearch />} />
            <Route path="/vet/pets/:id/booklet" element={<PetBookletDetails role="vet" />} />
            <Route path="/vet/pets/:id/booklet/vaccinations" element={<PetBookletVaccinations role="vet" />} />
            <Route path="/vet/pets/:id/booklet/vaccinations/new" element={<VetVaccinationsNew />} />
            <Route path="/vet/pets/:id/booklet/acts" element={<PetBookletActs role="vet" />} />
            <Route path="/vet/pets/:id/booklet/acts/new" element={<VetActNew />} />

            <Route path="/vet/appointments" element={<VetAppointments />} />
            <Route path="/vet/appointments/VetAppointmentsRequests" element={<VetAppointmentsRequests />} />
            <Route path="/vet/appointments/VetAppointmentsUpdates" element={<VetAppointmentsUpdates />} />
            <Route path="/vet/appointments/VetAppointmentsAvailability" element={<VetAppointmentsAvailability />} />
            <Route path="/vet/appointments/:appId" element={<AppointmentDetails role="vet" />} />

            <Route path="/vet/declarations" element={<MyDeclarations role="vet" />} />
            <Route path="/vet/declarations/new" element={<DeclarationsNew role="vet" />} />
            <Route path="/vet/declarations/found/new" element={<FoundWizard role="vet" />} />
            <Route path="/vet/declarations/lost/new" element={<LostWizard role="vet" />} />
            <Route path="/vet/declarations/adoption/new" element={<AdoptionWizard role="vet" />} />
            <Route path="/vet/declarations/transfer/new" element={<TransferWizard role="vet" />} />
            <Route path="/vet/declarations/foster/new" element={<FosterWizard role="vet" />} />
            <Route path="/vet/declarations/success" element={<DeclarationSuccess role="vet" />} />

            <Route path="/vet/profile" element={<OwnerProfile role="vet" />} />
            <Route path="/vet/profile/:vetId/reviews" element={<VetReviews role="vet" />} />
            <Route path="/vet/profile/:vetId/reviews/:reviewId" element={<VetReviewDetails role="vet" />} />

          </Route>

          {/* ---------------- 404 ---------------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
