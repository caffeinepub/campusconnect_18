import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[430px]">
        {/* Header */}
        <div className="campus-header-gradient rounded-3xl p-8 mb-6 text-white text-center shadow-card">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CampusConnect</h1>
          <p className="text-white/80 mt-1 text-sm">
            University Communication Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl shadow-card p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in securely with your university identity
          </p>

          <div className="space-y-3">
            <Button
              className="w-full h-12 text-base campus-header-gradient border-0 text-white hover:opacity-90"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in with University ID"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            New students and faculty will be prompted to set up their profile
            after signing in.
          </p>
        </div>

        {/* Role info */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Student", color: "bg-blue-100 text-blue-700" },
            { label: "Faculty", color: "bg-green-100 text-green-700" },
            { label: "Admin", color: "bg-red-100 text-red-700" },
          ].map((r) => (
            <div
              key={r.label}
              className={`${r.color} rounded-xl py-2 text-center text-xs font-semibold`}
            >
              {r.label}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
