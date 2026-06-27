# App Store / Play Store listing copy

Draft copy to paste into App Store Connect and Google Play Console. Edit names/claims as needed —
none of this is final until you review it.

## App name

**MatruPitru** (10 chars — well under both stores' limits: App Store 30, Play Store 30)

## Subtitle (App Store only, max 30 chars)

**Elder care, verified daily**

## Short description (Play Store only, max 80 chars)

**Coordinate your parent's care from anywhere — verified visits, real alerts.**

## Full / long description (both stores)

```
MatruPitru helps adult children — especially those living away from their parents, in another
city or abroad — stay genuinely on top of their parent's day-to-day care.

VERIFIED VISITS, NOT JUST PROMISES
Every caregiver visit is geo-verified against your parent's home address, with photo proof and
your parent's own confirmation. No more wondering whether the visit actually happened.

AUTOMATIC MEDICATION REMINDERS
Set a medication schedule once. Real device alarms fire at the right time — even with the app
closed — and if a dose is missed, you and the care manager are notified automatically. No manual
check-ins required.

ONE-TAP SOS WITH REAL ESCALATION
Your parent can raise an emergency alert with one tap. It reaches the care manager, you, and
backup emergency contacts in sequence if nobody responds — automatically.

REAL-TIME FAMILY DASHBOARD
See upcoming and completed visits, vitals trends, medication adherence, and a single timeline of
everything happening with your parent's care — in one place.

VIDEO CHECK-INS
Start a video call with your parent directly from the app whenever you want to see them, not just
read about them.

MULTI-LANGUAGE, VOICE-FIRST FOR PARENTS
The parent-facing screen supports English, Hindi, Kannada, Tamil, Telugu, Bengali, and Marathi,
with voice read-aloud and voice confirmation — built for parents who aren't comfortable with
typing on a phone.

SHARE ACCESS WITH SIBLINGS
Invite a brother or sister to the same family account so everyone has the same visibility — no
more being the only one who knows what's going on.

Built for Indian families, including those settled abroad coordinating care for parents back home.
```

## Keywords (App Store only, max 100 chars, comma-separated, no spaces after commas)

```
elder care,parent care,senior care,caregiver,NRI,medication reminder,SOS,home care,India,family
```

## Category

- **Primary**: Medical (or Health & Fitness, if Medical requires extra review docs you don't have yet)
- **Secondary**: Lifestyle

## Age rating

Should qualify for the lowest tier on both stores (4+ / Everyone) — no violence, gambling, or
mature content. The Play Store "Data Safety" questionnaire and App Store "App Privacy" section
will ask about the health/location data this app collects — answer those honestly using
`frontend/src/pages/Privacy.jsx` as your reference for what's actually collected and why.

## Screenshots you'll need to capture yourself

Both stores require real screenshots (can't be auto-generated without running the app on a
device/simulator):

- **iOS**: 6.7" display (1290×2796) — at least 3, ideally 5-8 covering: buyer dashboard, parent
  alarm screen, SOS, timeline, video call.
- **Android**: phone screenshots, 16:9 or higher — same set of screens.

Capture these by running the app in `expo go` or, better, a real EAS build, then using
the device/simulator's screenshot function.

## Support URL / Privacy Policy URL (required by both stores)

Once `frontend` is deployed somewhere public (Vercel, Netlify, your own domain), the Privacy
Policy URL is `<your-deployed-frontend-url>/privacy`. Both stores require this to be live and
publicly reachable before they'll approve the listing — `localhost` will not work.
