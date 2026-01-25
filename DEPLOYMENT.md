# Deployment Guide for Render

This guide will help you deploy the SecureComm Chat application on Render.

## Prerequisites

- A GitHub account
- A Render account (sign up at https://render.com)
- Your code pushed to a GitHub repository

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Render**
   - Go to https://dashboard.render.com
   - Click "New +"
   - Select "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**

   For the **backend service**:
   - `FRONTEND_URL`: Set this to your frontend URL after deployment (e.g., `https://securecomm-frontend.onrender.com`)

   For the **frontend service**:
   - `VITE_SERVER_URL`: Set this to your backend URL (e.g., `https://securecomm-backend.onrender.com`)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. **Deploy**
   - Click "Apply" to deploy both services
   - Wait for the deployment to complete (this may take a few minutes)

5. **Update CORS Settings**
   - After frontend deploys, note the URL
   - Update the backend's `FRONTEND_URL` environment variable
   - The backend will automatically restart

### Option 2: Manual Deployment

#### Deploy Backend

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: securecomm-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
   - **Plan**: Free
5. Add environment variables:
   - `NODE_ENV`: production
   - `PORT`: 3001
   - `FRONTEND_URL`: (add after frontend deployment)
6. Click "Create Web Service"

#### Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: securecomm-frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables:
   - `VITE_SERVER_URL`: Your backend URL from step above
   - `VITE_SUPABASE_URL`: https://0ec90b57d6e95fcbda19832f.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase key
5. Click "Create Static Site"

#### Final Configuration

1. Copy your frontend URL
2. Go to backend service settings
3. Add `FRONTEND_URL` environment variable with the frontend URL
4. Backend will automatically redeploy

## Important Notes

### Free Tier Limitations

- Free services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- WebSocket connections may be interrupted during spin-down
- Consider upgrading to paid plan for production use

### Environment Variables

Make sure to set these environment variables correctly:

**Backend:**
- `FRONTEND_URL`: Your deployed frontend URL
- `PORT`: 3001 (or use Render's default)
- `NODE_ENV`: production

**Frontend:**
- `VITE_SERVER_URL`: Your deployed backend URL
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Troubleshooting

**Connection Issues:**
- Verify environment variables are set correctly
- Check that CORS is properly configured
- Ensure backend URL in frontend matches actual backend URL
- Check browser console for detailed error messages

**WebSocket Issues:**
- Render's free tier may have WebSocket limitations
- Consider using polling as fallback (already configured)
- Check that both services are awake and running

**Build Failures:**
- Check build logs in Render dashboard
- Verify all dependencies are in package.json
- Ensure Node version compatibility

### Monitoring

- Check service logs in Render dashboard
- Monitor health check endpoint: `<backend-url>/health`
- Use browser console for frontend debugging

## Support

For issues specific to Render deployment, check:
- Render documentation: https://render.com/docs
- Render community: https://community.render.com
