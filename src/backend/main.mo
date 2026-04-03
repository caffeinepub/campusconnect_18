import Map "mo:core/Map";
import Set "mo:core/Set";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  module Message {
    public func compare(message1 : Message, message2 : Message) : Order.Order {
      Int.compare(message1.timestamp, message2.timestamp);
    };
  };

  module Announcement {
    public func compare(announcement1 : Announcement, announcement2 : Announcement) : Order.Order {
      Int.compare(announcement1.timestamp, announcement2.timestamp);
    };
  };

  module GroupMessage {
    public func compare(m1 : GroupMessage, m2 : GroupMessage) : Order.Order {
      Int.compare(m1.timestamp, m2.timestamp);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Role = {
    #student;
    #faculty;
    #admin;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    department : Text;
    role : Role;
    isOnline : Bool;
  };

  type ContactEntry = {
    principal : Principal;
    profile : UserProfile;
  };

  type Message = {
    sender : Principal;
    receiver : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  type GroupMessage = {
    sender : Principal;
    senderName : Text;
    content : Text;
    timestamp : Time.Time;
  };

  // Internal Group type (with mutable members set)
  type Group = {
    id : Text;
    name : Text;
    department : Text;
    members : Set.Set<Principal>;
  };

  // Immutable Group type (with members as [Principal])
  // for sharing public queries
  // (compatible types are always isomorphic in Motoko)
  type GroupSnapshot = {
    id : Text;
    name : Text;
    department : Text;
    members : [Principal];
  };

  type GroupEntry = {
    id : Text;
    group : GroupSnapshot;
  };

  type Announcement = {
    title : Text;
    content : Text;
    authorName : Text;
    timestamp : Time.Time;
  };

  // Persistent State
  let users = Map.empty<Principal, UserProfile>();
  let messages = Map.empty<Text, [Message]>();
  let announcements = Map.empty<Time.Time, Announcement>();
  let groups = Map.empty<Text, Group>();
  let groupMessages = Map.empty<Text, [GroupMessage]>();

  // Canonical chat key: smaller principal text first
  private func chatKey(a : Principal, b : Principal) : Text {
    let ta = a.toText();
    let tb = b.toText();
    if (ta < tb) { ta # "::" # tb } else { tb # "::" # ta };
  };

  private func getGroupMemberNames(members : Set.Set<Principal>) : Text {
    var names = "";
    for (member in members.values()) {
      let memberProfile = users.get(member);
      switch (memberProfile) {
        case (null) {
          names := names # "Unknown User, ";
        };
        case (?profile) {
          names := names # profile.name # ", ";
        };
      };
    };
    if (names.size() > 2) {
      names.trimEnd(#text ", ");
    } else {
      names;
    };
  };

  // Helper function to check group existence and membership
  private func getGroupAndCheckMember(groupId : Text, caller : Principal) : (Group, Bool) {
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found!") };
      case (?group) { (group, group.members.contains(caller)) };
    };
  };

  // Helper to check if user has faculty or admin role
  private func isFacultyOrAdmin(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (#faculty) { true };
          case (#admin) { true };
          case (#student) { false };
        };
      };
    };
  };

  // User Management
  public shared ({ caller }) func registerUser(profile : UserProfile) : async () {
    // Must be authenticated (not anonymous)
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered!");
    };
    if (profile.name == "" or profile.email == "") {
      Runtime.trap("Name and email cannot be empty!");
    };
    users.add(caller, profile);
  };

  public shared ({ caller }) func updateUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    if (profile.name == "" or profile.email == "") {
      Runtime.trap("Name and email cannot be empty!");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found!") };
      case (?_user) {
        users.add(caller, profile);
      };
    };
  };

  public shared ({ caller }) func updateRole(user : Principal, role : Role) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update roles");
    };
    switch (users.get(user)) {
      case (null) { Runtime.trap("User not found!") };
      case (?profile) {
        let updatedProfile = {
          name = profile.name;
          email = profile.email;
          department = profile.department;
          role;
          isOnline = profile.isOnline;
        };
        users.add(user, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func updateDepartment(user : Principal, department : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update departments");
    };
    switch (users.get(user)) {
      case (null) { Runtime.trap("User not found!") };
      case (?profile) {
        let updatedProfile = {
          name = profile.name;
          email = profile.email;
          department;
          role = profile.role;
          isOnline = profile.isOnline;
        };
        users.add(user, updatedProfile);
      };
    };
  };

  // Messaging
  public shared ({ caller }) func sendMessage(receiver : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    if (not (users.containsKey(caller))) {
      Runtime.trap("Sender not registered!");
    };
    if (not (users.containsKey(receiver))) {
      Runtime.trap("Receiver not registered!");
    };
    if (content == "") {
      Runtime.trap("Message content cannot be empty!");
    };
    let message : Message = {
      sender = caller;
      receiver;
      content;
      timestamp = Time.now();
    };
    let key = chatKey(caller, receiver);
    let existing = switch (messages.get(key)) {
      case (null) { [] };
      case (?msgs) { msgs };
    };
    messages.add(key, existing.concat([message]));
  };

  public query ({ caller }) func getMessageHistory(withUser : Principal) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view message history");
    };
    let key = chatKey(caller, withUser);
    switch (messages.get(key)) {
      case (null) { [] };
      case (?msgs) { msgs.sort() };
    };
  };

  // Announcements
  public shared ({ caller }) func createAnnouncement(announcement : Announcement) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create announcements");
    };

    // Check if user is faculty or admin
    if (not (isFacultyOrAdmin(caller))) {
      Runtime.trap("Unauthorized: Only faculty and admins can create announcements");
    };

    if (announcement.title == "" or announcement.content == "") {
      Runtime.trap("Title and content cannot be empty!");
    };
    let timestamp = Time.now();
    let newAnnouncement = {
      announcement with timestamp
    };
    announcements.add(timestamp, newAnnouncement);
  };

  public query ({ caller }) func getAllAnnouncements() : async [Announcement] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view announcements");
    };
    announcements.values().toArray().sort();
  };

  // User & Contact Lists
  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    users.values().toArray();
  };

  public query ({ caller }) func getContacts() : async [ContactEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contacts");
    };
    users
      .filter(func(id, _) { id != caller })
      .entries()
      .map(func(id, profile) { { principal = id; profile } })
      .toArray();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  // Group Management
  public shared ({ caller }) func createGroup(name : Text, department : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create groups");
    };
    if (name == "") {
      Runtime.trap("Group name cannot be empty!");
    };

    let groupId = Time.now().toText();

    let members = Set.singleton(caller);

    let newGroup : Group = {
      id = groupId;
      name;
      department;
      members;
    };
    groups.add(groupId, newGroup);
    groupId;
  };

  public shared ({ caller }) func joinGroup(groupId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join groups");
    };

    if (groupId == "") {
      Runtime.trap("Group ID cannot be empty!");
    };
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found!") };
      case (?group) {
        if (group.members.contains(caller)) {
          Runtime.trap("Already a member of this group!");
        };
        group.members.add(caller);
        groups.add(groupId, { group with members = group.members });
      };
    };
  };

  public query ({ caller }) func getGroups() : async [GroupEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view groups");
    };

    groups
      .toArray()
      .map<(Text, Group), GroupEntry>(
        func((id, group)) {
          {
            id;
            group = {
              id = group.id;
              name = group.name;
              department = group.department;
              members = group.members.toArray();
            };
          };
        }
      );
  };

  public shared ({ caller }) func sendGroupMessage(groupId : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send group messages");
    };

    if (content == "") {
      Runtime.trap("Message content cannot be empty!");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered!") };
      case (?profile) {
        switch (groups.get(groupId)) {
          case (null) { Runtime.trap("Group not found!") };
          case (?group) {
            if (not group.members.contains(caller)) {
              Runtime.trap("You must be a member to send messages to this group");
            };
            let message : GroupMessage = {
              sender = caller;
              senderName = profile.name;
              content;
              timestamp = Time.now();
            };
            let existing = switch (groupMessages.get(groupId)) {
              case (null) { [] };
              case (?msgs) { msgs };
            };
            groupMessages.add(groupId, existing.concat([message]));
          };
        };
      };
    };
  };

  public query ({ caller }) func getGroupMessages(groupId : Text) : async [GroupMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view group messages");
    };

    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found!") };
      case (?group) {
        if (not group.members.contains(caller)) {
          Runtime.trap("You must be a group member to view messages");
        };
        switch (groupMessages.get(groupId)) {
          case (null) { [] };
          case (?msgs) { msgs.sort() };
        };
      };
    };
  };
};
