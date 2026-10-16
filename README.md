# Zerodha clone

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URL` to your MongoDB connection string.
2. In `backend`, run `npm install` once and `npm run dev` to start the API on port 3002.
3. Copy `dashboard/.env.example` to `dashboard/.env` if you need a non-default API URL. The default is `http://localhost:3002`.
4. In `dashboard`, run `npm install` once and `npm start` to start the dashboard on port 3000.

The API health endpoint is `GET /health`. Holdings are available at `GET /allHoldings` (the old `/allHolding` path remains supported), positions at `GET /allPositions`, and orders can be submitted to `POST /newOrder`.

## Deploy

- Deploy `backend` as a Node service using `npm install` as the install command and `npm start` as the start command. Configure `MONGO_URL`, `PORT` if required by the host, and `CLIENT_ORIGIN` as a comma-separated list of the exact deployed frontend origins, including `https://`.
- Deploy `dashboard` as a static React app using `npm install` and `npm run build`. Set `REACT_APP_API_URL` to the deployed backend origin (for example, `https://api.example.com`) before building. The API must allow the dashboard origin through `CLIENT_ORIGIN`.
- Keep `.env` files and database credentials in the hosting provider's secret environment settings. Do not commit them.

The landing site in `frontend` is a separate React app and can be deployed as a static site using `npm install` and `npm run build`.
