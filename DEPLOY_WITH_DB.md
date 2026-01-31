# 🚀 How to Deploy with a Database (Step-by-Step)

To make features like **Login**, **Register**, and **Orders** work on the live site, you need a cloud database. We will use **Railway** (it's free and easy) to host the database, and connect it to your **Render** app.

## Step 1: Get a Free Cloud Database
1.  Go to **[Railway.app](https://railway.app/)** and sign up (GitHub login recommended).
2.  Click **New Project** → **Provision MySQL**.
3.  Wait a moment for it to initialize.
4.  Click on the **MySQL** card that appears.
5.  Click on the **Variables** tab (or "Connect" tab).
6.  You will see a list of credentials. Keep this tab open!

## Step 2: Deploy Code to Render
1.  Push your latest code to **GitHub**.
2.  Go to **[Render Dashboard](https://dashboard.render.com/)**.
3.  Click **New +** → **Web Service**.
4.  Select your repository.
5.  **Settings**:
    *   **Name**: `best-buy-finder`
    *   **Runtime**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn app:app`

## Step 3: Connect Database to Render
On the Render deployment page (scroll down to **Environment Variables**), click **Add Environment Variable** for each of these. Copy the values from your **Railway** tab:

| Key | Value (Copy from Railway) |
| :--- | :--- |
| `MYSQL_HOST` | Copy `MYSQLHOST` (e.g., `containers-us-west.railway.app`) |
| `MYSQL_PORT` | Copy `MYSQLPORT` (e.g., `6842`) |
| `MYSQL_USER` | Copy `MYSQLUSER` (usually `root`) |
| `MYSQL_PASSWORD` | Copy `MYSQLPASSWORD` (long secret string) |
| `MYSQL_DATABASE` | Copy `MYSQLDATABASE` (usually `railway`) |

> **Don't forget your other keys!** Add these too:
> *   `SERPAPI_KEY`: (Your Google Shopping API key)
> *   `SECRET_KEY`: (Type any random password here)

## Step 4: Finish
1.  Click **Create Web Service**.
2.  Render will deploy your app.
3.  Once finished, open your website URL.
4.  **Test it**: Try to Register a new account. If it works, your database is connected!
