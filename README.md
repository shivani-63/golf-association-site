# Golf Association Website

This site now runs with:

- a static frontend (`index.html`, `style.css`, `app.js`)
- a local Node/Express backend API (`backend/server.js`)
- file-based data store (`backend/data/site-data.json`)
- password-protected admin save flow (`admin.html`)

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your env file:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set:
   - `ADMIN_PASSWORD` to a strong password
   - `JWT_SECRET` to a long random value

4. Start the server:

   ```bash
   npm run dev
   ```

5. Open:
   - Public site: [http://localhost:3001/index.html](http://localhost:3001/index.html)
   - Admin page: [http://localhost:3001/admin.html](http://localhost:3001/admin.html)

## How updates work

- Admin signs in with the password from `.env`.
- Save writes full site data to `backend/data/site-data.json`.
- Homepage reads data from `GET /api/data`.

## Deploying as a live website

Use any Node host (Render, Railway, Fly.io, VPS):

1. Push repo to GitHub.
2. Set env vars (`ADMIN_PASSWORD`, `JWT_SECRET`, `PORT` optional).
3. Deploy with start command:

   ```bash
   npm start
   ```

4. Point your domain DNS to the deployed host.
