/**
 * Progress Service - Handle agent creation progress tracking
 */

import { AgentService } from "./agent-service";
import { AgentCreationJob } from "@/types/agents";

export interface ProgressTask {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  timestamp?: string;
  error?: string;
}

export const CREATION_TASKS: ProgressTask[] = [
  { id: "config", label: "Agent configuration saved", status: "pending" },
  {
    id: "s3-validation",
    label: "Validating S3 bucket access",
    status: "pending",
  },
  { id: "s3-folder", label: "Creating S3 folder structure", status: "pending" },
  {
    id: "knowledge-base",
    label: "Building knowledge base (8-12 minutes)",
    status: "pending",
  },
  {
    id: "agent-creation",
    label: "Creating your digital twin",
    status: "pending",
  },
  {
    id: "kb-connection",
    label: "Connecting knowledge base to agent",
    status: "pending",
  },
  { id: "deployment", label: "Deploying your digital twin", status: "pending" },
  { id: "ready", label: "Your digital twin is ready!", status: "pending" },
];

export class ProgressService {
  /**
   * Get progress with task breakdown
   */
  static async getJobProgress(jobId: string): Promise<{
    job: AgentCreationJob | null;
    tasks: ProgressTask[];
    estimatedTimeRemaining?: string;
  }> {
    const job = await AgentService.getAgentJob(jobId);

    if (!job) {
      return {
        job: null,
        tasks: CREATION_TASKS,
      };
    }

    const tasks = this.mapJobStatusToTasks(job);
    const estimatedTimeRemaining = this.calculateTimeRemaining(job);

    return {
      job,
      tasks,
      estimatedTimeRemaining,
    };
  }

  /**
   * Map job status to task progress
   */
  private static mapJobStatusToTasks(job: AgentCreationJob): ProgressTask[] {
    const tasks = [...CREATION_TASKS];

    // Update task status based on job progress
    switch (job.status) {
      case "PENDING":
        tasks[0].status = "completed";
        tasks[0].timestamp = job.createdAt;
        break;

      case "CREATING_KB":
        tasks[0].status = "completed";
        tasks[0].timestamp = job.createdAt;
        tasks[1].status = "completed";
        tasks[2].status = "completed";
        tasks[3].status = "in-progress";
        break;

      case "CREATING_AGENT":
        tasks.slice(0, 4).forEach((task, index) => {
          task.status = "completed";
          if (index === 0) task.timestamp = job.createdAt;
        });
        tasks[4].status = "in-progress";
        break;

      case "DEPLOYING":
        tasks.slice(0, 5).forEach((task, index) => {
          task.status = "completed";
          if (index === 0) task.timestamp = job.createdAt;
        });
        tasks[5].status = "completed";
        tasks[6].status = "in-progress";
        break;

      case "COMPLETED":
        tasks.forEach((task, index) => {
          task.status = "completed";
          if (index === 0) task.timestamp = job.createdAt;
          if (index === tasks.length - 1) task.timestamp = job.completedAt;
        });
        break;

      case "FAILED":
        const failedIndex = Math.floor(job.progress / (100 / tasks.length));
        tasks.slice(0, failedIndex).forEach((task) => {
          task.status = "completed";
        });
        if (tasks[failedIndex]) {
          tasks[failedIndex].status = "failed";
          tasks[failedIndex].error = job.error;
        }
        break;
    }

    return tasks;
  }

  /**
   * Calculate estimated time remaining
   */
  private static calculateTimeRemaining(
    job: AgentCreationJob
  ): string | undefined {
    if (job.status === "COMPLETED" || job.status === "FAILED") {
      return undefined;
    }

    const totalEstimatedMinutes = 15; // Total estimated time
    const remainingProgress = 100 - job.progress;
    const remainingMinutes = Math.ceil(
      (remainingProgress / 100) * totalEstimatedMinutes
    );

    if (remainingMinutes <= 1) {
      return "Less than 1 minute";
    } else if (remainingMinutes < 60) {
      return `${remainingMinutes} minutes`;
    } else {
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  }
}
