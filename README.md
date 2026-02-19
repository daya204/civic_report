Project: CivicPulse – Smart Civic Complaint Portal
A modern Next.js web app for citizens to report civic issues (roads, garbage, drainage, etc.) and for municipal authorities to manage, track, and resolve complaints with geolocation and proof-of-work.
Features
Role-based access
Citizen: sign up, sign in, create complaints with images and location, track status, upvote (“Hype”), mark “Facing Same Issue”, and verify resolutions.
Authority: log in as municipal officer, view complaints in your region, update statuses (unsolved → read → on the way → in progress → solved), and upload proof images.
Complaint lifecycle
Statuses: unsolved, read, on_the_way, in_progress, solved, verified.
Citizens can verify a solved complaint:
Yes, Verified → status becomes verified and stays in the Solved tab.
Not Resolved → status goes back to unsolved (returns to the unsolved list).
Dashboards
Citizen dashboard:
Tabs for Posts (unsolved), Search, Solved, and Profile.
Region/category filters and search by title, description, or location.
Authority dashboard:
Stats cards for Unsolved, In Progress, Solved, Total.
Tabs for Unsolved, Work In Progress, Search, Solved, and Profile.
Engagement & social proof
Hype (likes) and Facing Same Issue counters per complaint.
Comment threads with role highlighting (Authority vs Citizen).
Media & evidence
Image upload required for new complaints (citizen).
Optional proofImage for authorities when marking solved.
Maps integration
Google Maps embed per complaint, centered on its latitude/longitude.
Gives authorities and citizens spatial context for each issue.
Tech Stack
Frontend: Next.js (App Router), React, TypeScript
Styling/UI: Tailwind CSS + shadcn/ui components
Auth & state:
Custom JWT-based auth (/api/auth/signin, /api/auth/signup)
React context for auth (auth-context) and complaints (complaints-context)
Backend: Next.js API routes (/app/api/**)
Database: MongoDB with Mongoose models (User, Complaint)
Storage: Cloudinary for image uploads
Maps: Google Maps Embed API
Getting Started
1. Install dependencies
npm install# oryarn install
2. Environment variables
Create .env.local in the project root (already present in this repo) with:
MONGODB_URI=your-mongodb-connection-stringJWT_SECRET=your-jwt-secret# Google MapsGOOGLE_MAPS_API_KEY=your-server-maps-keyNEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-public-maps-key# CloudinaryCLOUDINARY_CLOUD_NAME=your-cloud-nameCLOUDINARY_API_KEY=your-api-keyCLOUDINARY_API_SECRET=your-api-secret# Authority accountsAUTHORITY_USERNAMES=muni_sec5,muni_sec12,admin1AUTHORITY_DEFAULT_PASSWORD=Authority@123
Notes:
Make sure the Maps Embed API (and billing) is enabled for the project that owns NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, and that HTTP referrer restrictions allow http://localhost:3000/* (or your dev URL).
Never commit real secrets; use placeholders or environment injection in production.
3. Run the dev server
npm run dev# oryarn dev
Then open http://localhost:3000 in your browser.
Accounts & Roles
Citizen:
Sign up directly in the app.
All new signups are citizens by default.
Authority:
Usernames listed in AUTHORITY_USERNAMES are treated as authority accounts.
On first sign-in, if a listed authority user doesn’t exist, the backend auto-creates it with:
Username: from AUTHORITY_USERNAMES
Password: AUTHORITY_DEFAULT_PASSWORD (default Authority@123)
Role: authority
These users see the Authority Dashboard and can update complaint statuses.
Data & Seeding
On first load, the /api/complaints endpoint:
Connects to MongoDB and fetches complaints.
If the collection is empty, it imports mock complaints (covering unsolved, in-progress, solved, and verified states).
The frontend caches complaints in context and updates them optimistically as actions are performed.
Key Flows
Creating a complaint (Citizen):
Sign in as a citizen.
Go to “Report Issue”.
Fill in title, description, category, location, and at least one image.
Submit to create an unsolved complaint in your region.
Managing complaints (Authority):
Sign in with an authority account (e.g. muni_sec5 / Authority@123).
Use the Unsolved and Work In Progress tabs to triage.
Update status as work progresses; optionally add a proofImage when solved.
Verifying resolution (Citizen):
When your complaint reaches solved, a card appears with Yes, Verified / Not Resolved.
Click:
Yes, Verified → complaint stays in Solved tab and becomes verified.
Not Resolved → complaint moves back to unsolved and shows again in the Posts list.
Scripts
npm run dev – start the development server
npm run build – build for production
npm start – run the production build
Future Improvements (Ideas)
- Email / SMS notifications for status changes.
- Role for NGOs or RWAs with limited authority features.
- Advanced analytics and heatmaps for complaint clustering.
- Rate limiting and spam protection on complaint creation.
