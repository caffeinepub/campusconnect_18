import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  type Role = {
    #student;
    #faculty;
    #admin;
  };

  type Message = {
    sender : Principal.Principal;
    receiver : Principal.Principal;
    content : Text;
    timestamp : Int;
  };

  type Announcement = {
    title : Text;
    content : Text;
    authorName : Text;
    timestamp : Int;
  };

  type Group = {
    id : Text;
    name : Text;
    department : Text;
    members : Set.Set<Principal.Principal>;
  };

  type GroupMessage = {
    sender : Principal.Principal;
    senderName : Text;
    content : Text;
    timestamp : Int;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    department : Text;
    role : Role;
    isOnline : Bool;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    users : Map.Map<Principal.Principal, UserProfile>;
    messages : Map.Map<Text, [Message]>;
    announcements : Map.Map<Int, Announcement>;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    users : Map.Map<Principal.Principal, UserProfile>;
    messages : Map.Map<Text, [Message]>;
    announcements : Map.Map<Int, Announcement>;
    groups : Map.Map<Text, Group>;
    groupMessages : Map.Map<Text, [GroupMessage]>;
  };

  public func run(old : OldActor) : NewActor {
    { old with groups = Map.empty<Text, Group>(); groupMessages = Map.empty<Text, [GroupMessage]>() };
  };
};
