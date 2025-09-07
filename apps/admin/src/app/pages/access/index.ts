// Access section pages must be imported directly to preserve "use client" directive
export { default as AccessPage } from "./page";
// The following pages must be imported directly from their files to preserve "use client" directive:
// - ./admin (AccessAdminPage)
// - ./users (AccessUsersPage) 
// - ./pools (AccessPoolsPage)