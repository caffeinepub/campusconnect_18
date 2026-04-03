import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Announcement, Role } from "../backend";
import {
  useAnnouncements,
  useCallerProfile,
  useCreateAnnouncement,
} from "../hooks/useQueries";

const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    title: "Midterm Exam Schedule Released",
    content:
      "The midterm examination schedule for Spring 2026 is now available on the student portal. Please check your exam times and room assignments.",
    authorName: "Dr. Emily Chen",
    timestamp: BigInt(Date.now()) * BigInt(1_000_000),
  },
  {
    title: "Library Extended Hours",
    content:
      "The university library will extend its hours to 2:00 AM during exam week (March 28 - April 5). Student ID required for after-hours access.",
    authorName: "Admin Office",
    timestamp: BigInt(Date.now() - 3600000) * BigInt(1_000_000),
  },
  {
    title: "Research Symposium 2026",
    content:
      "Faculty and graduate students are invited to present at the Annual Research Symposium on April 15. Abstracts due by March 30.",
    authorName: "Prof. James Wilson",
    timestamp: BigInt(Date.now() - 7200000) * BigInt(1_000_000),
  },
];

const SKELETON_KEYS = ["ann-sk-a", "ann-sk-b", "ann-sk-c"];

function formatTime(timestamp: bigint) {
  const ms = Number(timestamp) / 1_000_000;
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

export default function AnnouncementsTab() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { data: profile } = useCallerProfile();
  const { data: announcements, isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();

  const canPost =
    profile?.role === Role.faculty || profile?.role === Role.admin;
  const displayAnnouncements =
    announcements && announcements.length > 0
      ? announcements
      : SAMPLE_ANNOUNCEMENTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createAnnouncement.mutateAsync({
        title,
        content,
        authorName: profile?.name ?? "Unknown",
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      });
      toast.success("Announcement posted!");
      setTitle("");
      setContent("");
      setShowForm(false);
    } catch {
      toast.error("Failed to post announcement");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="campus-header-gradient px-4 pt-12 pb-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Announcements</h1>
            <p className="text-white/70 text-xs">University updates</p>
          </div>
          {canPost && (
            <Button
              type="button"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl"
              onClick={() => setShowForm(!showForm)}
              data-ocid="announcements.open_modal_button"
            >
              {showForm ? (
                <X className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {showForm && canPost && (
            <form
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-2xl shadow-card p-4 space-y-3"
              data-ocid="announcements.dialog"
            >
              <h3 className="font-semibold text-sm text-foreground">
                New Announcement
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="ann-title">Title</Label>
                <Input
                  id="ann-title"
                  placeholder="Announcement title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-ocid="announcements.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-content">Message</Label>
                <Textarea
                  id="ann-content"
                  placeholder="Write your announcement..."
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  data-ocid="announcements.textarea"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="campus-header-gradient border-0 text-white hover:opacity-90"
                  disabled={createAnnouncement.isPending}
                  data-ocid="announcements.submit_button"
                >
                  Post
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  data-ocid="announcements.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            SKELETON_KEYS.map((k) => (
              <div
                key={k}
                className="bg-card rounded-2xl border border-border p-4 space-y-2"
              >
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))
          ) : displayAnnouncements.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="announcements.empty_state"
            >
              <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No announcements yet</p>
            </div>
          ) : (
            displayAnnouncements.map((ann, i) => (
              <div
                key={ann.title}
                className="bg-card border border-border rounded-2xl shadow-xs p-4"
                data-ocid={`announcements.item.${i + 1}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm text-foreground leading-tight">
                    {ann.title}
                  </h3>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatTime(ann.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ann.content}
                </p>
                <p className="text-xs text-primary mt-2 font-medium">
                  — {ann.authorName}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
