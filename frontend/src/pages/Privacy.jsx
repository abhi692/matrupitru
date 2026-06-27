import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';

// Public, unauthenticated page required by both the App Store and Play
// Store (Data Safety / App Privacy sections need a working privacy-policy
// URL) — especially load-bearing here since this app handles health and
// precise-location data.
export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-brand-700 font-semibold mb-8">
        <HeartHandshake className="h-5 w-5" /> MatruPitru
      </Link>

      <h1 className="text-2xl font-bold text-stone-900 mb-1">Privacy Policy</h1>
      <p className="text-sm text-stone-400 mb-8">Last updated: June 2026</p>

      <div className="space-y-6 text-sm text-stone-600 leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-stone-800 [&_h2]:mt-8 [&_h2]:mb-2">
        <p>
          MatruPitru ("we", "us") helps adult children coordinate elder care for their parents in
          India. This policy explains what data we collect, why, and how it's protected, in plain
          language. We process personal data under India's Digital Personal Data Protection Act,
          2023 (DPDP Act).
        </p>

        <h2>What we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account info</strong> — name, phone number, password (stored as a one-way hash, never in plain text).</li>
          <li><strong>Parent health profile</strong> — conditions, allergies, medications, mobility level, preferred hospital — entered by the buyer during onboarding, used only to coordinate care.</li>
          <li><strong>Location</strong> — the parent's home address and coordinates (to geo-verify caregiver visits), and a caregiver's device location only during an active check-in/check-out, never tracked continuously or in the background.</li>
          <li><strong>Photos</strong> — proof-of-care photos a caregiver takes during a visit.</li>
          <li><strong>Vitals</strong> — readings (blood pressure, sugar, etc.) logged during visits.</li>
          <li><strong>Messages</strong> — chat between buyers and Care Managers.</li>
          <li><strong>Push notification token</strong> — used only to deliver SOS/alert/medication-reminder notifications to your device.</li>
        </ul>

        <h2>Why we collect it</h2>
        <p>
          Strictly to run the service: matching caregivers to visits, verifying a visit actually
          happened at the parent's home, alerting family and Care Managers to missed medications or
          emergencies, and giving the buyer visibility into their parent's care — the core trust
          loop this app exists for. We do not sell personal data, and we do not use it for
          advertising.
        </p>

        <h2>Who can see it</h2>
        <p>
          Only people directly involved in a family's care circle: the buyer(s) who set up the
          account, the assigned Care Manager, the caregiver dispatched to a visit, and the parent
          themselves. Admin staff can access data for support and verification purposes (e.g.
          reviewing a caregiver's background-check documents).
        </p>

        <h2>Third-party processors</h2>
        <p>
          Payments are processed by Razorpay and Stripe — we never see or store full card/UPI
          details. Video calls are hosted by Daily.co. Push notifications are delivered through
          Expo's push service. None of these providers receive more than what's strictly needed to
          perform their function.
        </p>

        <h2>Data retention &amp; deletion</h2>
        <p>
          We retain data for as long as the account is active. You can request deletion of your
          family's data at any time by contacting us — see below. Some records (e.g. payment
          receipts) may be retained longer where required by law.
        </p>

        <h2>Your rights under the DPDP Act</h2>
        <p>
          You can request access to, correction of, or deletion of your personal data, and you can
          withdraw consent at any time. Withdrawing consent may limit the app's ability to
          coordinate care (e.g. we can't geo-verify a visit without an address).
        </p>

        <h2>Contact</h2>
        <p>
          For privacy requests or questions, contact us at{' '}
          <a href="mailto:REPLACE_WITH_YOUR_SUPPORT_EMAIL" className="text-brand-600 hover:underline">REPLACE_WITH_YOUR_SUPPORT_EMAIL</a>.
        </p>
      </div>
    </div>
  );
}
