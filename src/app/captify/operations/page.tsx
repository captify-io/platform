"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardList, Ticket as TicketIcon, CheckCircle, Clock } from "lucide-react";
import { getEntitiesByTenant } from "@/lib/ontology";
import type { Task, Ticket } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function OperationsPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    setLoading(true);
    const tenantId = (session.user as any).tenantId || "default";

    const [tasksRes, ticketsRes] = await Promise.all([
      getEntitiesByTenant<Task>(ONTOLOGY_TABLES.TASK, tenantId),
      getEntitiesByTenant<Ticket>(ONTOLOGY_TABLES.TICKET, tenantId),
    ]);

    setTasks(tasksRes.data?.items || []);
    setTickets(ticketsRes.data?.items || []);
    setLoading(false);
  }

  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ticketsByStatus = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading operations...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Operations</h1>
        <p className="text-muted-foreground">Daily delivery and governance tracking</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold">{tasksByStatus["in-progress"] || 0}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{tasksByStatus.done || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <TicketIcon className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold">{tickets.length}</div>
              <div className="text-sm text-muted-foreground">Open Tickets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <button
              onClick={() => router.push("/captify/operations/tasks")}
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks yet
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="border rounded p-3 hover:bg-muted cursor-pointer"
                  onClick={() => router.push(`/captify/operations/tasks/${task.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{task.name}</div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      task.status === "done" ? "bg-green-100 text-green-800" :
                      task.status === "in-progress" ? "bg-blue-100 text-blue-800" :
                      task.status === "blocked" ? "bg-red-100 text-red-800" :
                      "bg-muted text-foreground"
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  {task.dueDate && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tickets</h2>
            <button
              onClick={() => router.push("/captify/operations/tickets")}
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tickets yet
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded p-3 hover:bg-muted cursor-pointer"
                  onClick={() => router.push(`/captify/operations/tickets/${ticket.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{ticket.title}</div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      ticket.status === "resolved" ? "bg-green-100 text-green-800" :
                      ticket.status === "in-progress" ? "bg-blue-100 text-blue-800" :
                      ticket.status === "closed" ? "bg-muted text-foreground" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ticket.sourceTeam} → {ticket.targetTeam}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Get Started */}
      {tasks.length === 0 && tickets.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="font-semibold mb-2">No Operations Yet</h3>
          <p className="text-sm text-muted-foreground">
            Tasks and tickets will appear here as your team tracks daily work
          </p>
        </div>
      )}
    </div>
  );
}
