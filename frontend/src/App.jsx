import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoadingPage from "./pages/LoadingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Accessibility from "./pages/dashboard/Accessibility";
import Wcag from "./pages/dashboard/Wcag";
import Competitor from "./pages/dashboard/Competitor";
import Recommendations from "./pages/dashboard/Recommendations";
import CodeGenerator from "./pages/dashboard/CodeGenerator";
import BeforeAfter from "./pages/dashboard/BeforeAfter";
import History from "./pages/dashboard/History";
import Projects from "./pages/dashboard/Projects";
import Settings from "./pages/dashboard/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/loading" element={<LoadingPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="accessibility" element={<Accessibility />} />
        <Route path="wcag" element={<Wcag />} />
        <Route path="competitor" element={<Competitor />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="code" element={<CodeGenerator />} />
        <Route path="before-after" element={<BeforeAfter />} />
        <Route path="history" element={<History />} />
        <Route path="projects" element={<Projects />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
