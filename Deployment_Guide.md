# Deploying FlowSync IC

To deploy a MERN stack application like FlowSync IC, the industry standard and most robust approach is to split the deployment.

Netlify is fantastic for the React frontend, but deploying a stateful Node.js/Express backend (which uses MongoDB connections, sessions, and Passport authentication) to Netlify's serverless functions can cause significant headaches like connection timeouts, dropped sessions, and cold-start delays.

Here is the recommended step-by-step approach.

## The Recommended Approach: Split Stack
*   **Frontend (React/Vite):** Deploy to Netlify
*   **Backend (Node/Express):** Deploy to Render.com (or Railway / Heroku)

### Phase 1: Deploy the Backend to Render

1.  Create an account on [Render.com](https://render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository and select the **FlowSync IC** repository.
4.  Configure the service:
    *   **Root Directory:** `server`
    *   **Environment:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
5.  Add your Environment Variables (from your `server/.env`):
    *   `PORT`: (Render will set this automatically, but you can leave your code as is)
    *   `MONGODB_URI`: Your MongoDB Atlas connection string
    *   `JWT_SECRET`: Your secret
    *   `SESSION_SECRET`: Your secret
    *   `GOOGLE_CLIENT_ID`: Your Google OAuth ID
    *   `GOOGLE_CLIENT_SECRET`: Your Google OAuth Secret
    *   `CLIENT_URL`: We will update this to your Netlify URL after we deploy the frontend.
6.  Click **Create Web Service**.
7.  Once deployed, copy the Render URL (e.g., `https://flowsync-api.onrender.com`).

### Phase 2: Deploy the Frontend to Netlify

I have already made two important adjustments to your frontend code to ensure it deploys smoothly:
*   **Environment Variable Support:** Updated `client/src/utils/api.js` to use `import.meta.env.VITE_API_URL` so it can communicate with your live Render backend instead of localhost.
*   **Routing Fix:** Added a `_redirects` file in `client/public` to ensure React Router works correctly on Netlify without throwing 404 errors on refresh.

Now, follow these steps to deploy:

1.  Create an account on [Netlify](https://www.netlify.com/).
2.  Click **Add new site** > **Import an existing project**.
3.  Connect your GitHub repository and select **FlowSync IC**.
4.  Configure the build settings:
    *   **Base directory:** `client`
    *   **Build command:** `npm run build`
    *   **Publish directory:** `client/dist`
5.  Click **Add environment variables**:
    *   Add `VITE_API_URL` and set its value to your Render backend URL (e.g., `https://flowsync-api.onrender.com/api`).
6.  Click **Deploy Site**.
7.  Once deployed, copy your Netlify URL (e.g., `https://flowsync.netlify.app`).

### Phase 3: Final Wiring

1.  Go back to your Render Dashboard > **Environment Variables**.
2.  Update `CLIENT_URL` to your new Netlify URL (e.g., `https://flowsync.netlify.app`). This is required for CORS and Google OAuth callbacks to work correctly.
3.  Go to your Google Cloud Console (where you created your Google OAuth credentials):
    *   Add your Render backend URL to the **Authorized JavaScript origins**.
    *   Add your Render backend callback URL (e.g., `https://flowsync-api.onrender.com/api/auth/google/callback`) to the **Authorized redirect URIs**.

---

## Alternative: Deploying Everything to Netlify

If you strictly want to use Netlify for the backend as well, you must convert your Express application into Netlify Serverless Functions.

> **Note:** This is not recommended for apps using MongoDB and Express Sessions due to cold start delays and database connection limits.

If you still wish to do this, here is what you need to do:

1.  Install `serverless-http` in your `server` folder: `npm install serverless-http`
2.  Modify your `server/server.js` to export a handler:
    ```javascript
    const serverless = require('serverless-http');
    // ... your existing express code
    // Remove app.listen(PORT) and replace with:
    module.exports.handler = serverless(app);
    ```
3.  Create a `netlify.toml` in your project root to map functions:
    ```toml
    [build]
      base = "client"
      command = "npm run build"
      publish = "dist"
    [functions]
      directory = "../server"
      node_bundler = "esbuild"
    [[redirects]]
      from = "/api/*"
      to = "/.netlify/functions/server/:splat"
      status = 200
    ```

**I strongly suggest following the Recommended Split Stack approach for the best performance and stability.**
