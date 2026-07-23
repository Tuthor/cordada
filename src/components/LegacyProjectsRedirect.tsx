import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const LegacyProjectsRedirect = () => {
  const { userRole, loading } = useAuth();
  if (loading) return null;
  if (userRole === "client") return <Navigate to="/challenges" replace />;
  if (userRole === "consultant" || userRole === "consulting_firm")
    return <Navigate to="/cordadas-abiertas" replace />;
  return <Navigate to="/dashboard" replace />;
};
