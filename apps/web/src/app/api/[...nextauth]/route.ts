import { NextRequest } from "next/server";
import { manifests } from "./manifests/api.manifest";

export async function GET(request: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  const resolvedParams = await params;
  return handleRequest(request, "GET", resolvedParams.nextauth);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  const resolvedParams = await params;
  return handleRequest(request, "POST", resolvedParams.nextauth);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  const resolvedParams = await params;
  return handleRequest(request, "PUT", resolvedParams.nextauth);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  const resolvedParams = await params;
  return handleRequest(request, "DELETE", resolvedParams.nextauth);
}

async function handleRequest(request: NextRequest, method: string, segments: string[]) {
  try {
    const path = `/api/${segments.join("/")}`;
    console.log(`🔄 Handling ${method} ${path}`);

    // Route to appropriate manifest based on first segment
    const firstSegment = segments[0];
    
    if (firstSegment === "auth") {
      // Handle authentication routes
      return await routeToManifest(request, method, path, "auth");
    } else if (firstSegment && manifests[firstSegment as keyof typeof manifests]) {
      // Handle application-specific routes
      return await routeToManifest(request, method, path, firstSegment);
    } else {
      // Handle core API routes (default to api manifest)
      return await routeToManifest(request, method, path, "api");
    }
  } catch (error) {
    console.error("❌ API Route Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function routeToManifest(request: NextRequest, method: string, path: string, manifestKey: string) {
  const manifest = manifests[manifestKey as keyof typeof manifests];
  
  if (!manifest) {
    return new Response(JSON.stringify({ error: `Manifest not found: ${manifestKey}` }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Find matching route in manifest
  const route = manifest.routes.find(r => {
    const routePath = r.path.replace(/\[\.\.\.[\w]+\]/g, "(.*)"); // Convert [...nextauth] to regex
    const regex = new RegExp(`^${routePath}$`);
    return regex.test(path) && r.method === method;
  });

  if (!route) {
    return new Response(JSON.stringify({ error: `Route not found: ${method} ${path}` }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Check security requirements
  if (route.secure) {
    // TODO: Add session validation here
    console.log("🔒 Secure route - validating session...");
  }

  // Execute the route handler
  return await route.handler(request);
}
