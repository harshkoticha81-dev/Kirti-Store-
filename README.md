# KIRTI STORE — PREMIUM KITCHEN APPLIANCES E-COMMERCE PLATFORM

> **Brand Tagline:** *"Smart Appliances. Smarter Living."*

**Kirti Store** is a full-stack e-commerce web platform engineered for a modern kitchen appliance brand. It delivers a premium shopping experience with responsive design, smooth Framer Motion micro-interactions, authentic product photography, real-time inventory management, authoritative checkout calculation, and an executive administrator console.

---

## 🌟 KEY HIGHLIGHTS & ARCHITECTURE

- **Authoritative Inventory & Pricing:** Prices, discounts, and inventory counts are computed and verified authoritatively directly in the backend. Front-end manipulation of prices or quantities is prevented.
- **Stock Audit Trail:** Every stock adjustment (sales, order cancellations, restocks, manual recounts) is logged into an immutable `InventoryTransaction` audit collection with timestamps, operator IDs, and mandatory reasons.
- **Role-Based Access Control (RBAC):** Strict JWT-based role authorization protects administrative routes and APIs. Customer tokens cannot access administrative endpoints.
- **Verified Reviews Engine:** Recalculates product rating averages automatically upon submission. Automatically tags reviews from confirmed buyers with a `Verified Purchase` badge.
- **Live Executive Dashboard:** Real-time metrics powered by MongoDB aggregations, interactive Recharts visualizations (Sales over time, fulfillment status distribution, category breakdown), low-stock warning triggers, and order management.

---

## 🛠️ TECHNOLOGY STACK

### Frontend
- **Framework:** React.js 18 with Vite
- **Styling:** Tailwind CSS with a curated brand palette:
  - Deep Navy Blue (`#14213D`)
  - Royal Blue (`#2563EB`)
  - Warm Orange Accent (`#FF9F1C`)
  - Off-White Background (`#F8FAFC`)
  - Charcoal Typography (`#1E293B`)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Charts:** Recharts
- **Celebration Effects:** Canvas Confetti
- **HTTP Client:** Axios (with request/response interceptors for JWT Bearer tokens)
- **State Management:** React Context API (`AuthContext`, `CartContext`, `WishlistContext`, `ToastContext`)

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) + bcryptjs (10 salt rounds)
- **Security:** Helmet, CORS with origin whitelisting, Express input validation
- **Logging & Uploads:** Morgan, Multer

---

## 📁 PROJECT DIRECTORY STRUCTURE

```
kirti-store/
├── client/                     # Vite + React Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Footer, AnnouncementBar, CartDrawer, Skeletons
│   │   │   └── product/        # ProductCard, ProductGrid
│   │   ├── context/            # AuthContext, CartContext, WishlistContext, ToastContext
│   │   ├── layouts/            # MainLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Hero, categories, bestsellers, deals, testimonials
│   │   │   ├── Shop.jsx        # Search, category filter, price slider, in-stock toggle, sort
│   │   │   ├── ProductDetails.jsx # Gallery, specifications table, stock, verified reviews
│   │   │   ├── Cart.jsx        # Subtotals, quantities, free shipping progress
│   │   │   ├── Checkout.jsx    # Address form, payment selector, stock validation
│   │   │   ├── OrderSuccess.jsx# Confetti blast, order ID, delivery tracker
│   │   │   ├── Login.jsx       # Auth login with demo autofill
│   │   │   ├── Register.jsx    # Registration with password strength bar
│   │   │   ├── Account.jsx     # Customer profile, live order status tracker, password change
│   │   │   ├── Wishlist.jsx    # Saved items with quick "Move to Cart"
│   │   │   ├── Deals.jsx       # Special discounted promotions
│   │   │   ├── About.jsx       # Brand mission and copper motor engineering story
│   │   │   ├── Contact.jsx     # Support contacts and interactive enquiry form
│   │   │   └── admin/          # Admin backoffice
│   │   │       ├── AdminLogin.jsx       # Dedicated admin portal (/admin/login)
│   │   │       ├── DashboardOverview.jsx# Live KPI cards, Recharts, recent orders, alerts
│   │   │       ├── AdminProducts.jsx    # Products table, quick price modal, quick stock modal
│   │   │       ├── AdminProductForm.jsx # Add & Edit appliance models with specs builder
│   │   │       ├── AdminOrders.jsx      # Order fulfillment and status transitions
│   │   │       ├── AdminInventory.jsx   # Stock levels monitor and audit transaction trail
│   │   │       └── AdminCustomers.jsx   # Registered customers & lifetime spend analytics
│   │   ├── services/           # Axios instance with interceptors
│   │   ├── App.jsx             # React Router route definitions
│   │   ├── index.css           # Custom glassmorphism & Tailwind directives
│   │   └── main.jsx            # React root with Context Providers
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express.js REST API Backend
│   ├── config/                 # db.js (Mongoose MongoDB connection)
│   ├── controllers/            # auth, product, category, cart, wishlist, order, admin, review
│   ├── middleware/             # JWT protect, adminOnly, upload, centralized error handler
│   ├── models/                 # User, Product, Category, Order, Cart, Wishlist, InventoryTransaction, Review
│   ├── routes/                 # Express API routes
│   ├── scripts/
│   │   ├── seedData.js         # Realistic kitchen appliance seed data
│   │   └── createAdmin.js      # Secure admin user provisioning script
│   ├── tests/
│   │   └── api.test.js         # Jest/Supertest integration test suite
│   ├── app.js                  # Express middleware configuration
│   ├── server.js               # Server entry point
│   └── package.json
│
├── .env.example                # Documented configuration variables
├── .gitignore
├── kirti-store.zip             # Ready-to-deploy archive
├── package.json                # Root monorepo orchestration
└── README.md
```

---

## ⚡ QUICK START & INSTALLATION

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/kirti-store`) or a **MongoDB Atlas** cloud cluster URI.

### 2. Install Dependencies
From the root workspace folder, install all root, backend, and frontend packages:
```bash
npm run install-all
```
*(Or run `npm install` inside the root, `server/`, and `client/` directories).*

### 3. Configure Environment Variables
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```
Default working values:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kirti-store
JWT_SECRET=kirti_store_super_secure_jwt_secret_key_2026_modern_appliances
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

ADMIN_NAME=Kirti Admin
ADMIN_EMAIL=admin@kirtistore.com
ADMIN_PASSWORD=Admin@KirtiStore2026
ADMIN_PHONE=+919876543210
```

### 4. Seed the Database
Populate the database with categories, demonstration appliances, verified reviews, and initial stock transaction history:
```bash
npm run seed
```

### 5. Provision the Administrator Account
If you ever need to create or reset the administrator account securely:
```bash
npm run create-admin
```

### 6. Run the Application in Development Mode
Launch both the Express backend API and Vite frontend client concurrently:
```bash
npm run dev
```
- **Storefront URL:** `http://localhost:5173`
- **Admin Portal URL:** `http://localhost:5173/admin/login`
- **Backend API URL:** `http://localhost:5000/api/health`

---

## 🔑 DEMO CREDENTIALS

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@kirtistore.com` | `Admin@KirtiStore2026` | Admin Console, Stock Controls, Order Fulfillment, Analytics |
| **Demo Customer** | `customer@kirtistore.com` | `Customer@2026` | Storefront, Cart, Checkout, Order Tracking, Reviews |

*(Both login pages feature 1-click **Autofill Demo Credentials** buttons for instant testing).*

---

## 🧪 RUNNING AUTOMATED TESTS

The project includes an automated test suite verifying:
- Authentication & password hashing
- Role-based authorization (ensuring customers receive 403 Forbidden on admin APIs)
- Product catalog retrieval, search, and filtering
- Dedicated price updates & negative price rejection
- Dedicated stock adjustments with audit logging
- Cart line additions and order histories

Execute tests via:
```bash
npm run test:server
```

---

## 🛡️ CORE E-COMMERCE BUSINESS RULES

### 1. Dedicated Price Updates
- Located in **Admin Product Catalog** (`/admin/products`) under the **₹** icon.
- Changes update the database in real-time and immediately reflect in the storefront.
- Historical orders preserve their original purchase prices via immutable snapshots.

### 2. Audited Stock Updates & Cancellation Restocking
- Stock cannot be negative.
- When an order is confirmed, stock is decremented and a `sale` inventory transaction is logged.
- When an administrator updates an order status to **Cancelled**, items are automatically restocked back into product inventory and a `cancellation_restock` transaction is recorded.
- Manual stock adjustments require documenting a reason in the audit log.

### 3. Authoritative Pricing
- The client does not calculate final order totals. During checkout, line item costs, shipping thresholds (Free shipping over ₹999), and GST taxes are recomputed authoritatively by the backend server.

---

## 🚀 PRODUCTION DEPLOYMENT GUIDE

### 1. MongoDB Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and whitelist network access (`0.0.0.0/0` for cloud services).
3. Copy the Connection URI (e.g., `mongodb+srv://user:pass@cluster0.mongodb.net/kirti-store?retryWrites=true&w=majority`).
4. Set this as `MONGODB_URI` in your production backend environment.

### 2. Backend Server (Render / Railway / DigitalOcean)
1. Deploy the `server/` directory as a Node web service.
2. Build command: `npm install`
3. Start command: `npm start`
4. Configure environment variables (`PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, etc.).
5. Run the seed script via console once: `npm run seed`.

### 3. Frontend Client (Vercel / Netlify / Cloudflare Pages)
1. Deploy the `client/` directory.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Configure proxy or set `baseURL` in `api.js` to your deployed backend domain.

---

## 📦 PROJECT ARCHIVE
A complete ZIP archive of the project source code is available at:
`d:/Kirti Store/kirti-store.zip`

---

## 📄 LICENSE
This project is proprietary and built for **Kirti Store — Smart Appliances. Smarter Living.**
