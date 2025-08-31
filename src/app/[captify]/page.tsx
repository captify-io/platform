interface CaptifyAppPageProps {
  params: Promise<{ captify: string }>;
}

export default async function CaptifyAppPage({ params }: CaptifyAppPageProps) {
  const { captify: slug } = await params;

  // The actual package content is rendered by the layout's PackageRenderer
  // This page component can be empty or contain additional content
  return null;
}

export async function generateStaticParams() {
  // Return empty array for now - no dynamic routes generated
  return [];
}
