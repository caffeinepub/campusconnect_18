# CampusConnect

## Current State
The ChatsTab shows a single flat list of all contacts (students, faculty, admins mixed together) with role badges. There are no groups. The chat window works with real backend message history and send.

## Requested Changes (Diff)

### Add
- Three tabs inside ChatsTab: **Students**, **Faculty**, **Groups**
- Groups tab with predefined/hardcoded groups (e.g. by department) that open a shared group chat window
- Backend: `getGroups()` returning group list and `sendGroupMessage` / `getGroupMessages` for group chats
- `Group` type in backend with id, name, members list

### Modify
- ChatsTab: replace flat contact list with tab bar (Students | Faculty | Groups)
  - Students tab: shows only contacts with role = student
  - Faculty tab: shows only contacts with role = faculty
  - Groups tab: shows group cards
- ChatWindow: same component reused for 1-on-1, group chat window is a new GroupChatWindow component

### Remove
- Mixed role contact list (replaced by tabbed separation)

## Implementation Plan
1. Backend: Add Group type, group storage, createGroup, getGroups, sendGroupMessage, getGroupMessages
2. Regenerate backend.d.ts bindings
3. Frontend ChatsTab: add tab state (students | faculty | groups), filter contacts by role for each tab
4. Frontend: Add GroupsTab section inside ChatsTab showing group cards
5. Frontend: Add GroupChatWindow component for group messaging
6. Wire up group message hooks (useGroups, useSendGroupMessage, useGroupMessages)
