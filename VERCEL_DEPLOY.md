# BosDB - Vercel Deployment Guide

## ⚠️ Important Considerations

### Database Connectivity
**Critical:** Vercel-deployed app **cannot connect to localhost databases!**

You'll need:
1. **Cloud Database Services:**
   - PostgreSQL: [Neon](https://neon.tech), [Supabase](https://supabase.com), AWS RDS
   - MySQL: [PlanetScale](https://planetscale.com), AWS RDS
   - MongoDB: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Redis: [Upstash](https://upstash.com), Redis Cloud

2. **OR Self-hosted with Public IP:**
   - Configure firewall to allow Vercel IPs
   - Not recommended for security reasons

---

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Build Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd ../.. && npm run build`
   - **Install Command:** `npm install`
   - **Output Directory:** `.next`

4. **Add Environment Variables:**
   ```
   ENCRYPTION_MASTER_KEY=your-32-character-secret-key
   NODE_ENV=production
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait for build (2-3 minutes)
   - Get URL: `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd /home/arushgupta/Desktop/BosDB
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? bosdb
# - In which directory is your code located? ./
# - Want to override settings? Yes
# - Build Command: cd apps/web && npm run build
# - Output Directory: apps/web/.next
# - Development Command: npm run dev

# Add environment variables
vercel env add ENCRYPTION_MASTER_KEY
# Paste your 32-character key
# Select: Production, Preview, Development

# Deploy to production
vercel --prod
```

---

## Monorepo Configuration

### Project Structure for Vercel

Vercel needs to understand the monorepo. Your `vercel.json`:

```json
{
  "buildCommand": "cd ../.. && npm run build",
  "devCommand": "cd ../.. && npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": "apps/web/.next"
}
```

### Build Process

Vercel will:
1. Run `npm install` (installs all workspace packages)
2. Run build command (builds all packages + Next.js app)
3. Deploy `apps/web/.next` output

---

## Environment Variables

### Required Variables

Add in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `ENCRYPTION_MASTER_KEY` | `<your-secret-key>` | 32-char encryption key |
| `NODE_ENV` | `production` | Environment mode |

### Generate Secure Key

```bash
# Generate random key
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup for Production

### Option 1: Neon (PostgreSQL) - Free Tier

```bash
# 1. Sign up at neon.tech
# 2. Create project
# 3. Get connection string
# 4. Create connection in BosDB:

Host: ep-xxx-xxx.us-east-2.aws.neon.tech
Port: 5432
Database: neondb
Username: your-username
Password: your-password
SSL: Required
```

### Option 2: MongoDB Atlas - Free Tier

```bash
# 1. Sign up at mongodb.com/cloud/atlas
# 2. Create cluster (M0 Free)
# 3. Add IP: 0.0.0.0/0 (allow all for Vercel)
# 4. Create user
# 5. Get connection string
# 6. Create connection in BosDB:

Host: cluster0.xxxxx.mongodb.net
Port: 27017
Database: test
Username: your-username
Password: your-password
```

### Option 3: Upstash (Redis) - Free Tier

```bash
# 1. Sign up at upstash.com
# 2. Create database
# 3. Get connection details
# 4. Create connection in BosDB:

Host: us1-xxx-xxxxx.upstash.io
Port: 6379
Database: 0
Password: your-password
```

---

## Testing Deployment

### After Deployment

1. **Access Your App:**
   ```
   https://your-project.vercel.app
   ```

2. **Test Connection:**
   - Create a connection to your cloud database
   - Run a test query
   - Verify results

3. **Check Logs:**
   - Vercel Dashboard → Deployments → Your deployment → Runtime Logs
   - Look for errors or warnings

---

## Common Issues

### Build Fails

**Error:** `Cannot find module '@bosdb/core'`

**Solution:** 
- Make sure `npm install` runs from root
- Build command should include package builds
- Check `vercel.json` configuration

### Database Connection Failed

**Error:** `ECONNREFUSED` or `Connection timeout`

**Solution:**
- Cannot use `localhost` databases
- Use cloud database services
- Check firewall rules
- Verify connection credentials

### Environment Variables Not Working

**Error:** `ENCRYPTION_MASTER_KEY is not defined`

**Solution:**
- Add in Vercel Dashboard → Settings → Environment Variables
- Redeploy after adding variables
- Check variable scope (Production/Preview/Development)

---

## Custom Domain (Optional)

### Add Your Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain: `bosdb.yourdomain.com`
3. Update DNS records (Vercel provides instructions)
4. Wait for SSL certificate (automatic)

---

## Performance Optimization

### Edge Functions

Vercel automatically deploys Next.js API routes as serverless functions.

**Limitations:**
- 10s timeout (Hobby plan)
- 50s timeout (Pro plan)
- Set query timeouts accordingly

### Caching

Add cache headers for static assets:

```typescript
// In API routes
export const config = {
  runtime: 'edge', // Or 'nodejs'
};
```

---

## Monitoring

### Built-in Analytics

- Vercel Dashboard → Analytics
- Track page views, response times
- Monitor errors

### Custom Logging

Already implemented via `@bosdb/utils` Logger:
- Logs appear in Vercel Runtime Logs
- Filter by log level

---

## Rollback

### If Deployment Fails

```bash
# Rollback via CLI
vercel rollback

# Or via Dashboard:
# Deployments → Previous deployment → Promote to Production
```

---

## Cost Estimate

### Free Tier (Hobby)
- ✅ **Vercel:** Unlimited deployments
- ✅ **Neon (PostgreSQL):** 512MB storage
- ✅ **MongoDB Atlas:** 512MB storage
- ✅ **Upstash (Redis):** 10K commands/day

**Total Cost: $0/month**

### Paid Tier (if needed)
- Vercel Pro: $20/month
- Neon Pro: $20/month
- MongoDB Atlas M10: $57/month
- Upstash Pro: $10/month

---

## Security Checklist

Before deploying:
- [ ] Strong `ENCRYPTION_MASTER_KEY` set
- [ ] Database has strong password
- [ ] Database firewall configured
- [ ] SSL/TLS enabled for databases
- [ ] `.env` files not committed to Git
- [ ] `.gitignore` includes `.bosdb-*.json`

---

## Next Steps

1. ✅ Set up cloud databases (Neon, Atlas, Upstash)
2. ✅ Get connection strings
3. ✅ Push code to GitHub
4. ✅ Deploy to Vercel
5. ✅ Add environment variables
6. ✅ Test with cloud database connections
7. ✅ Share deployment URL

**Ready to Deploy! 🚀**

---

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- BosDB Issues: Your GitHub repo
