import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile } from "./hooks/useQueries";
import LoginPage from "./pages/LoginPage";
import MainApp from "./pages/MainApp";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const [activeTab, setActiveTab] = useState<
    "chats" | "announcements" | "profile"
  >("chats");

  if (isInitializing || (identity && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 campus-header-gradient rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">CC</span>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading CampusConnect...
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (profile === null) {
    return (
      <>
        <RegisterPage />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <MainApp activeTab={activeTab} setActiveTab={setActiveTab} />
      <Toaster />
    </>
  );
}
