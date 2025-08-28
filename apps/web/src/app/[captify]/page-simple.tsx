interface CaptifyAppPageProps {
  params: Promise<{ captify: string }>;
}

export default async function CaptifyAppPage({ params }: CaptifyAppPageProps) {
  const { captify: slug } = await params;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Captify Application</h1>
        <p className="text-gray-600 mb-4">Application: {slug}</p>
        <p className="text-sm text-gray-500">
          This is a simplified deployment build. Dynamic app loading has been
          temporarily disabled.
        </p>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  // Return empty array for now - no dynamic routes generated
  return [];
}
