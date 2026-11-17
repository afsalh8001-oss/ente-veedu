# Ente Veedu — Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **One UID = One Plot**: Each Firebase `uid` may create at most one `/players/{uid}` document (`uid == request.auth.uid`) and cannot reassign `uid`, `username`, `plotX`, `plotY`, or `createdAt` afterward.
2. **Unique Usernames**: Every player claim atomically creates `/usernames/{username}` (`!exists(...)`) so no two residents can share a handle, restricted to `^[a-z0-9_]+$` (3–20 chars).
3. **One Vote / Heart Per User**: Upvotes on suggestions (`/suggestions/{id}/votes/{uid}`) and hearts on houses (`/players/{uid}/hearts/{uid}`) are keyed by `request.auth.uid` and enforced atomically with `existsAfter(...)`.
4. **Rate-Limited Suggestions**: Creating a suggestion requires a player record and enforces a 60-second cooldown via `lastSuggestionAt`.
5. **Terminal State Lock**: Once a suggestion reaches `status == 'built'`, it can never be voted on or reopened.
6. **Zero PII**: `players` stores only public avatar/plot metadata and `heartsCount`, never emails, phones, or addresses.
7. **Strict Server Timestamps & Payload Bounds**: Every `createdAt`, `updatedAt`, and `builtAt` must equal `request.time`; every string has `.size()` bounds; every write passes `keys().hasAll(...) && keys().hasOnly(...)` or `affectedKeys().hasOnly(...)`.

## 2. Dirty Dozen Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Spoofed Plot Owner**: Create `/players/victim_uid` with `uid: "victim_uid"` while signed in as `attacker_uid`.
2. **Shadow Field Injection**: Create `/players/attacker_uid` including `{ isAdmin: true }` alongside valid fields.
3. **Invalid Username Format**: Create `/usernames/Bad-Name!` with uppercase or special characters.
4. **Oversized Door Note**: Create `/doors/d1` with `message` length 61+ characters (max 60).
5. **Fake Timestamp**: Create `/suggestions/s1` with `createdAt: Timestamp(2020-01-01)` instead of `request.time`.
6. **Inflated Initial Votes**: Create `/suggestions/s1` with `votes: 999` instead of `1`.
7. **Double Upvote Without Vote Record**: Update `/suggestions/s1` incrementing `votes` without creating `/suggestions/s1/votes/{uid}`.
8. **Mutating Built Suggestion**: Update `/suggestions/s1` when `existing().status == 'built'`.
9. **Plot Relocation Hijack**: Update `/players/{uid}` changing `plotX` or `plotY`.
10. **Orphaned Door Note**: Create `/doors/d2` targeting a non-existent `targetUid`.
11. **Heart Count Tampering**: Update `/players/{uid}` changing `heartsCount` by +50 instead of +1.
12. **Unauthenticated Read/Write**: Any read or write on `/players`, `/suggestions`, `/buildings`, or `/doors` with `request.auth == null`.
