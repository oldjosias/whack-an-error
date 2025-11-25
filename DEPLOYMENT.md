# Deployment Instructions for Render

## Prerequisites
- GitHub repository with your code
- Render account (free tier available at https://render.com)

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Add Render + PostgreSQL deployment configuration"
git push origin main
```

## Step 2: Deploy on Render

### Using render.yaml (Recommended - Auto-creates Database!)

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository `oldjosias/whack-an-error`
4. Render will automatically:
   - Create a PostgreSQL database (free tier)
   - Create the web service
   - Link them together with DATABASE_URL
5. Click "Apply" to deploy

**That's it!** The database is created automatically and data persists forever (free tier includes 90 days of data retention after last access).

## Step 3: Get Your API URL

After deployment completes (2-3 minutes), you'll get a URL like:
```
https://whack-an-error.onrender.com
```

Test it:
```bash
curl https://whack-an-error.onrender.com/api/health
# Should return: {"status": "ok"}
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
┌─────────────────────┐      ┌──────────────────┐
│  Render Web Service │─────▶│  PostgreSQL DB   │
│  (Flask Backend)    │      │  (Free Tier)     │
│  *.onrender.com     │      │  90 days storage │
└─────────────────────┘      └──────────────────┘
```

## Data Storage - PostgreSQL Benefits

✅ **Persistent**: Data never gets lost (unlike ephemeral file storage)  
✅ **Shared**: All users see the same highscores and statistics  
✅ **Free**: PostgreSQL free tier included with Render  
✅ **Automatic**: Database created and linked via render.yaml  
✅ **Local fallback**: App uses SQLite locally if no DATABASE_URL

The app automatically detects if DATABASE_URL exists:
- **On Render**: Uses PostgreSQL for shared, persistent storage
- **Locally**: Uses SQLite (whack_error.db) or CSV for testing

## Important Notes

### Free Tier Benefits
- PostgreSQL database with 1GB storage (way more than needed)
- 90 days of data retention after last access
- Web service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- **Data persists** even when service is spun down

### Migrating Existing CSV Data (Optional)

If you have existing CSV data you want to migrate:

1. Deploy to Render first (database will be created)
2. Get your DATABASE_URL from Render dashboard
3. Run locally:
```bash
export DATABASE_URL="postgresql://..."  # Your Render database URL
python migrate.py
```

This is optional - the app works fine starting fresh!

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
