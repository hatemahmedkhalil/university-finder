import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Onboarding from "./components/Onboarding";
import LanguagePicker from "./components/LanguagePicker";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import CourseChat from "./pages/CourseChat";
import MyCourses from "./pages/MyCourses";
import InstructorMyProfile from "./pages/InstructorMyProfile";
import Announcements from "./pages/Announcements";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Recommendations from "./pages/Recommendations";
import Universities from "./pages/Universities";
import Scholarships from "./pages/Scholarships";
import Favourites from "./pages/Favourites";
import UniversityDetail from "./pages/UniversityDetail";
import LearningCenter from "./pages/LearningCenter";
import Instructors from "./pages/Instructors";
import InstructorProfile from "./pages/InstructorProfile";
import AiChat from "./pages/AiChat";
import PlacementTestPage from "./pages/PlacementTestPage";
import IeltsSimulator from "./pages/IeltsSimulator";
import IeltsExamPage from "./pages/IeltsExamPage";
import Simulators from "./pages/Simulators";
import ExamSession from "./pages/ExamSession";
import SimulatorResults from "./pages/SimulatorResults";
import CoursePage from "./pages/CoursePage";
import ApplicationHub from "./pages/ApplicationHub";
import Pipeline from "./pages/Pipeline";
import MyQuestions from "./pages/MyQuestions";
import InstructorPanel from "./pages/InstructorPanel";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import Notifications from "./pages/Notifications";
import EmailIntegration from "./pages/EmailIntegration";
import CalendarPage from "./pages/Calendar";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

// Shows InstructorDashboard for instructors, regular Dashboard for students
const SmartDashboard = () => {
  const { user } = useAuth();
  return user?.role === "instructor" ? <InstructorDashboard /> : <Dashboard />;
};

// Redirects already-authenticated users away from public-only pages
const FlowGuard = () => {
  const { user, loading, profileComplete } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user || profileComplete === null) return;

    const authOnlyPaths = ["/", "/login", "/register"];
    if (!authOnlyPaths.includes(pathname)) return;

    if (!user.has_completed_onboarding) {
      navigate("/dashboard", { replace: true });
    } else if (!profileComplete) {
      navigate("/profile", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, profileComplete, pathname]);

  return null;
};

// Renders the language picker (pre-auth) and the onboarding modal (post-auth)
const AppInner = () => {
  const { showOnboarding, user } = useAuth();
  const [langPicked, setLangPicked] = useState(() => !!localStorage.getItem("lang"));

  if (!langPicked) return <LanguagePicker onDone={() => setLangPicked(true)} />;
  if (!user) return null;                      // never show modals before login
  if (!showOnboarding) return null;
  return <Onboarding />;
};

const App = () => (
  <ThemeProvider>
  <AuthProvider>
    <BrowserRouter>
      <DashboardLayout>
        <FlowGuard />
        <AppInner />
        <Routes>
          <Route path="/"              element={<Landing />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />
          <Route path="/universities"  element={<Universities />} />
          <Route path="/scholarships"  element={<Scholarships />} />
          <Route path="/pricing"       element={<Pricing />} />

          <Route path="/dashboard"      element={<ProtectedRoute><SmartDashboard /></ProtectedRoute>} />
          <Route path="/announcements"  element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
          <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/favourites"     element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
          <Route path="/university/:id" element={<ProtectedRoute><UniversityDetail /></ProtectedRoute>} />
          <Route path="/instructors"    element={<ProtectedRoute><Instructors /></ProtectedRoute>} />
          <Route path="/instructors/:id" element={<ProtectedRoute><InstructorProfile /></ProtectedRoute>} />
          <Route path="/learning"       element={<ProtectedRoute><LearningCenter /></ProtectedRoute>} />
          <Route path="/learning/ielts"              element={<ProtectedRoute><IeltsSimulator /></ProtectedRoute>} />
          <Route path="/learning/ielts/:id"          element={<ProtectedRoute><IeltsExamPage /></ProtectedRoute>} />
          <Route path="/learning/placement/:language" element={<ProtectedRoute><PlacementTestPage /></ProtectedRoute>} />
          <Route path="/learning/courses/:language"   element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
          <Route path="/pipeline"       element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
          <Route path="/apply-hub"       element={<ProtectedRoute><ApplicationHub /></ProtectedRoute>} />
          <Route path="/apply-hub/:universityId" element={<ProtectedRoute><ApplicationHub /></ProtectedRoute>} />
          <Route path="/my-questions"   element={<ProtectedRoute><MyQuestions /></ProtectedRoute>} />
          <Route path="/instructor-panel" element={<ProtectedRoute><InstructorPanel /></ProtectedRoute>} />
          <Route path="/course-chat/:id"      element={<ProtectedRoute><CourseChat /></ProtectedRoute>} />
          <Route path="/my-courses"            element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
          <Route path="/my-instructor-profile" element={<ProtectedRoute><InstructorMyProfile /></ProtectedRoute>} />
          <Route path="/support"        element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/notifications"  element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/ai-chat"        element={<ProtectedRoute><AiChat /></ProtectedRoute>} />
          <Route path="/email-integration" element={<ProtectedRoute><EmailIntegration /></ProtectedRoute>} />
          <Route path="/calendar"          element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/settings"       element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Test Simulators */}
          <Route path="/simulators"             element={<ProtectedRoute><Simulators /></ProtectedRoute>} />
          <Route path="/simulators/ielts"       element={<ProtectedRoute><IeltsSimulator /></ProtectedRoute>} />
          <Route path="/simulators/ielts/:id"   element={<ProtectedRoute><IeltsExamPage /></ProtectedRoute>} />
          <Route path="/simulators/exam/:examType" element={<ProtectedRoute><ExamSession /></ProtectedRoute>} />
          <Route path="/simulators/results/:attemptId" element={<ProtectedRoute><SimulatorResults /></ProtectedRoute>} />
          <Route path="/simulators/history"     element={<ProtectedRoute><Simulators /></ProtectedRoute>} />
        </Routes>
      </DashboardLayout>
      <Toaster position="top-right" />
    </BrowserRouter>
  </AuthProvider>
  </ThemeProvider>
);

export default App;
