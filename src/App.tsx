import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Events from "./pages/Events";
import Calendar from "./pages/Calendar";
import EventDetail from "./pages/EventDetail";
import Dashboard from "./pages/Dashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Donate from "./pages/Donate";
import EventGuidelines from "./pages/EventGuidelines";
import HelpCentre from "./pages/HelpCentre";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Partnership from "./pages/Partnership";
import Sitemap from "./pages/Sitemap";
import OrganizationProfile from "./pages/OrganizationProfile";
import OrganizationForm from "./pages/OrganizationForm";
import MinisterProfile from "./pages/MinisterProfile";
import MinisterForm from "./pages/MinisterForm";
import MyProfiles from "./pages/MyProfiles";
import ProfileEdit from "./pages/ProfileEdit";
import Ministers from "./pages/Ministers";
import Organizations from "./pages/Organizations";

import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/events" element={<Events />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/event-guidelines" element={<EventGuidelines />} />
            <Route path="/help-centre" element={<HelpCentre />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/partnership" element={<Partnership />} />
            <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/organization/:slug" element={<OrganizationProfile />} />
          <Route path="/organization/new" element={<OrganizationForm />} />
          <Route path="/organization/edit/:id" element={<OrganizationForm />} />
          <Route path="/ministers" element={<Ministers />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/minister/:slug" element={<MinisterProfile />} />
          <Route path="/minister/new" element={<MinisterForm />} />
          <Route path="/minister/edit/:id" element={<MinisterForm />} />
          <Route path="/my-profiles" element={<MyProfiles />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
