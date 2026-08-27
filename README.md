# IPO Friends Backend

Node.js/Express backend for IPO Friends.

## Endpoints

- `GET /health`
- `GET /api/ipos?status=open`
- `GET /api/ipos?status=upcoming`
- `GET /api/ipos?status=closed`
- `GET /api/ipos?status=listed`
- `GET /api/ipos/{ipoId}`
- `GET /api/ipo-orders`

All IPO list requests use `issue_type=regular`, so they return Mainboard IPOs only.

## Local

```bash
npm install
cp .env.example .env
npm start
```

Set `UPSTOX_ACCESS_TOKEN` in `.env`.

## Render

Create a Render Web Service from this repository.

Build:
`npm install`

Start:
`npm start`

Health:
`/health`

Environment variable:
`UPSTOX_ACCESS_TOKEN`

Do not commit `.env` or the real token.

After deployment, use the generated `https://...onrender.com/` URL as the Android `BASE_URL`.

## Security

The Upstox token is server-side only. This project does not put it in Android source code.

For production, use Upstox OAuth/token lifecycle rather than a manually pasted access token.
