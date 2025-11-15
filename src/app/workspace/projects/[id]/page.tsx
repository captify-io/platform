"use client";

import React from "react";
import { useParams } from "next/navigation";
import { FabricProjectEditor } from "../fabric-project-editor";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  return <FabricProjectEditor projectId={projectId} mode="edit" />;
}
