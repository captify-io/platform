/**
 * Test script for the Neptune search API GET endpoint
 * This script tests the authentication flow and Neptune connectivity
 */

const fetch = require("node-fetch");

// Test configuration
const API_URL = "http://localhost:3000/api/search";
const TEST_QUERY = "test application";

// Mock tokens for testing (in production, these would come from authenticated user)
const TEST_ID_TOKEN = "test-cognito-id-token";
const TEST_ACCESS_TOKEN = "test-cognito-access-token";

async function testSearchAPI() {
  console.log("🧪 Testing Neptune Search API GET endpoint...\n");

  try {
    // Test 1: GET request with query parameters and headers
    console.log("📡 Testing GET request with authentication headers...");

    const url = new URL(API_URL);
    url.searchParams.append("query", TEST_QUERY);
    url.searchParams.append("limit", "5");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TEST_ACCESS_TOKEN}`,
        "X-ID-Token": TEST_ID_TOKEN,
        "X-User-Email": "test@example.com",
        "Content-Type": "application/json",
      },
    });

    console.log(
      `📊 Response Status: ${response.status} ${response.statusText}`
    );
    console.log(
      `📋 Response Headers:`,
      Object.fromEntries(response.headers.entries())
    );

    const responseData = await response.json();
    console.log("\n📄 Response Data:");
    console.log(JSON.stringify(responseData, null, 2));

    // Analyze the response
    if (response.ok) {
      console.log("\n✅ API call successful!");

      if (responseData.sections) {
        console.log(`📊 Total sections: ${responseData.sections.length}`);
        console.log(`🔢 Total results: ${responseData.totalResults}`);
        console.log(`⏱️ Execution time: ${responseData.executionTime}s`);

        responseData.sections.forEach((section, index) => {
          console.log(`\n📁 Section ${index + 1}: ${section.sectionTitle}`);
          console.log(`   Provider: ${section.provider}`);
          console.log(`   Count: ${section.totalCount}`);
        });
      }
    } else {
      console.log("\n❌ API call failed!");
      if (responseData.error) {
        console.log(`🚨 Error: ${responseData.error}`);
        if (responseData.details) {
          console.log(`ℹ️ Details: ${responseData.details}`);
        }
      }
    }
  } catch (error) {
    console.error("\n💥 Test failed with error:", error);

    if (error.code === "ECONNREFUSED") {
      console.log(
        "🔌 Make sure the Next.js development server is running on localhost:3000"
      );
    }
  }
}

// Test 2: Test without authentication to verify error handling
async function testWithoutAuth() {
  console.log("\n🧪 Testing GET request without authentication...");

  try {
    const url = new URL(API_URL);
    url.searchParams.append("query", TEST_QUERY);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(
      `📊 Response Status: ${response.status} ${response.statusText}`
    );

    const responseData = await response.json();
    console.log("📄 Response Data:");
    console.log(JSON.stringify(responseData, null, 2));

    if (response.status === 401) {
      console.log("✅ Correct: API properly rejected unauthenticated request");
    } else {
      console.log("⚠️ Unexpected: API should reject unauthenticated requests");
    }
  } catch (error) {
    console.error("💥 Test failed with error:", error);
  }
}

// Run tests
async function runAllTests() {
  console.log("🚀 Starting Neptune Search API Tests\n");
  console.log("=" * 60);

  await testSearchAPI();
  await testWithoutAuth();

  console.log("\n" + "=" * 60);
  console.log("🏁 Tests completed!");
}

runAllTests().catch(console.error);
