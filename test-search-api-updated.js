// Test script for Neptune search API
const testSearchAPI = async () => {
  console.log("Testing Neptune Search API...");

  try {
    // Test 1: Simple GET request without authentication (should use simple connection)
    console.log("\n--- Test 1: GET request without auth ---");
    const response1 = await fetch(
      "http://localhost:3000/api/search?query=test",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result1 = await response1.json();
    console.log("Response:", result1);

    // Test 2: POST request without authentication
    console.log("\n--- Test 2: POST request without auth ---");
    const response2 = await fetch("http://localhost:3000/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "application" }),
    });

    const result2 = await response2.json();
    console.log("Response:", result2);

    // Test 3: With mock authentication headers (will try authenticated path but fallback)
    console.log("\n--- Test 3: With mock auth headers ---");
    const response3 = await fetch(
      "http://localhost:3000/api/search?query=database",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-ID-Token": "mock-id-token-for-testing",
          Authorization: "Bearer mock-access-token",
        },
      }
    );

    const result3 = await response3.json();
    console.log("Response:", result3);
  } catch (error) {
    console.error("Test failed:", error);
  }
};

// To run this test:
// 1. Make sure dev server is running (npm run dev)
// 2. Open browser console
// 3. Copy/paste this script and run testSearchAPI()
console.log("Test script loaded. Run testSearchAPI() to start tests.");
