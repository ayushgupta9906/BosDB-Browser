# Koyeb Deployment Guide for BosDB Browser

## Overview
Deploy BosDB Browser on Koyeb cloud platform using Docker. Koyeb provides automatic Docker deployments from GitHub with zero-downtime updates.

## Prerequisites

- ✅ Koyeb account (free tier available at https://www.koyeb.com)
- ✅ GitHub repository with BosDB code
- ✅ (Optional) MongoDB Atlas account for user authentication
- ✅ (Optional) Stripe account for subscriptions

---

## Method 1: Deploy via Koyeb Dashboard (Easiest)

### Step 1: Push Code to GitHub

```bash
# Make sure your code is pushed to GitHub
cd c:\Users\Arush Gupta\Downloads\BosDB-Browser
git add .
git commit -m "Prepare for Koyeb deployment"
git push origin main  # or your deployment branch (arush)
```

### Step 2: Connect Koyeb to GitHub

1. Go to [Koyeb Dashboard](https://app.koyeb.com)
2. Click **"Create Service"**
3. Select **"GitHub"** as the source
4. Authorize Koyeb to access your GitHub repositories
5. Select the **`BosDB-Browser`** repository
6. Select the branch to deploy (e.g., `main` or `arush`)

### Step 3: Configure Docker Build

1. **Builder**: Select **"Docker"**
2. **Dockerfile path**: `Dockerfile` (should auto-detect)
3. **Port**: `3000` (this is the port the app runs on)

### Step 4: Set Environment Variables

Click **"Add Environment Variable"** and add:

| Variable Name | Value | Secret? |
|--------------|-------|---------|
| `ENCRYPTION_MASTER_KEY` | *Generate below* | ✅ Yes |
| `NODE_ENV` | `production` | ❌ No |
| `PORT` | `3000` | ❌ No |

**Optional (if using subscriptions):**
| Variable Name | Value | Secret? |
|--------------|-------|---------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/bosdb` | ✅ Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | ❌ No |
| `STRIPE_SECRET_KEY` | `sk_live_...` | ✅ Yes |

#### Generating ENCRYPTION_MASTER_KEY

Run this command locally to generate a secure key:
```bash
# On Windows PowerShell
# Generate 32 random bytes and convert to hex
$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); ($bytes|ForEach-Object ToString X2) -join ''

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `ENCRYPTION_MASTER_KEY`.

### Step 5: Configure Instance

1. **Instance Type**: 
   - Free tier: `nano` (512MB RAM) - good for testing
   - Production: `small` or `medium` (1-2GB RAM)

2. **Regions**: Select closest to your users
   - Washington D.C. (us-east)
   - Frankfurt (eu-west)
   - Singapore (ap-southeast)

3. **Health Check** (Optional but recommended):
   - Path: `/`
   - Port: `3000`
   - Initial delay: `30` seconds

### Step 6: Deploy!

1. Click **"Deploy"**
2. Wait 3-5 minutes for build and deployment
3. Koyeb will provide a URL: `https://your-service-name.koyeb.app`

### Step 7: Access Your Application

1. Open the Koyeb-provided URL
2. You should see the BosDB landing page
3. Go to `/login`
4. Use default credentials:
   - Username: `admin`
   - Password: `Admin@123`

**🎉 Done! Your BosDB is now live on Koyeb!**

---

## Method 2: Deploy via Koyeb CLI

### Install Koyeb CLI

```bash
# Windows (via npm)
npm install -g @koyeb/koyeb-cli

# Or download from https://github.com/koyeb/koyeb-cli/releases
```

### Login to Koyeb

```bash
koyeb login
# Follow the prompts to authenticate
```

### Create a Service

```bash
# Navigate to project
cd c:\Users\Arush Gupta\Downloads\BosDB-Browser

# Deploy with CLI
koyeb service create bosdb-browser \
  --git=github.com/Omni-Gang/BosDB-Browser \
  --git-branch=main \
  --git-builder=docker \
  --ports=3000:http \
  --regions=was \
  --env=NODE_ENV=production \
  --env=ENCRYPTION_MASTER_KEY=your-generated-key-here \
  --instance-type=nano

# Check deployment status
koyeb service list
koyeb service logs bosdb-browser
```

---

## Method 3: Deploy Pre-Built Docker Image

### Build and Push to Docker Hub

```bash
# Build the image locally
cd c:\Users\Arush Gupta\Downloads\BosDB-Browser
docker build -t your-dockerhub-username/bosdb-browser:latest .

# Login to Docker Hub
docker login

# Push to Docker Hub
docker push your-dockerhub-username/bosdb-browser:latest
```

### Deploy on Koyeb

1. Go to Koyeb Dashboard
2. Click **"Create Service"**
3. Select **"Docker Hub"** or **"Public Docker Registry"**
4. Enter: `your-dockerhub-username/bosdb-browser:latest`
5. Configure environment variables (same as Method 1)
6. Deploy

---

## Persistent Data Storage

### Important: Koyeb Ephemeral Storage

By default, Koyeb containers have ephemeral storage. This means:
- ❌ User data will be lost on restart
- ❌ Connection info will be lost on restart  
- ❌ Version control history will be lost on restart

### Solution: Use External Database

**Option A: MongoDB Atlas (Recommended)**

1. Create free MongoDB Atlas cluster: https://www.mongodb.net/cloud/atlas/register
2. Get connection string
3. Add to Koyeb environment variables:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bosdb
   ```
4. BosDB will automatically use MongoDB for persistent storage

**Option B: Koyeb Persistent Storage (Coming Soon)**

Koyeb is planning to add persistent volume support. Check their documentation for updates.

---

## Automatic Deployments

### Enable Auto-Deploy on Git Push

1. In Koyeb Dashboard → Your Service → Settings
2. Enable **"Auto-deploy"**
3. Select branch to watch (e.g., `main`)

Now every time you push to that branch:
```bash
git push origin main
```
Koyeb will automatically rebuild and redeploy! 🚀

---

## Monitoring & Logs

### View Logs

**Via Dashboard:**
1. Go to your service
2. Click **"Logs"** tab
3. Real-time logs appear

**Via CLI:**
```bash
koyeb service logs bosdb-browser --follow
```

### Monitor Performance

1. Go to service details
2. Click **"Metrics"** tab
3. See:
   - CPU usage
   - Memory usage
   - Request rate
   - Response time

---

## Custom Domain

### Add Your Own Domain

1. Go to service settings
2. Click **"Domains"**
3. Click **"Add Domain"**
4. Enter your domain: `db.yourcompany.com`
5. Add DNS records as shown by Koyeb:
   ```
   Type: CNAME
   Name: db
   Value: your-service.koyeb.app
   ```
6. Wait for DNS propagation (5-30 minutes)
7. Your app is now at `https://db.yourcompany.com`!

---

## Troubleshooting

### Issue 1: Build Fails

**Error**: `npm install failed` or `npm run build failed`

**Solution**:
```bash
# Test build locally first
cd c:\Users\Arush Gupta\Downloads\BosDB-Browser
docker build -t test-build .

# If it fails locally, fix the issue before deploying to Koyeb
```

### Issue 2: App Crashes on Start

**Error**: Container exits immediately

**Check Logs**:
```bash
koyeb service logs bosdb-browser
```

**Common Causes**:
- Missing `ENCRYPTION_MASTER_KEY` environment variable
- Port mismatch (ensure PORT=3000)
- Database connection error (check MONGODB_URI)

**Solution**: Verify all required environment variables are set

### Issue 3: Cannot Access Application

**Error**: `This site can't be reached`

**Checklist**:
- ✅ Check service status: Should be "Running"
- ✅ Check port: Should be 3000
- ✅ Check health check: Should be passing
- ✅ Check logs for errors

**Solution**: Wait 2-3 minutes after deployment for DNS to propagate

### Issue 4: Data Not Persisting

**Problem**: Users/connections disappear after restart

**Solution**: You MUST use MongoDB for persistent storage
```bash
# Add this environment variable in Koyeb
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bosdb
```

Without MongoDB, all data is stored in-container and lost on restart.

---

## Scaling

### Horizontal Scaling

Koyeb supports scaling to multiple instances:

1. Go to service settings
2. Increase **"Instances"** count (e.g., 2 or 3)
3. Koyeb automatically load balances between instances

**Requirements for multi-instance**:
- ✅ Must use external database (MongoDB)
- ✅ Must be on paid plan for multi-instance

### Vertical Scaling

Upgrade instance type:
- `nano` → `small` → `medium` → `large`

1. Go to service settings
2. Change **"Instance Type"**
3. Redeploy

---

## Cost Estimation

### Free Tier
- ✅ 1 nano instance (512MB RAM)
- ✅ 2.5GB transfer/month
- ✅ Good for: Testing, personal use, small teams (<10 users)

### Paid Plans
- **Small** ($5/month): 1GB RAM, 100GB transfer
- **Medium** ($10/month): 2GB RAM, 200GB transfer
- **Large** ($20/month): 4GB RAM, 500GB transfer

**Typical Usage:**
- Small team (10-50 users): Small instance
- Medium company (50-200 users): Medium instance  
- Large enterprise (200+ users): Large or multiple instances

---

## Security Best Practices

### 1. Rotate Encryption Key Regularly
```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in Koyeb dashboard
# Redeploy service
```

### 2. Use Secrets for Sensitive Data
- Always mark sensitive variables as "Secret" in Koyeb
- This prevents them from appearing in logs

### 3. Enable HTTPS Only
- Koyeb automatically provides free SSL certificates
- All traffic is encrypted by default

### 4. Restrict Database Access
- Whitelist only Koyeb IP addresses in MongoDB Atlas
- Use strong passwords for database users

---

## Backup & Recovery

### Automated Backups

**MongoDB Atlas** (if using):
- Automatic daily backups
- Point-in-time recovery
- Configure in Atlas dashboard

### Manual Export

**Export User Data**:
```bash
# SSH into your MongoDB
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/bosdb" --out=./backup
```

**Export Connection Data**:
- Go to BosDB → Settings
- Export connections to JSON
- Store securely

---

## Support & Resources

- **Koyeb Documentation**: https://www.koyeb.com/docs
- **Koyeb Status**: https://status.koyeb.com
- **BosDB GitHub**: https://github.com/Omni-Gang/BosDB-Browser
- **Community Support**: GitHub Discussions

---

## Quick Reference

### Essential Commands

```bash
# List services
koyeb service list

# View logs
koyeb service logs bosdb-browser --follow

# Redeploy
koyeb service redeploy bosdb-browser

# Update environment variable
koyeb service update bosdb-browser \
  --env=NEW_VAR=value

# Delete service
koyeb service delete bosdb-browser
```

### Environment Variables Checklist

```bash
# Required
✅ ENCRYPTION_MASTER_KEY
✅ NODE_ENV=production
✅ PORT=3000

# Optional but Recommended
⭕ MONGODB_URI (for persistence)

# Optional (Subscriptions)
⭕ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
⭕ STRIPE_SECRET_KEY

# Optional (AI Features)
⭕ HUGGINGFACE_API_KEY
⭕ GEMINI_API_KEY
⭕ OPENAI_API_KEY
```

---

**🚀 Happy Deploying!**

Need help? Open an issue: https://github.com/Omni-Gang/BosDB-Browser/issues
