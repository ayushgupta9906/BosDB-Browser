---
description: Deploy BosDB-Browser to Koyeb (free tier, no credit card)
---

# Steps to deploy BosDB-Browser on Koyeb

1. **Create Koyeb account**
   - Visit https://koyeb.com and sign up with GitHub (no credit‑card required).
2. **Connect repository**
   - In Koyeb dashboard, click **Create Service** → **GitHub** → select `Omni-Gang/BosDB-Browser` → branch `main`.
3. **Enable Compose mode**
   - Toggle **Compose mode** and set **Compose file** to `docker-compose.prod.yml`.
4. **Add environment variables**
   - `POSTGRES_PASSWORD` and `MYSQL_ROOT_PASSWORD` (choose strong values).
   - Any other BosDB env vars (e.g., `NEXT_PUBLIC_API_URL`).
5. **Deploy service**
   - Click **Create Service**. Koyeb will build the Docker image and start containers.
6. **Verify deployment**
   - Open the provided URL (e.g., `https://your-service.up.koyeb.app`).
   - Create a database via the UI to ensure containers run and persist.
7. **Optional: Free custom domain**
   - Register a free domain on Freenom (e.g., `mybosdb.tk`).
   - Add the domain to Cloudflare DNS (CNAME → `your-service.up.koyeb.app`).
   - In Koyeb **Settings → Custom domain**, add the domain and wait for SSL.

**Note**: All steps involving external services (Koyeb account creation, DNS configuration) must be performed manually.
