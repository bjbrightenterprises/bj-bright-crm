<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/495d7465-aa9e-44c9-89c0-5b6eb1adf801

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Firebase (login + cloud database)

1. Firebase Console > **Authentication** > Get started > enable **Email/Password**.
2. Firebase Console > **Firestore Database** > Create database.
3. Paste your web config into `src/lib/firebaseConfig.ts` (or `VITE_FIREBASE_*` in `.env.local`).
4. Firestore > **Rules**: paste the contents of `firestore.rules` and **Publish**.
5. Authentication > Users > **Add user** with `praveenverma1420@gmail.com` and a password. The first login of that email creates the Admin profile automatically.
6. Run the app and log in. Add team members from Settings > Users (they get a password-setup email).
7. Optional: Settings > Firebase > "Upload data saved in this browser" to move old local data to the cloud.

If the Firebase config is empty the app keeps working in offline (browser-only) mode.
Updated
