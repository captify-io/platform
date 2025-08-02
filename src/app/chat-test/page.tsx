"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Chat Interface Test</h1>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work area - left 2/3 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 h-96">
              <h2 className="text-xl font-semibold mb-4">Work Area</h2>
              <p className="text-gray-600">
                This is where charts, text, and other content will be displayed
                based on AI assistant interactions.
              </p>
            </div>
          </div>

          {/* Chat area - right 1/3 */}
          <div className="lg:col-span-1">
            <div className="relative">
              <ChatInterface
                onWorkspaceUpdate={(data) => {
                  console.log("Workspace update:", data);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
