import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/public/Home.jsx";
import Login from "./pages/public/Login.jsx";
import Contact from "./pages/public/Contact.jsx";

import OwnerDashboard from "./pages/owner/OwnerDashboard.jsx";
import MyDeclarations from "./pages/owner/MyDeclarations.jsx";
import DeclarationsNew from "./pages/owner/DeclarationsNew.jsx";
import MyAppointments from "./pages/owner/MyAppointments.jsx";

import VetDashboard from "./pages/vet/VetDashboard.jsx";
import NotFound from "./pages/common/NotFound.jsx";

import LostWizard from "./pages/owner/LostWizard.jsx";
import FoundWizard from "./pages/public/FoundWizard.jsx";
import DeclarationSuccess from "./pages/owner/DeclarationSuccess.jsx";

import LostPets from "./pages/public/LostPets";
import LostPetDetails from "./pages/public/LostPetDetails";
import FoundPetDetails from "./pages/public/FoundPetDetails";

import ForgotPassword from "./pages/public/ForgotPassword.jsx";
import RegisterOwner from "./pages/public/RegisterOwner.jsx";
import RegisterVet from "./pages/public/RegisterVet.jsx";

import MyPets from "./pages/owner/MyPets.jsx";
import PetBookletDetails from "./pages/owner/PetBookletDetails.jsx";
import PetBookletVaccinations from "./pages/owner/PetBookletVaccinations.jsx";
import PetBookletActs from "./pages/owner/PetBookletActs.jsx";

import VetSearch from "./pages/owner/VetSearch.jsx";
import VetProfile from "./pages/owner/VetProfile.jsx";
import VetNewAppointment from "./pages/owner/VetNewAppointment.jsx";
import VetReviews from "./pages/owner/VetReviews.jsx";
import AppointmentSuccess from "./pages/owner/AppointmentSuccess.jsx";
import AppointmentDetails from "./pages/owner/AppointmentDetails.jsx";
import VetNewReview from "./pages/owner/VetNewReview.jsx";
import VetReviewDetails from "./pages/owner/VetReviewDetails.jsx";
import OwnerProfile from "./pages/owner/Profile.jsx";



// ✅ ΠΡΟΣΘΗΚΗ: AuthProvider
import { AuthProvider } from "./auth/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register/owner" element={<RegisterOwner />} />
          <Route path="/register/vet" element={<RegisterVet />} />

          <Route path="/lost" element={<LostPets />} />
          <Route path="/lost/:id" element={<LostPetDetails />} />
          <Route path="/found/:id" element={<FoundPetDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/found/new" element={<FoundWizard showSidebar={false} />} />

          {/* Owner */}
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/declarations" element={<MyDeclarations />} />
          <Route path="/owner/declarations/new" element={<DeclarationsNew />} />
          <Route path="/owner/appointments" element={<MyAppointments />} />
          <Route path="/owner/declarations/found/new" element={<FoundWizard showSidebar={true} />} />
          <Route path="/owner/declarations/lost/new" element={<LostWizard showSidebar={true} />} />
          <Route path="/owner/declarations/success" element={<DeclarationSuccess />} />
          <Route path="/owner/pets" element={<MyPets />} />
          <Route path="/owner/pets/:id/booklet" element={<PetBookletDetails />} />
          <Route path="/owner/pets/:id/booklet/vaccinations" element={<PetBookletVaccinations />} />
          <Route path="/owner/pets/:id/booklet/acts" element={<PetBookletActs />} />
          <Route path="/owner/vets" element={<VetSearch />} />
          <Route path="/owner/vets/:vetId" element={<VetProfile />} />
          <Route path="/owner/vets/:vetId/new" element={<VetNewAppointment />} />
          <Route path="/owner/vets/:vetId/reviews" element={<VetReviews />} />
          <Route path="/owner/vets/:vetId/reviews/:reviewId" element={<VetReviewDetails />} />
          <Route path="/owner/appointments/success" element={<AppointmentSuccess />} />
          <Route path="/owner/appointments/:appId" element={<AppointmentDetails />} />
          <Route path="/owner/appointments/:appId/review" element={<VetNewReview />} />
          <Route path="/owner/profile" element={<OwnerProfile />} />

          {/* Vet */}
          <Route path="/vet" element={<VetDashboard />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
