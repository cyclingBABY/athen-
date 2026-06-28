# 📚 Athena Library Management System

A modern Library Management System featuring a React SPA frontend and a custom PHP backend API communicating with a MySQL database.

---

## 🛠️ Technology Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn/ui, HashRouter (for smooth routing)
- **Backend API**: PHP (8.1+) running on Apache
- **Database**: MySQL (PDO)
- **Deployment**: Vercel (Frontend) + Render (Backend)

---

## 💻 Local Development Setup

To run the application locally on your computer, you need **Node.js** and **XAMPP** installed.

### Step 1: Set up the Local Database (XAMPP)
1. Start the **Apache** and **MySQL** services in the XAMPP Control Panel.
2. Open **phpMyAdmin** (`http://localhost/phpmyadmin`).
3. Create a new database named `athena_1`.
4. Import the SQL schema file located at `db/athena_1_schema.sql` into the database.

### Step 2: Install Frontend Dependencies
Open your terminal in the project root directory and run:
```bash
npm install
```

### Step 3: Run the Application
You can run the app in two ways locally:

- **Via Vite Dev Server (Recommended for development)**:
  ```bash
  npm run dev
  ```
  This runs the frontend at `http://localhost:8080/`. API requests are proxied automatically to your local XAMPP Apache server (`http://localhost/athen-/api/`).

- **Via Local Apache Server (XAMPP)**:
  1. Make sure the project folder is placed inside `C:\xampp\htdocs\athen-`.
  2. Build the project:
     ```bash
     npm run build
     ```
  3. Open your browser and navigate to `http://localhost/athen-/` (which redirects to `dist/index.html` via the `.htaccess` rules).

---

## 🚀 Production Deployment Guide (Vercel + Render)

This application is configured for a **split deployment** model: the static React frontend is hosted on **Vercel** for lightning-fast delivery, while the PHP backend is packaged into a **Docker container** and hosted on **Render**, connecting to an external cloud database.

### Phase 1: Create a Free Cloud MySQL Database
Since Render's free tier web services do not include MySQL databases, you need an external MySQL host (e.g. [Aiven MySQL](https://aiven.io/mysql) or [TiDB Cloud](https://pingcap.com/products/tidb-cloud/)).
1. Sign up on your chosen provider and create a free MySQL database instance.
2. Retrieve your connection details:
   - **Host** (e.g., `mysql-xxx.aivencloud.com`)
   - **Port** (e.g., `12345` or default `3306`)
   - **User**
   - **Password**
   - **Database Name** (e.g. `defaultdb`)
3. Connect using a database tool (like phpMyAdmin or DBeaver) and run the SQL queries inside `db/athena_1_schema.sql` to initialize your cloud tables.

### Phase 2: Deploy the PHP Backend to Render
1. Push your local project repository to GitHub.
2. Log in to [Render](https://render.com) and click **New** > **Web Service**.
3. Connect your GitHub repository.
4. Set the following options in the setup wizard:
   - **Name**: `athena-library-api`
   - **Runtime**: **Docker** (Render will automatically build the container using the root [Dockerfile](Dockerfile))
   - **Instance Type**: **Free**
5. Click **Advanced** and add the following Environment Variables to link your cloud database:
   - `DB_HOST` = *Your cloud database host*
   - `DB_USER` = *Your cloud database username*
   - `DB_PASS` = *Your cloud database password*
   - `DB_NAME` = *Your cloud database name*
6. Click **Create Web Service**. Once the build finishes and shows **Live**, copy your Web Service URL (e.g., `https://athena-library-api.onrender.com`).

### Phase 3: Deploy the React Frontend to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and import your GitHub repository.
3. Vercel will automatically detect that it is a Vite project. Keep the default settings.
4. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://athena-library-api.onrender.com` *(Use the exact Render Web Service URL you copied in Phase 2)*
5. Click **Deploy**. Vercel will build the React application and provide you with a live URL (e.g., `https://athena-library.vercel.app`).

---

## ⚠️ Important Production Warnings

1. **Render Free Tier Spin-up Delay**: 
   Render's free tier web services spin down (go to sleep) after 15 minutes of inactivity. When you first visit your Vercel site after a period of idle time, the first API request (like logging in or fetching books) may take up to **50 seconds** to complete while the Render container starts up.
2. **Ephemeral File Storage**:
   Uploaded profile pictures and book covers are saved inside the container filesystem under `/var/www/html/uploads/`. Because Render's free tier containers use ephemeral storage, all uploaded files will be deleted whenever the container restarts or wakes up from sleep. 
   *(Note: For persistent production storage, you can mount a Render paid disk or connect to a cloud service like Cloudinary/AWS S3).*
