import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Edit2, Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Role, type UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useSaveProfile } from "../hooks/useQueries";

const ROLE_BADGE_STYLES: Record<Role, string> = {
  [Role.student]: "bg-blue-100 text-blue-700 border-blue-200",
  [Role.faculty]: "bg-green-100 text-green-700 border-green-200",
  [Role.admin]: "bg-red-100 text-red-700 border-red-200",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfileTab() {
  const { data: profile, isLoading } = useCallerProfile();
  const { clear, identity } = useInternetIdentity();
  const saveProfile = useSaveProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const handleSave = async () => {
    if (!form) return;
    try {
      await saveProfile.mutateAsync(form);
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (isLoading || !profile || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="campus-header-gradient px-4 pt-12 pb-16 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">My Profile</h1>
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
            data-ocid="profile.delete_button"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 -mt-10 pb-6 space-y-4">
          <div className="bg-card rounded-2xl shadow-card border border-border p-4 flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="campus-header-gradient text-white font-bold text-xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-card rounded-full" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-foreground text-lg">
                {profile.name}
              </h2>
              <Badge
                className={`text-xs mt-1 ${ROLE_BADGE_STYLES[profile.role]} border`}
              >
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-foreground">
                Personal Info
              </h3>
              <button
                type="button"
                onClick={() => (editing ? handleSave() : setEditing(true))}
                className="text-primary text-sm flex items-center gap-1"
                data-ocid={
                  editing ? "profile.save_button" : "profile.edit_button"
                }
              >
                {editing ? (
                  saveProfile.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save
                    </>
                  )
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Full Name
                </Label>
                {editing ? (
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9"
                    data-ocid="profile.input"
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.name}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                {editing ? (
                  <Input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="h-9"
                    data-ocid="profile.input"
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.email}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Department
                </Label>
                {editing ? (
                  <Input
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    className="h-9"
                    data-ocid="profile.input"
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.department}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Role</Label>
                {editing ? (
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as Role })}
                  >
                    <SelectTrigger className="h-9" data-ocid="profile.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Role.student}>Student</SelectItem>
                      <SelectItem value={Role.faculty}>Faculty</SelectItem>
                      <SelectItem value={Role.admin}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium capitalize">
                    {profile.role}
                  </p>
                )}
              </div>
            </div>
          </div>

          {identity && (
            <div className="bg-card rounded-2xl shadow-card border border-border p-4">
              <h3 className="font-semibold text-sm text-foreground mb-2">
                Principal ID
              </h3>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {identity.getPrincipal().toString()}
              </p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground pt-2">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="underline text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
