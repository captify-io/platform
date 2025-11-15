"use client";

import React from "react";
import { Agent } from "@captify-io/core";

export default function AgentPage() {
  return (
    <div className="h-full w-full">
      <Agent mode="full" />
    </div>
  );
}

export const dynamic = "force-dynamic";
