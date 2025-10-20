"use client";

import { useParams, useRouter } from "next/navigation";
import { AgentWorkflowEditor } from "@captify-io/core/components/workflow";
import { useState, useEffect } from "react";
import type { WorkflowNode, WorkflowEdge } from "@captify-io/core/types";
import { apiClient } from "@captify-io/core/lib/api";

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [agentId, setAgentId] = useState("");
  const [workflowName, setWorkflowName] = useState("");

  // Load workflow from database
  useEffect(() => {
    async function loadWorkflow() {
      try {
        console.log("Loading workflow:", workflowId);
        const result = await apiClient.run({
          service: "platform.dynamodb",
          operation: "get",
          table: "core-AgentWorkflow",
          data: {
            Key: { id: workflowId },
          },
        });

        console.log("Load result:", result);

        if (result.success && result.data) {
          console.log("Loaded nodes:", result.data.nodes);
          console.log("Loaded edges:", result.data.edges);

          // Reconstruct note nodes with their callbacks
          const loadedNodes = (result.data.nodes || []).map((node: any) => {
            if (node.type === 'note') {
              return {
                ...node,
                data: {
                  ...node.data,
                  onTextChange: (text: string) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === node.id
                          ? { ...n, data: { ...n.data, text } }
                          : n
                      )
                    );
                  },
                },
              };
            }
            return node;
          });

          setNodes(loadedNodes);
          setEdges(result.data.edges || []);
          setAgentId(result.data.agentId || "");
          setWorkflowName(result.data.name || "Untitled Workflow");
        } else {
          console.log("No workflow data found");
        }
      } catch (error) {
        console.error("Failed to load workflow:", error);
      }
    }

    loadWorkflow();
  }, [workflowId]);

  // Save workflow to database
  const handleSave = async (
    updatedNodes: WorkflowNode[],
    updatedEdges: WorkflowEdge[]
  ) => {
    try {
      const now = new Date().toISOString();
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-AgentWorkflow",
        data: {
          Item: {
            id: workflowId,
            agentId: agentId || "default",
            name: workflowName || "Untitled Workflow",
            nodes: updatedNodes,
            edges: updatedEdges,
            version: 1,
            status: "draft",
            createdAt: now,
            updatedAt: now,
          },
        },
      });
      console.log("Workflow saved successfully");
    } catch (error) {
      console.error("Failed to save workflow:", error);
      throw error;
    }
  };

  // Execute workflow
  const handleExecute = async () => {
    console.log("Execute workflow:", workflowId);
    // TODO: Implement workflow execution
  };

  // Update workflow name
  const handleWorkflowNameChange = async (newName: string) => {
    try {
      setWorkflowName(newName);
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "update",
        table: "core-AgentWorkflow",
        data: {
          Key: { id: workflowId },
          UpdateExpression: "SET #name = :name, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#name": "name",
          },
          ExpressionAttributeValues: {
            ":name": newName,
            ":updatedAt": new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Failed to update workflow name:", error);
    }
  };

  // Navigate back to workflows list
  const handleBack = () => {
    router.push("/core/agent/workflows");
  };

  return (
    <div className="h-screen">
      <AgentWorkflowEditor
        workflowId={workflowId}
        agentId={agentId}
        workflowName={workflowName}
        onWorkflowNameChange={handleWorkflowNameChange}
        initialNodes={nodes}
        initialEdges={edges}
        onSave={handleSave}
        onExecute={handleExecute}
        onBack={handleBack}
      />
    </div>
  );
}
