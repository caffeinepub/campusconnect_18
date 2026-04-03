import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Role } from "../backend";
import { useRegisterUser } from "../hooks/useQueries";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<Role>(Role.student);
  const registerUser = useRegisterUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !department.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await registerUser.mutateAsync({
        name,
        email,
        department,
        role,
        isOnline: true,
      });
      toast.success("Profile created! Welcome to CampusConnect.");
    } catch {
      toast.error("Failed to create profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[430px]">
        <div className="campus-header-gradient rounded-3xl p-6 mb-6 text-white text-center shadow-card">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Set Up Your Profile</h1>
          <p className="text-white/80 text-sm mt-1">Join CampusConnect</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl shadow-card border border-border p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="e.g. Dr. Sarah Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-ocid="register.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">University Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. sarah.johnson@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-ocid="register.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept">Department</Label>
            <Input
              id="dept"
              placeholder="e.g. Computer Science"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              data-ocid="register.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger data-ocid="register.select">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.student}>Student</SelectItem>
                <SelectItem value={Role.faculty}>Faculty</SelectItem>
                <SelectItem value={Role.admin}>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full h-11 campus-header-gradient border-0 text-white hover:opacity-90"
            disabled={registerUser.isPending}
            data-ocid="register.submit_button"
          >
            {registerUser.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating profile...
              </>
            ) : (
              "Join CampusConnect"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
