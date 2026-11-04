import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthPage from "../pages/auth/AuthPage";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import SimulacaoPage from "../pages/simulacao/SimulacaoPage";
import FeedbackPage from "../pages/feedback/FeedbackPage";
import NotFoundPage from "../pages/erro/NotFoundPage";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/entrar", element: <AuthPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/simulacao/:entrevistaId", element: <SimulacaoPage /> },
          { path: "/feedback/:entrevistaId", element: <FeedbackPage /> },
        ],
      },
    ],
  },
  // Qualquer outra URL: 404 público e fullscreen (fora do ProtectedRoute e do AppLayout)
  { path: "*", element: <NotFoundPage /> },
]);

export default router;