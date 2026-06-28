// TableFire License Verification
// © 2026 TableFire. All rights reserved.
// This software is licensed, not sold. Unauthorized copying or distribution
// is strictly prohibited and may result in legal action.

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8787';
const LICENSE_KEY = import.meta.env.VITE_LICENSE_KEY || '';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export async function verifyLicense() {
  // Skip check in development
  if (!LICENSE_KEY || LICENSE_KEY === '') {
    return { valid: true, name: 'Development Mode', plan: 'dev', daysLeft: 999 };
  }

  // Check localStorage cache first (valid for 24h)
  try {
    const cached = JSON.parse(localStorage.getItem('tf_license') || '{}');
    if (cached.valid && cached.checkedAt && Date.now() - cached.checkedAt < CHECK_INTERVAL) {
      return cached;
    }
  } catch {}

  // Phone home to verify
  try {
    const res = await fetch(`${API}/license/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey: LICENSE_KEY,
        domain: window.location.hostname,
      }),
    });
    const data = await res.json();
    const result = { ...data, checkedAt: Date.now() };

    // Cache result
    try { localStorage.setItem('tf_license', JSON.stringify(result)); } catch {}

    return result;
  } catch (e) {
    // Network error — use cached result if available (grace period)
    try {
      const cached = JSON.parse(localStorage.getItem('tf_license') || '{}');
      if (cached.valid && cached.checkedAt && Date.now() - cached.checkedAt < 7 * CHECK_INTERVAL) {
        return { ...cached, offlineGrace: true };
      }
    } catch {}
    // No cache and no network — still allow for 7 days grace
    return { valid: true, offlineGrace: true, daysLeft: 7 };
  }
}

export function LicenseGate({ children, license }) {
  if (!license) return null;
  if (license.valid) return children;
  return null; // Blocked — caller shows the error screen
}
