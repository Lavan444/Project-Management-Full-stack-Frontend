# Project Details and Flow

This document explains the core architecture, data flow, access restrictions, and potential enhancements for the Proflow Project Management Application.

## 1. Project Architecture & State Flow

The application is built using React and relies on a global state management pattern utilizing React Context (`AppContext.tsx`).

### Data Persistence
- **Local Storage**: Currently, the application intercepts state changes and persists them to the browser's `localStorage` (e.g., `proflow_projects`, `proflow_users`). Upon reloading, it retrieves this data to maintain session persistence. Default mock data is loaded if local storage is empty.
- **Context API Layer**: All data mutations (`addProject`, `updateTask`, `deleteUser`, etc.) go through the `AppContext`. When a mutation occurs, the state is updated, which triggers a re-render of the relevant components, and an `useEffect` syncs the new state to `localStorage`.

### Project Movement (Lifecycle)
1. **Creation**: A `Super Admin` or `Admin` creates a project, assigning a name, dates, status, and team members (`userIds`).
2. **Task Allocation**: Within the project, tasks are created and assigned to specific team members. Each task starts in the `todo` column.
3. **Execution (Kanban)**: As employees work on tasks, they drag them across the Kanban board (`To Do` -> `In Progress` -> `Review` -> `Done`).
4. **Progress Calculation**: The project's overall `progress` score is automatically recalculated dynamically in `AppContext` whenever a task status changes. It takes the number of `done` tasks divided by the total number of tasks.
5. **Activity Tracking**: Every major action (updating a task, making a comment, uploading a file, chatting) generates an `Activity` record in the timeline, which acts as an audit trail for the project.

---

## 2. Access Restrictions (Security & Filtering)

The system uses Role-Based Access Control (RBAC) to handle visibility and permissions. This is primarily handled via the `useMemo` hooks in `AppContext.tsx` which filter the global arrays before returning them to components.

### Roles
- **Super Admin**: Has unrestricted access to all projects, tasks, and users across the entire system.
- **Admin**: Has visibility restricted to their specific `organizationId`. They can manage (create/edit/delete) projects and tasks within their organization.
- **Employee**: Has the most restricted view. 

### Filtering Logic
- **Project Visibility**: 
  - An Admin sees `projects.filter(p => p.organizationId === user.organizationId)`.
  - An Employee sees only projects where they are explicitly added as a member: `projects.filter(p => p.members.includes(user.id))`.
- **Task Visibility**: 
  - Employees only see tasks assigned directly to them `t.assigneeId === user.id || t.assigneeIds.includes(user.id)`.
- **Component-Level Restrictions**: 
  - In pages like `Projects.tsx` and `ProjectDetails.tsx`, boolean flags like `canManageProject` are computed. If `false`, UI elements like the "Add Task", "Edit Project", and "Delete" buttons are hidden from the user.
  - In the **Chat** tab, message inputs are disabled using `disabled={!isProjectMember}` to prevent non-members from participating in discussions, even if they somehow navigate to the URL.

---

## 3. Suggestions for Enhancements

While the foundational flow is robust, the following enhancements would prepare the application for a production environment:

### A. Backend & Database Migration
- **Current Limitation**: `localStorage` is completely local to the user's browser, meaning users on different computers cannot collaborate or see each other's changes.
- **Enhancement**: Migrate the state to a real backend (e.g., Node.js/Express, Next.js API Routes, Firebase, or Supabase). Replace context state updates with API calls (using React Query or RTK Query) leading to a database like PostgreSQL or MongoDB.

### B. Real-Time Capabilities
- **Current Limitation**: Users must refresh the page or wait for a polling cycle to see new chat messages or task movements by other users.
- **Enhancement**: Implement WebSockets (`Socket.IO` or Supabase Realtime). This is especially critical for the newly added **Project Chat** and the Kanban board so that dragging a task instantly moves it on a coworker's screen.

### C. Advanced RBAC & Permissions
- **Current Limitation**: Roles are hardcoded into specific global arrays in the context.
- **Enhancement**: Implement granular capability checks. For example, introduce a `Manager` role that can manage tasks but cannot delete the project itself. Use a library like `CASL` to neatly define rules (e.g., `can('update', 'Task', { assigneeId: user.id })`).

### D. Automated Project Health & Deadlines
- **Current Limitation**: Project Health (`Healthy`, `At Risk`, `Critical`) is determined manually from a dropdown.
- **Enhancement**: Implement a background job or computed property that automatically shifts a project to `At Risk` if the current date is past 80% of the project timeline and less than 50% of tasks are completed. Add visual overdue indicators (red text) for tasks past their `dueDate`.

### E. Rich Text & Mentions
- **Current Limitation**: Descriptions, comments, and chats use standard HTML `<textarea>`, which only supports plain text.
- **Enhancement**: Integrate a rich-text editor (like `TipTap`, `Quill`, or `Slate.js`). This would allow users to bold text, add lists, and use `@mentions` (e.g., `@John`) in the chat and task comments. Mentions could then trigger specific `Notifications`.

### F. File Storage
- **Current Limitation**: Files upload structures are mocked, stringifying base64 data or just tracking fake URLs.
- **Enhancement**: Integrate AWS S3, Cloudinary, or Firebase Storage to handle actual multipart file uploads, ensuring files are hosted securely and performantly.
