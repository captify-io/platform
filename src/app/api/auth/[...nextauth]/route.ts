import { handlers } from "../../../../lib/auth";

console.log("[NEXTAUTH] Route handler loaded");

export const { GET, POST } = handlers;
