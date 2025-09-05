import Link from "next/link";

// Disable static generation for this page to prevent SSR issues
export const dynamic = "force-dynamic";

export default function SignOutPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          You&apos;ve been signed out
        </h1>
        <p className="text-muted-foreground mb-4">
          Thank you for using Captify Platform. You have been successfully
          signed out.
        </p>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 inline-block"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
