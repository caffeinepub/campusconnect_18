import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface GroupEntry {
    id: string;
    group: GroupSnapshot;
}
export type Time = bigint;
export interface GroupMessage {
    content: string;
    sender: Principal;
    timestamp: Time;
    senderName: string;
}
export interface Message {
    content: string;
    sender: Principal;
    timestamp: Time;
    receiver: Principal;
}
export interface Announcement {
    title: string;
    content: string;
    authorName: string;
    timestamp: Time;
}
export interface ContactEntry {
    principal: Principal;
    profile: UserProfile;
}
export interface GroupSnapshot {
    id: string;
    members: Array<Principal>;
    name: string;
    department: string;
}
export interface UserProfile {
    name: string;
    role: Role;
    isOnline: boolean;
    email: string;
    department: string;
}
export enum Role {
    admin = "admin",
    faculty = "faculty",
    student = "student"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAnnouncement(announcement: Announcement): Promise<void>;
    createGroup(name: string, department: string): Promise<string>;
    getAllAnnouncements(): Promise<Array<Announcement>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContacts(): Promise<Array<ContactEntry>>;
    getGroupMessages(groupId: string): Promise<Array<GroupMessage>>;
    getGroups(): Promise<Array<GroupEntry>>;
    getMessageHistory(withUser: Principal): Promise<Array<Message>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinGroup(groupId: string): Promise<void>;
    registerUser(profile: UserProfile): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendGroupMessage(groupId: string, content: string): Promise<void>;
    sendMessage(receiver: Principal, content: string): Promise<void>;
    updateDepartment(user: Principal, department: string): Promise<void>;
    updateRole(user: Principal, role: Role): Promise<void>;
    updateUserProfile(profile: UserProfile): Promise<void>;
}
