import { Megaphone, MessageSquare, User } from "lucide-react";
import { useState } from "react";
import type { ContactEntry } from "../backend";
import AnnouncementsTab from "./AnnouncementsTab";
import ChatsTab from "./ChatsTab";
import ProfileTab from "./ProfileTab";

interface Props {
  activeTab: "chats" | "announcements" | "profile";
  setActiveTab: (tab: "chats" | "announcements" | "profile") => void;
}

export default function MainApp({ activeTab, setActiveTab }: Props) {
  const [selectedContact, setSelectedContact] = useState<ContactEntry | null>(
    null,
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[430px] flex flex-col min-h-screen relative">
          <main className="flex-1 pb-20 overflow-hidden">
            {activeTab === "chats" && (
              <ChatsTab
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
              />
            )}
            {activeTab === "announcements" && <AnnouncementsTab />}
            {activeTab === "profile" && <ProfileTab />}
          </main>

          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border shadow-card z-50">
            <div className="flex items-center">
              {[
                { id: "chats" as const, icon: MessageSquare, label: "Chats" },
                {
                  id: "announcements" as const,
                  icon: Megaphone,
                  label: "Updates",
                },
                { id: "profile" as const, icon: User, label: "Profile" },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                    setSelectedContact(null);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                    activeTab === id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid={`nav.${id}.tab`}
                >
                  <Icon
                    className={`w-5 h-5 ${activeTab === id ? "fill-primary/20" : ""}`}
                  />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
