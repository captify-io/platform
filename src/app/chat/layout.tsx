import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat - Captify",
  description: "Chat interface for Captify platform",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="chat-layout">{children}</div>;
}
