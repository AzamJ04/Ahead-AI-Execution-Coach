# Security Specification (TDD for Firestore Rules)

## 1. Data Invariants
- **Profile Integrity**: A UserProfile at `/users/{userId}` can only be accessed or modified by the user whose `uid` equals `userId`.
- **Task Ownership**: A Task at `/users/{userId}/tasks/{taskId}` can only be created, read, updated, or deleted by the user whose `uid` matches `userId`.
- **Identity Invariant**: The `userId` field inside any Task document must strictly match `request.auth.uid`.
- **Temporal Invariants**: `createdAt` must be set to `request.time` upon creation and must be immutable. `updatedAt` must be set to `request.time` on both create and update.
- **Size Bounds**: Key text fields (e.g. `firstName`, `title`, `description`, `category`) must not exceed secure string size bounds to prevent Denial of Wallet storage abuse.
- **Type Safety**: Field types (e.g., list of subtasks, progress as a number, etc.) must match their entity shapes.

---

## 2. The "Dirty Dozen" Malicious Payloads

### Payload 1: Profile Theft (Write to another user's profile)
- **Path**: `/users/attacker_uid`
- **User auth**: `request.auth.uid == "victim_uid"`
- **Result**: `PERMISSION_DENIED`

### Payload 2: Ghost Role Promotion (Injecting unapproved role value)
- **Path**: `/users/victim_uid`
- **User auth**: `request.auth.uid == "victim_uid"`
- **Payload**: `{ "firstName": "Alice", "role": "super_admin" }` (role must be enum student/professional/entrepreneur)
- **Result**: `PERMISSION_DENIED`

### Payload 3: Shadow Field Injection in Profile
- **Path**: `/users/victim_uid`
- **User auth**: `request.auth.uid == "victim_uid"`
- **Payload**: `{ "firstName": "Alice", "role": "student", "isVerified": true, "extraField": "malicious" }`
- **Result**: `PERMISSION_DENIED` (strictly size == 3 or exact keys checking)

### Payload 4: Orphaned Task Creation (Create a task for a different user)
- **Path**: `/users/victim_uid/tasks/task_1`
- **User auth**: `request.auth.uid == "attacker_uid"`
- **Result**: `PERMISSION_DENIED`

### Payload 5: Identity Hijacking in Task (Set userId field to victim)
- **Path**: `/users/attacker_uid/tasks/task_1`
- **User auth**: `request.auth.uid == "attacker_uid"`
- **Payload**: `{ "id": "task_1", "title": "My Task", "userId": "victim_uid" }`
- **Result**: `PERMISSION_DENIED`

### Payload 6: Infinite-Time Poisoning (Set custom createdAt timestamp)
- **Path**: `/users/attacker_uid/tasks/task_1`
- **User auth**: `request.auth.uid == "attacker_uid"`
- **Payload**: `{ "id": "task_1", "title": "My Task", "userId": "attacker_uid", "createdAt": "2099-01-01T00:00:00Z" }`
- **Result**: `PERMISSION_DENIED`

### Payload 7: Immortal Field Mutability (Attempt to modify createdAt on update)
- **Path**: `/users/attacker_uid/tasks/task_1`
- **User auth**: `request.auth.uid == "attacker_uid"`
- **Update Payload**: Change `createdAt` from its initial value.
- **Result**: `PERMISSION_DENIED`

### Payload 8: Denial of Wallet Space Attack (10MB title string)
- **Path**: `/users/attacker_uid/tasks/task_1`
- **User auth**: `request.auth.uid == "attacker_uid"`
- **Payload**: `{ "id": "task_1", "title": "A".repeat(100000), "userId": "attacker_uid" }`
- **Result**: `PERMISSION_DENIED`

### Payload 9: Skip State Transition / Un-whitelisted Fields
- **Path**: `/users/attacker_uid/tasks/task_1`
- **User auth**: `request.auth.uid == "attacker_uid"`
- **Update Payload**: Attempt to write a random key `maliciousStateChange` during status change.
- **Result**: `PERMISSION_DENIED`

### Payload 10: Task ID Poisoning (Junk characters/Path Traversal in Doc ID)
- **Path**: `/users/attacker_uid/tasks/../malicious_path`
- **User auth**: `request.auth.uid == "attacker_uid"`
- **Result**: `PERMISSION_DENIED`

### Payload 11: Spoofed Email Admin Bypass
- **Path**: `/users/some_uid`
- **User auth**: `request.auth.token.email == "admin@example.com"`, but `email_verified == false`
- **Result**: `PERMISSION_DENIED`

### Payload 12: Anonymous Write to Secure Collection
- **Path**: `/users/some_uid`
- **User auth**: `request.auth == null` (Unauthenticated write)
- **Result**: `PERMISSION_DENIED`
