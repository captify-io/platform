import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

interface ApplicationData {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description?: string;
  version?: string;
  agentId?: string;
  agentAliasId?: string;
  menu?: Array<{
    id: string;
    label: string;
    icon: string;
    href?: string;
    order?: number;
    parent_id?: string;
  }>;
  capabilities?: string[];
  permissions?: string[];
  category?: string;
  status?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Application slug is required" },
        { status: 400 }
      );
    }

    // Query the captify-applications table for the application with the given slug
    const command = new QueryCommand({
      TableName: "captify-applications",
      IndexName: "SlugIndex", // We'll need to create this GSI
      KeyConditionExpression: "slug = :slug",
      ExpressionAttributeValues: {
        ":slug": { S: slug },
      },
      ProjectionExpression:
        "id, slug, #n, title, description, version, agentId, agentAliasId, menu, capabilities, #permissions, category, #status",
      ExpressionAttributeNames: {
        "#n": "name",
        "#status": "status",
        "#permissions": "permissions",
      },
    });

    const result = await dynamoClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Convert DynamoDB item to plain object
    const applicationData = unmarshall(result.Items[0]) as ApplicationData;

    // Filter out inactive applications
    if (applicationData.status !== "active") {
      return NextResponse.json(
        { error: "Application is not active" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: applicationData,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
