import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Announcement,
  ContactEntry,
  GroupEntry,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useContacts() {
  const { actor, isFetching } = useActor();
  return useQuery<ContactEntry[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getContacts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAnnouncements() {
  const { actor, isFetching } = useActor();
  return useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAnnouncements();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMessageHistory(withUser: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["messages", withUser?.toString()],
    queryFn: async () => {
      if (!actor || !withUser) return [];
      return actor.getMessageHistory(withUser);
    },
    enabled: !!actor && !isFetching && !!withUser,
    refetchInterval: 3000,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerUser(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      receiver,
      content,
    }: { receiver: Principal; content: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendMessage(receiver, content);
    },
    onSuccess: (_, { receiver }) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", receiver.toString()],
      });
    },
  });
}

export function useCreateAnnouncement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (announcement: Announcement) => {
      if (!actor) throw new Error("Not connected");
      return actor.createAnnouncement(announcement);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useGroups() {
  const { actor, isFetching } = useActor();
  return useQuery<GroupEntry[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGroups();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGroupMessages(groupId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["groupMessages", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getGroupMessages(groupId);
    },
    enabled: !!actor && !isFetching && !!groupId,
    refetchInterval: 3000,
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      department,
    }: { name: string; department: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createGroup(name, department);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useJoinGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.joinGroup(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useSendGroupMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      content,
    }: { groupId: string; content: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendGroupMessage(groupId, content);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] });
    },
  });
}
