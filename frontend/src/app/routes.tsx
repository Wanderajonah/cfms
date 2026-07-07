import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { FeedbackForm } from "./pages/FeedbackForm";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { FeedbackManagement } from "./pages/FeedbackManagement";
import { FeedbackDetail } from "./pages/FeedbackDetail";
import { StaffPanel } from "./pages/StaffPanel";
import { UserManagement } from "./pages/UserManagement";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminLayout, StaffLayout } from "./components/layout/RoleLayouts";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/feedback", Component: FeedbackForm },
  { path: "/login", Component: LoginPage },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "feedback", Component: FeedbackManagement },
      { path: "feedback/:id", Component: FeedbackDetail },
      { path: "users", Component: UserManagement },
      { path: "profile", Component: ProfilePage },
    ],
  },
  {
    path: "/staff",
    Component: StaffLayout,
    children: [
      { index: true, Component: StaffPanel },
      { path: "feedback/:id", Component: FeedbackDetail },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);
