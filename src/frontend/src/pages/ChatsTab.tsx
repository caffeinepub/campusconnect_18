import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type ContactEntry, type GroupEntry, Role } from "../backend";
import {
  useCallerProfile,
  useContacts,
  useCreateGroup,
  useGroupMessages,
  useGroups,
  useJoinGroup,
  useMessageHistory,
  useSendGroupMessage,
  useSendMessage,
} from "../hooks/useQueries";

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d"];

const ROLE_BADGE_STYLES: Record<Role, string> = {
  [Role.student]: "bg-blue-100 text-blue-700 border-blue-200",
  [Role.faculty]: "bg-green-100 text-green-700 border-green-200",
  [Role.admin]: "bg-red-100 text-red-700 border-red-200",
};

function getRoleLabel(role: Role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type ActiveTab = "students" | "faculty" | "groups";

interface Props {
  selectedContact: ContactEntry | null;
  setSelectedContact: (c: ContactEntry | null) => void;
}

export default function ChatsTab({
  selectedContact,
  setSelectedContact,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("students");
  const [selectedGroup, setSelectedGroup] = useState<GroupEntry | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDept, setNewGroupDept] = useState("");

  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { mutate: createGroup, isPending: isCreating } = useCreateGroup();
  const { mutate: joinGroup, isPending: isJoining } = useJoinGroup();

  const studentContacts = (contacts ?? []).filter(
    (c) => c.profile.role === Role.student,
  );
  const facultyContacts = (contacts ?? []).filter(
    (c) => c.profile.role === Role.faculty,
  );

  const filteredStudents = studentContacts.filter(
    (c) =>
      c.profile.name.toLowerCase().includes(search.toLowerCase()) ||
      c.profile.department.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredFaculty = facultyContacts.filter(
    (c) =>
      c.profile.name.toLowerCase().includes(search.toLowerCase()) ||
      c.profile.department.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredGroups = (groups ?? []).filter(
    (g) =>
      g.group.name.toLowerCase().includes(search.toLowerCase()) ||
      g.group.department.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !newGroupDept.trim()) {
      toast.error("Please fill in group name and department.");
      return;
    }
    createGroup(
      { name: newGroupName.trim(), department: newGroupDept.trim() },
      {
        onSuccess: () => {
          toast.success("Group created!");
          setNewGroupName("");
          setNewGroupDept("");
          setShowCreateForm(false);
        },
        onError: () => toast.error("Failed to create group."),
      },
    );
  };

  const handleJoinGroup = (groupId: string) => {
    joinGroup(groupId, {
      onSuccess: () => toast.success("Joined group!"),
      onError: () =>
        toast.error("Could not join group. You may already be a member."),
    });
  };

  if (selectedContact) {
    return (
      <ChatWindow
        contact={selectedContact}
        onBack={() => setSelectedContact(null)}
      />
    );
  }

  if (selectedGroup) {
    return (
      <GroupChatWindow
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "students", label: "Students" },
    { id: "faculty", label: "Faculty" },
    { id: "groups", label: "Groups" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="campus-header-gradient px-4 pt-12 pb-3 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">CampusConnect</h1>
            <p className="text-white/70 text-xs">Stay connected</p>
          </div>
          <button
            type="button"
            className="relative w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
            data-ocid="chats.bell.button"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-400 rounded-full text-[10px] flex items-center justify-center font-bold">
              3
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            className="w-full bg-white/20 border border-white/30 rounded-xl pl-9 pr-4 py-2 text-white placeholder:text-white/60 text-sm focus:outline-none focus:bg-white/25"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="chats.search_input"
          />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 bg-white/10 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-white/70 hover:text-white/90"
              }`}
              data-ocid={`chats.${tab.id}.tab`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* STUDENTS TAB */}
          {activeTab === "students" &&
            (contactsLoading ? (
              SKELETON_KEYS.map((k) => (
                <div
                  key={k}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card"
                >
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : filteredStudents.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-ocid="chats.students.empty_state"
              >
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No students found</p>
              </div>
            ) : (
              filteredStudents.map((contact, i) => (
                <ContactCard
                  key={contact.principal.toString()}
                  contact={contact}
                  index={i + 1}
                  onClick={() => setSelectedContact(contact)}
                />
              ))
            ))}

          {/* FACULTY TAB */}
          {activeTab === "faculty" &&
            (contactsLoading ? (
              SKELETON_KEYS.map((k) => (
                <div
                  key={k}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card"
                >
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : filteredFaculty.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-ocid="chats.faculty.empty_state"
              >
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No faculty found</p>
              </div>
            ) : (
              filteredFaculty.map((contact, i) => (
                <ContactCard
                  key={contact.principal.toString()}
                  contact={contact}
                  index={i + 1}
                  onClick={() => setSelectedContact(contact)}
                />
              ))
            ))}

          {/* GROUPS TAB */}
          {activeTab === "groups" && (
            <div className="space-y-2">
              {/* Create Group Button */}
              <button
                type="button"
                onClick={() => setShowCreateForm((v) => !v)}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all text-sm font-medium"
                data-ocid="chats.groups.create_button"
              >
                <Plus className="w-4 h-4" />
                Create New Group
              </button>

              {/* Inline Create Form */}
              {showCreateForm && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    New Group
                  </p>
                  <Input
                    placeholder="Group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="text-sm"
                    data-ocid="chats.groups.name_input"
                  />
                  <Input
                    placeholder="Department (e.g. Computer Science)"
                    value={newGroupDept}
                    onChange={(e) => setNewGroupDept(e.target.value)}
                    className="text-sm"
                    data-ocid="chats.groups.dept_input"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 campus-header-gradient border-0 text-white hover:opacity-90"
                      onClick={handleCreateGroup}
                      disabled={isCreating}
                      data-ocid="chats.groups.submit_button"
                    >
                      {isCreating ? "Creating..." : "Create Group"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewGroupName("");
                        setNewGroupDept("");
                      }}
                      data-ocid="chats.groups.cancel_button"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {groupsLoading ? (
                SKELETON_KEYS.map((k) => (
                  <div
                    key={k}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card"
                  >
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : filteredGroups.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="chats.groups.empty_state"
                >
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No groups yet. Create one!</p>
                </div>
              ) : (
                filteredGroups.map((group, i) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    index={i + 1}
                    onOpen={() => setSelectedGroup(group)}
                    onJoin={() => handleJoinGroup(group.id)}
                    isJoining={isJoining}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── ContactCard ──────────────────────────────────────────── */
function ContactCard({
  contact,
  index,
  onClick,
}: {
  contact: ContactEntry;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-xs hover:shadow-md transition-all text-left"
      onClick={onClick}
      data-ocid={`chats.item.${index}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="campus-header-gradient text-white font-semibold text-sm">
            {getInitials(contact.profile.name)}
          </AvatarFallback>
        </Avatar>
        {contact.profile.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm text-foreground truncate">
            {contact.profile.name}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {contact.profile.isOnline ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge
            className={`text-[10px] px-1.5 py-0 h-4 ${
              ROLE_BADGE_STYLES[contact.profile.role]
            } border rounded-md font-medium`}
          >
            {getRoleLabel(contact.profile.role)}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {contact.profile.department}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── GroupCard ────────────────────────────────────────────── */
function GroupCard({
  group,
  index,
  onOpen,
  onJoin,
  isJoining,
}: {
  group: GroupEntry;
  index: number;
  onOpen: () => void;
  onJoin: () => void;
  isJoining: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-xs"
      data-ocid={`chats.groups.item.${index}`}
    >
      <button
        type="button"
        className="relative flex-shrink-0"
        onClick={onOpen}
        aria-label={`Open ${group.group.name} chat`}
      >
        <div className="w-12 h-12 campus-header-gradient rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
      </button>
      <button
        type="button"
        className="flex-1 min-w-0 text-left"
        onClick={onOpen}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-sm text-foreground truncate">
            {group.group.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-violet-100 text-violet-700 border-violet-200 border rounded-md font-medium">
            {group.group.department}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {group.group.members.length} member
            {group.group.members.length !== 1 ? "s" : ""}
          </span>
        </div>
      </button>
      <Button
        size="sm"
        variant="outline"
        className="flex-shrink-0 text-xs h-8 px-3 border-primary/40 text-primary hover:bg-primary/5"
        onClick={(e) => {
          e.stopPropagation();
          onJoin();
        }}
        disabled={isJoining}
        data-ocid={`chats.groups.join_button.${index}`}
      >
        Join
      </Button>
    </div>
  );
}

/* ── useScrollToBottom ────────────────────────────────────── */
function useScrollToBottom(dep: number) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dep]);
  return scrollRef;
}

/* ── ChatWindow ───────────────────────────────────────────── */
function ChatWindow({
  contact,
  onBack,
}: { contact: ContactEntry; onBack: () => void }) {
  const [message, setMessage] = useState("");
  const { data: messages = [] } = useMessageHistory(contact.principal);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const scrollRef = useScrollToBottom(messages.length);

  const handleSend = () => {
    if (!message.trim() || isPending) return;
    const content = message.trim();
    setMessage("");
    sendMessage(
      { receiver: contact.principal, content },
      {
        onError: () => {
          toast.error("Failed to send message. Please try again.");
          setMessage(content);
        },
      },
    );
  };

  const formatTime = (timestamp: bigint) =>
    new Date(Number(timestamp / 1_000_000n)).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col h-screen">
      <div className="campus-header-gradient px-4 pt-12 pb-4 text-white flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center"
          data-ocid="chat.close_button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-white/30 text-white text-sm font-semibold">
              {getInitials(contact.profile.name)}
            </AvatarFallback>
          </Avatar>
          {contact.profile.isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{contact.profile.name}</p>
          <p className="text-white/70 text-xs">
            {contact.profile.isOnline ? "Online" : "Offline"} ·{" "}
            {contact.profile.department}
          </p>
        </div>
        <Badge
          className={`text-[10px] px-2 py-0 h-5 ${ROLE_BADGE_STYLES[contact.profile.role]} border`}
        >
          {getRoleLabel(contact.profile.role)}
        </Badge>
      </div>

      <div
        className="flex-1 bg-background overflow-y-auto px-4 py-4"
        ref={scrollRef}
      >
        <div className="space-y-3 pb-4">
          {messages.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="chat.empty_state"
            >
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe =
                msg.receiver.toString() === contact.principal.toString();
              const msgKey = `${msg.sender.toString()}-${msg.timestamp.toString()}`;
              return (
                <div
                  key={msgKey}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "campus-header-gradient text-white rounded-br-sm"
                        : "bg-card border border-border text-foreground rounded-bl-sm shadow-xs"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMe ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-card border-t border-border p-3 pb-6 flex items-center gap-2">
        <Input
          className="flex-1 rounded-xl bg-muted border-border"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isPending}
          data-ocid="chat.input"
        />
        <Button
          type="button"
          size="icon"
          className="w-10 h-10 rounded-xl campus-header-gradient border-0 text-white hover:opacity-90 flex-shrink-0"
          onClick={handleSend}
          disabled={!message.trim() || isPending}
          data-ocid="chat.submit_button"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── GroupChatWindow ──────────────────────────────────────── */
function GroupChatWindow({
  group,
  onBack,
}: { group: GroupEntry; onBack: () => void }) {
  const [message, setMessage] = useState("");
  const { data: messages = [] } = useGroupMessages(group.id);
  const { mutate: sendGroupMessage, isPending } = useSendGroupMessage();
  const { data: callerProfile } = useCallerProfile();
  const scrollRef = useScrollToBottom(messages.length);

  const handleSend = () => {
    if (!message.trim() || isPending) return;
    const content = message.trim();
    setMessage("");
    sendGroupMessage(
      { groupId: group.id, content },
      {
        onError: () => {
          toast.error("Failed to send message. Please try again.");
          setMessage(content);
        },
      },
    );
  };

  const formatTime = (timestamp: bigint) =>
    new Date(Number(timestamp / 1_000_000n)).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="campus-header-gradient px-4 pt-12 pb-4 text-white flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center"
          data-ocid="group_chat.close_button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 bg-white/25 rounded-full flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{group.group.name}</p>
          <p className="text-white/70 text-xs">
            {group.group.members.length} member
            {group.group.members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Badge className="text-[10px] px-2 py-0 h-5 bg-white/20 text-white border-white/30 border flex-shrink-0">
          {group.group.department}
        </Badge>
      </div>

      {/* Messages */}
      <div
        className="flex-1 bg-background overflow-y-auto px-4 py-4"
        ref={scrollRef}
      >
        <div className="space-y-3 pb-4">
          {messages.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="group_chat.empty_state"
            >
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderName === callerProfile?.name;
              const msgKey = `${msg.sender.toString()}-${msg.timestamp.toString()}`;
              return (
                <div
                  key={msgKey}
                  className={`flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  {!isMe && (
                    <span className="text-[11px] font-semibold text-muted-foreground mb-0.5 ml-1">
                      {msg.senderName}
                    </span>
                  )}
                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "campus-header-gradient text-white rounded-br-sm"
                        : "bg-card border border-border text-foreground rounded-bl-sm shadow-xs"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMe ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-3 pb-6 flex items-center gap-2">
        <Input
          className="flex-1 rounded-xl bg-muted border-border"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isPending}
          data-ocid="group_chat.input"
        />
        <Button
          type="button"
          size="icon"
          className="w-10 h-10 rounded-xl campus-header-gradient border-0 text-white hover:opacity-90 flex-shrink-0"
          onClick={handleSend}
          disabled={!message.trim() || isPending}
          data-ocid="group_chat.submit_button"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
