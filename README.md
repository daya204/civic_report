CivicPulse – Smart Civic Complaint Portal

A modern Next.js web app for citizens to report civic issues (roads, garbage, drainage, etc.) and for municipal authorities to manage, track, and resolve complaints with geolocation and proof-of-work.

🚀 Features
🔐 Role-Based Access

Citizen

Sign up / Sign in

Create complaints with images and location

Track complaint status

Upvote (“Hype”)

Mark “Facing Same Issue”

Verify resolutions

Authority

Log in as municipal officer

View complaints in assigned region

Update statuses:

unsolved

read

on_the_way

in_progress

solved

verified

Upload proof images when marking as solved

🔄 Complaint Lifecycle
Status Flow
unsolved → read → on_the_way → in_progress → solved → verified

Resolution Verification (Citizen)

When a complaint is marked solved, citizens can:

Yes, Verified
→ Status becomes verified
→ Remains in the Solved tab

Not Resolved
→ Status returns to unsolved
→ Reappears in the Posts tab

📊 Dashboards
👤 Citizen Dashboard

Tabs:

Posts (Unsolved)

Search

Solved

Profile

Features:

Region & category filters

Search by title, description, or location

🏛 Authority Dashboard

Stats Cards:

Unsolved

In Progress

Solved

Total

Tabs:

Unsolved

Work In Progress

Search

Solved

Profile

❤️ Engagement & Social Proof

Hype (likes)

Facing Same Issue counter

Comment threads

Role highlighting (Authority vs Citizen)

🖼 Media & Evidence

Image upload required for citizens when creating complaints

Optional proofImage for authorities when marking solved

🗺 Maps Integration

Google Maps Embed per complaint

Centered on complaint latitude/longitude

Provides spatial context for issue tracking

🛠 Tech Stack

Frontend

Next.js (App Router)

React

TypeScript

Styling / UI

Tailwind CSS

shadcn/ui

Auth & State

Custom JWT Auth

/api/auth/signin

/api/auth/signup

React Context

auth-context

complaints-context

Backend

Next.js API Routes (/app/api/**)

Database

MongoDB

Mongoose Models (User, Complaint)

Storage

Cloudinary (Image uploads)

Maps

Google Maps Embed API

⚙️ Getting Started
1️⃣ Install Dependencies
npm install
# or
yarn install

2️⃣ Environment Variables

Create a .env.local file in the project root:

MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret

# Google Maps
GOOGLE_MAPS_API_KEY=your-server-maps-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-public-maps-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Authority accounts
AUTHORITY_USERNAMES=muni_sec5,muni_sec12,admin1
AUTHORITY_DEFAULT_PASSWORD=Authority@123

⚠ Notes

Enable Maps Embed API and billing.

Allow HTTP referrers:

http://localhost:3000/*


Never commit real secrets.

3️⃣ Run Development Server
npm run dev
# or
yarn dev


Open:

http://localhost:3000

👥 Accounts & Roles
Citizen

Sign up directly in the app

Default role for new users

Authority

Usernames in AUTHORITY_USERNAMES are treated as authority accounts.

On first sign-in (if user doesn't exist):

Username: From AUTHORITY_USERNAMES

Password: AUTHORITY_DEFAULT_PASSWORD (default: Authority@123)

Role: authority

These users access the Authority Dashboard.

📦 Data & Seeding

On first load:

/api/complaints

Connects to MongoDB

If empty → Imports mock complaints

unsolved

in-progress

solved

verified

Frontend:

Caches complaints in context

Performs optimistic updates

🔑 Key Flows
Creating a Complaint (Citizen)

Sign in

Go to Report Issue

Fill:

Title

Description

Category

Location

At least one image

Submit → Creates unsolved complaint

Managing Complaints (Authority)

Sign in (e.g. muni_sec5 / Authority@123)

Use:

Unsolved tab

Work In Progress tab

Update status

Optionally upload proof image when solved

Verifying Resolution (Citizen)

When status becomes solved:

Yes, Verified
→ Moves to verified
→ Stays in Solved tab

Not Resolved
→ Returns to unsolved
→ Appears in Posts list

📜 Available Scripts
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production build

🔮 Future Improvements

Email / SMS notifications

NGO / RWA limited authority roles

Advanced analytics & heatmaps

Rate limiting & spam protection
