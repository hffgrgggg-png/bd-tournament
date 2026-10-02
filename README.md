# BD Tournament — real web-app starter

This is a working Node.js + Express tournament-management web app based on the supplied UI screenshots.

## Included
- Mobile-first BD Tournament UI
- Free Fire / Ludo / Carrom tournament lists
- Live / Upcoming filtering
- Register / Login
- Persistent login token
- Join tournament
- My Tournaments
- Server-side data storage in `data.json`
- Admin API endpoints for creating/deleting tournaments (admin role must be assigned server-side)

## Run
1. Install Node.js 18+
2. In this folder run: `npm install`
3. Run: `npm start`
4. Open `http://localhost:3000`

## Deploy to Render
- Create a new Web Service from this project/repository.
- Build command: `npm install`
- Start command: `npm start`
- Add environment variable `JWT_SECRET` with a long random value.

## Important
This starter intentionally uses free-entry tournaments. It does not include real-money deposits, betting, gambling, or cash-prize payment processing. Those features require checking applicable laws, platform policies, age requirements, payment-provider rules, and competition/gambling regulations before implementation.
