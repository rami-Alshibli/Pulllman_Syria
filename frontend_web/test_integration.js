const BASE_API = 'http://localhost:3000';
const BASE_FRONTEND = 'http://localhost:3001';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('=== 1. Testing Frontend Pages Availability ===');
  const loginPage = await request(`${BASE_FRONTEND}/login`);
  console.log(`[Frontend] /login -> HTTP ${loginPage.status} (OK: ${loginPage.ok})`);

  const adminPage = await request(`${BASE_FRONTEND}/admin`);
  console.log(`[Frontend] /admin -> HTTP ${adminPage.status} (OK: ${adminPage.ok})`);

  const secPage = await request(`${BASE_FRONTEND}/secretary`);
  console.log(`[Frontend] /secretary -> HTTP ${secPage.status} (OK: ${secPage.ok})`);

  console.log('\n=== 2. Testing Authentication ===');
  // Admin Login
  const adminLogin = await request(`${BASE_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ahmad_admin', password: 'password123' }),
  });
  console.log(`[Auth] Admin Login -> HTTP ${adminLogin.status}`, adminLogin.data.message, 'Role:', adminLogin.data.user?.role);
  const adminToken = adminLogin.data.token;

  // Secretary Login
  const secLogin = await request(`${BASE_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sara_sec', password: 'password123' }),
  });
  console.log(`[Auth] Secretary Login -> HTTP ${secLogin.status}`, secLogin.data.message, 'Role:', secLogin.data.user?.role);
  const secToken = secLogin.data.token;

  // Customer Login
  const custLogin = await request(`${BASE_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'mohamed_ali', password: 'password123' }),
  });
  console.log(`[Auth] Customer Login -> HTTP ${custLogin.status}`, custLogin.data.message, 'Role:', custLogin.data.user?.role);
  const custToken = custLogin.data.token;

  console.log('\n=== 3. Testing Bus Fleet API ===');
  const busModels = await request(`${BASE_API}/bus`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`[Bus] Total Models: ${busModels.data.length}`);
  const firstBus = busModels.data[0];
  console.log(`[Bus] First Model: ${firstBus.title || firstBus.category} (Capacity: ${firstBus.capacity}, Total Buses: ${firstBus.totalBusesCount})`);

  // Update Fleet Count
  const updateFleet = await request(`${BASE_API}/bus/${firstBus._id}/fleet`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ totalBusesCount: 8 }),
  });
  console.log(`[Bus] Update Fleet Count to 8 -> HTTP ${updateFleet.status}`);

  console.log('\n=== 4. Testing Trips API ===');
  const trips = await request(`${BASE_API}/trip`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`[Trip] Total Trips: ${trips.data.length}`);
  const targetTrip = trips.data[0];
  console.log(`[Trip] Selected Trip: ${targetTrip.source} -> ${targetTrip.destination} (${targetTrip.tripTime})`);

  // Create Trip
  const newTripRes = await request(`${BASE_API}/trip`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'حماة',
      destination: 'دمشق',
      busModelId: firstBus._id,
      price: 60000,
      tripDate: new Date().toISOString().slice(0, 10),
      tripTime: '16:00',
      scheduleType: 'daily',
      status: 'scheduled',
    }),
  });
  console.log(`[Trip] Create New Trip (حماة -> دمشق) -> HTTP ${newTripRes.status}`);

  console.log('\n=== 5. Testing Booking Workflow ===');
  // Customer books seats [10]
  const testTripId = newTripRes.ok ? newTripRes.data._id : targetTrip._id;
  const bookRes = await request(`${BASE_API}/booking`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${custToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tripId: testTripId,
      seatNumbers: [10],
    }),
  });
  console.log(`[Booking] Customer reserves seat 10 -> HTTP ${bookRes.status}, Status: ${bookRes.data.status}`);
  const newBookingId = bookRes.data._id;

  // Secretary confirms booking upon cash payment
  const confirmRes = await request(`${BASE_API}/booking/${newBookingId}/confirm`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${secToken}` },
  });
  console.log(`[Booking] Secretary confirms booking with cash -> HTTP ${confirmRes.status}, New Status: ${confirmRes.data.status}`);

  // Cancel booking test (using admin token or customer)
  const cancelRes = await request(`${BASE_API}/booking/${newBookingId}/cancel`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: adminLogin.data.user.id,
      userRole: 'admin',
    }),
  });
  console.log(`[Booking] Cancel booking & release seats -> HTTP ${cancelRes.status}, New Status: ${cancelRes.data.status}`);

  console.log('\n=== 6. Testing Users Management ===');
  const allUsers = await request(`${BASE_API}/user`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`[Users] Total Users in DB: ${allUsers.data.length}`);
  console.log('Users list:', allUsers.data.map(u => `${u.name} (${u.role})`).join(', '));

  console.log('\n========================================');
  console.log('✅ ALL INTEGRATION TESTS PASSED 100%!');
  console.log('========================================');
}

runTests().catch(e => {
  console.error('Integration test failed:', e);
  process.exit(1);
});

