# Deployment Instructions for Render

## Prerequisites
- GitHub repository with your code
- Render account (free tier available at https://render.com)

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

## Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended)

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository `oldjosias/whack-an-error`
4. Render will automatically detect `render.yaml` and configure the service
5. Click "Apply" to deploy

### Option B: Manual Setup

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: whack-an-error
   - **Region**: Frankfurt (or closest to you)
   - **Branch**: main
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Click "Create Web Service"

## Step 3: Get Your API URL

After deployment completes (2-3 minutes), you'll get a URL like:
```
https://whack-an-error.onrender.com
```

## Step 4: Update Frontend to Use Render Backend

Update the API client to use your Render URL instead of localhost.

In `static/js/api-client.js`, change the API_BASE_URL:

```javascript
const API_BASE_URL = 'https://whack-an-error.onrender.com';
```

Then commit and push to GitHub Pages:
```bash
git add static/js/api-client.js
git commit -m "Update API URL to use Render backend"
git push origin main
```

## Architecture

```
┌─────────────────────┐
│  GitHub Pages       │
│  (Static Frontend)  │
│  oldjosias.github.io│
└──────────┬──────────┘
           │ CORS-enabled
           │ API calls
           ▼
┌─────────────────────┐
│  Render.com         │
│  (Flask Backend)    │
│  *.onrender.com     │
└─────────────────────┘
```

## Important Notes

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free (enough for personal projects)

### Data Persistence
- `data.csv` is stored in ephemeral storage
- Data will be lost when the service restarts
- For permanent storage, upgrade to paid tier with persistent disk, or use a database

### Environment Variables (Optional)
If you need to add environment variables:
1. Go to your service dashboard on Render
2. Click "Environment"
3. Add variables like:
   - `FLASK_ENV=production`
   - `SECRET_KEY=your-secret-key` (if using sessions)

## Testing

1. Test the health endpoint:
   ```bash
   curl https://whack-an-error.onrender.com/api/health
   ```
   Should return: `{"status": "ok"}`

2. Test locally before deploying:
   ```bash
   gunicorn app:app
   # Visit http://localhost:8000
   ```

## Troubleshooting

### View Logs
- Go to Render dashboard → Your service → Logs
- Look for errors during startup

### Common Issues
- **Port binding**: Render sets PORT automatically, app.py is configured correctly
- **Dependencies**: Make sure all packages are in requirements.txt
- **CORS errors**: Already configured for oldjosias.github.io

### Local Testing with Gunicorn
```bash
gunicorn --bind 0.0.0.0:5002 app:app
```

## Monitoring

Check your service status:
- Dashboard: https://dashboard.render.com
- Health check: `https://your-app.onrender.com/api/health`

## Upgrading (Optional)

For production use, consider:
- **Starter Plan ($7/month)**: No spin-down, persistent disk
- **PostgreSQL database**: Better than CSV for data storage
- **Redis cache**: For session storage
