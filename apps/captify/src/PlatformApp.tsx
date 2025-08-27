import { AppLayout } from "@captify/client";
import { Dashboard } from "./components/Dashboard";

interface PlatformAppProps {
  application?: any;
}

export default function PlatformApp({ application }: PlatformAppProps) {
  return (
    <AppLayout applicationId="captify" showMenu={true} showChat={true}>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6">
          <Dashboard />
        </main>
      </div>
    </AppLayout>
  );
}
