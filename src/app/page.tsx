"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to console dashboard as the default landing page
    router.replace("/console");
  }, [router]);

  // No loading UI - just redirect silently
  return null;
}
