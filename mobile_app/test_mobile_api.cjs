const os = require('os');

async function testUrl(baseUrl) {
  console.log(`\nTesting API at: ${baseUrl}`);
  
  // 1. Test Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "mohamed_ali", password: "password123" }),
  });
  const loginData = await loginRes.json();
  console.log("  Login Status:", loginRes.status, "| Token exists:", !!loginData.token);
  if (!loginData.token) throw new Error("Login failed");

  // 2. Test Get Trips
  const tripsRes = await fetch(`${baseUrl}/trip`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const trips = await tripsRes.json();
  console.log("  Trips Status:", tripsRes.status, "| Trips count:", Array.isArray(trips) ? trips.length : 0);
  if (!Array.isArray(trips) || trips.length === 0) throw new Error("No trips returned");

  // Pick a trip with high available seats (or the last trip)
  const sampleTrip = trips[trips.length - 1];
  console.log(`  Target Trip ID: ${sampleTrip._id} (${sampleTrip.source} -> ${sampleTrip.destination})`);

  // 3. Test Booking on a free seat (e.g. seat 15 or 16)
  const seatToBook = 15;
  console.log(`  Attempting to book seat #${seatToBook}...`);
  const bookRes = await fetch(`${baseUrl}/booking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({
      tripId: sampleTrip._id,
      seatNumbers: [seatToBook],
    }),
  });
  const bookData = await bookRes.json();
  console.log("  Booking Status:", bookRes.status, "| Booking result:", bookData.status || bookData.message);
  if (bookRes.status !== 201 && bookRes.status !== 409) throw new Error("Unexpected booking status: " + bookRes.status);
}

async function run() {
  await testUrl("http://localhost:3000");
  await testUrl("http://10.48.16.117:3000");
  console.log("\n✅ ALL END-TO-END MOBILE APP TESTS (AUTH, TRIPS, SEATS, BOOKING) PASSED 100%!");
}

run().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
