import { useApp } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import Onboarding from "./Onboarding";

const Index = () => {
  const { isOnboarded } = useApp();

  if (isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Onboarding />;
};

export default Index;
