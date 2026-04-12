// test-currency.js — tests multi-currency pricing detection
// Run: node test-currency.js (requires server running on localhost:3001)

const BASE = "http://localhost:3001";

const TESTS = [
  { country: "GB", expected: { currency: "GBP", symbol: "£", monthly: "9.99", annual: "79" } },
  { country: "US", expected: { currency: "USD", symbol: "$", monthly: "12.99", annual: "99" } },
  { country: "AU", expected: { currency: "AUD", symbol: "A$", monthly: "14.99", annual: "119" } },
  { country: "CA", expected: { currency: "CAD", symbol: "C$", monthly: "14.99", annual: "119" } },
  { country: "DE", expected: { currency: "EUR", symbol: "€", monthly: "11.99", annual: "95" } },
  { country: "FR", expected: { currency: "EUR", symbol: "€", monthly: "11.99", annual: "95" } },
  { country: "AE", expected: { currency: "AED", symbol: "AED ", monthly: "47.00", annual: "369" } },
  { country: "NZ", expected: { currency: "NZD", symbol: "NZ$", monthly: "16.99", annual: "129" } },
  { country: "SG", expected: { currency: "SGD", symbol: "S$", monthly: "16.99", annual: "129" } },
  { country: "JP", expected: { currency: "GBP", symbol: "£", monthly: "9.99", annual: "79" } },  // unknown → GBP
  { country: "",   expected: { currency: "GBP", symbol: "£", monthly: "9.99", annual: "79" } },  // missing → GBP
];

let passed = 0;
let failed = 0;

async function runTests() {
  for (const { country, expected } of TESTS) {
    try {
      const headers = {};
      if (country) headers["CF-IPCountry"] = country;
      const res = await fetch(`${BASE}/api/pricing`, { headers });
      const data = await res.json();

      const errors = [];
      for (const key of Object.keys(expected)) {
        if (data[key] !== expected[key]) {
          errors.push(`${key}: got "${data[key]}", expected "${expected[key]}"`);
        }
      }

      if (errors.length === 0) {
        console.log(`✓ ${country || "(none)"} → ${data.currency} ${data.symbol}${data.monthly}/mo`);
        passed++;
      } else {
        console.log(`✗ ${country || "(none)"} — ${errors.join(", ")}`);
        failed++;
      }
    } catch (err) {
      console.log(`✗ ${country || "(none)"} — fetch error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed out of ${TESTS.length} tests`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
