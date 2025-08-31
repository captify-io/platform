import { Suspense } from "react";

export default function ChatPage() {
  return (
    <div className="chat-page">
      <h1>Chat Interface</h1>
      <Suspense fallback={<div>Loading chat...</div>}>
        {/* Chat components will be imported here */}
        <div className="chat-container">
          <p>Chat functionality integrated from former packages/chat</p>
        </div>
      </Suspense>
    </div>
  );
}
