"use client";

import { QuickSightExperience } from "@captify-io/core/components";

export default function InsightsPage() {
  return (
    <div className="h-full w-full">
      <QuickSightExperience
        experience="console"
        awsAccountId="211125459951"
        dashboardId="53ffa701-af6b-4b73-841b-ea86f0c0e8e4"
        sessionLifetimeInMinutes={600}
        allowedDomains={["https://captify.io", "http://localhost:3000"]}
        userArn="arn:aws:quicksight:us-east-1:211125459951:user/default/211125459951"
        statePersistence={true}
        sharedView={true}
        bookmarks={true}
        enableQnA={true}
        onLoad={() => console.log("QuickSight console loaded with Q enabled")}
        onError={(error) => console.error("QuickSight error:", error)}
      />
    </div>
  );
}
