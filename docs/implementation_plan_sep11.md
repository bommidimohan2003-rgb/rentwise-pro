# Implementation Plan — PAYENT Browse Page Redesign
## Real Product Availability + Real Add to Cart + Live MCP Inspection

Redesign and upgrade the PAYENT Browse marketplace experience with two major new capabilities:
1. **Real Date-Aware Product Availability**: Authoritative backend booking conflict checking against the MySQL `orders` table (no N+1 requests, batch API, disabled CTAs when conflicted).
2. **Real Add to Cart**: Complete rental cart backed by a persistent MySQL `cart_items` table (with in-memory degraded fallback), navbar cart icon with real badge count, slide-out mini cart drawer, dedicated `/cart` page, authoritative backend pricing, and availability revalidation.

Strict adherence to the PAYENT design system: neutral buttons (Light `#161616`, Dark `#F2F0EA`), Brand Red `#FF1744` for accents and warnings, and **zero** teal, cyan, turquoise, or green-blue.

---

## 1. Live MCP Inspection Findings (Baseline)

Before designing or modifying code, the running application on `http://localhost:3000/browse` and backend `http://127.0.0.1:8001` was inspected via Playwright MCP tools:

1. **Current Browse Appearance**:
   - Dark mode background `#05090D`, hero eyebrow `EXPLORE THE GEAR`, headline `Find the gear behind your next story.`.
   - Search bar contains gear keyword input and City dropdown, but **no date range picker**.
   - Category strip renders: `All Gear (2)`, `Cameras (0)`, `Drones (0)`, `Laptops (0)`, etc.
   - Left sidebar filter: Max Daily Rate slider (₹200 - ₹1000), Minimum Rating, "Available Now Only" (which was static and not date-aware).
   - Product grid renders 2 live products from MySQL (`Laptop` and `Sony FX3 Cinema Line Camera`).
2. **Components Rendered**:
   - `Navbar`, `Categories.tsx`, `ProductCard.tsx`, `CSSTiltCard.tsx`, `Footer`, `MobileBottomNav`, `HelpChatbot`.
3. **API Calls Loading Products**:
   - `GET /api/products/custom/public` (via `api.getPublicProducts()`)
   - `GET /api/categories/public` (via `api.getPublicCategories()`)
4. **Fields Returned for Products**:
   - `id`, `title`, `description`, `price`, `image`, `category`, `rating`, `reviews`, `available` (boolean), `location`, `owner`.
5. **Backend Availability**:
   - Only a static `is_available` boolean on the product row. **No date-aware booking conflict check** exists currently.
6. **Cart API**:
   - **Does not exist**. No `/api/cart` routes in `backend/main.py`.
7. **Cart Database Model**:
   - **Does not exist**. No `cart` or `cart_items` table in MySQL or `backend/database.py`. Single-item rentals previously bypassed cart directly into `/checkout?id=...`.
8. **Wishlist**:
   - Fully operational via `useWishlist` hook and MySQL `wishlist` table.
9. **Add to Cart Interaction**:
   - No Add to Cart button existed on product cards or the Browse page. Only a "Rent Now" button navigating to `/product/${product.id}`.
10. **Existing Console Errors**:
    - 404 for `/assets/camera-fpnuJpkX.png` (a stale hashed asset URL stored in a product image row).
    - Hydration mismatch warning on category badge count.
11. **Light Mode Check**:
    - White background `#FFFFFF`, clean layout, deep charcoal buttons.
12. **Dark Mode Check**:
    - Cinematic dark background `#05090D`, card `#0D151D`, warm ivory buttons.
13. **Mobile Viewport (390px)**:
    - Filters move into a drawer, hero stacks vertically.
14. **Visual Inconsistencies Discovered**:
    - ProductCard had a `Verified Gear` badge with emerald/teal styling (`bg-emerald-500/90`), violating the button and color palette rules.
    - Missing rental date inputs in the hero and sidebar.
    - Missing availability indicators on cards.
    - Missing Cart icon and badge in the Navbar.

---

## 2. Proposed Architecture & Implementation

### A. Database Schema Changes (`backend/database.py`)

#### 1. MySQL `cart_items` Table
Create `cart_items` in `init_db()`:
```sql
CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(255) PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50) NOT NULL,
    days INT DEFAULT 1,
    daily_price INT DEFAULT 0,
    total_price INT DEFAULT 0,
    created_at VARCHAR(100),
    updated_at VARCHAR(100),
    INDEX idx_cart_user (user_email),
    INDEX idx_cart_product (product_id)
);
```

#### 2. Cart Persistence & Fallback Operations
- `MOCK_CARTS: Dict[str, List[dict]]` in memory for degraded fallback mode when MySQL is offline.
- Helpers in `backend/database.py`:
  - `get_user_cart(user_email: str) -> List[dict]`
  - `add_or_update_cart_item(user_email: str, product_id: str, start_date: str, end_date: str) -> dict`
  - `remove_cart_item(user_email: str, item_id: str) -> bool`
  - `clear_user_cart(user_email: str) -> bool`

#### 3. Date-Aware Booking Conflict Query
In `backend/database.py`:
- Active bookings in `orders` are those where `status NOT IN ('cancelled', 'refunded', 'rejected')`.
- Interval overlap formula for requested interval `[req_start, req_end]` and booked interval `[order.start_date, order.end_date]`:
  `req_start <= order.end_date AND req_end >= order.start_date`.
- Batched query implementation:
  ```sql
  SELECT DISTINCT product_id 
  FROM orders 
  WHERE status NOT IN ('cancelled', 'refunded', 'rejected')
    AND start_date <= %s AND end_date >= %s
    AND product_id IN (%s, %s, ...)
  ```
- Function: `check_products_booking_conflicts(product_ids: List[str], start_date: str, end_date: str) -> Set[str]`.

---

### B. Backend API Endpoints (`backend/main.py`)

#### 1. Batch Product Availability Endpoint (No N+1)
- `POST /api/products/availability/batch`
  - Input schema: `BatchAvailabilityRequest(start_date: str, end_date: str, product_ids: List[str])`
  - Validates `start_date <= end_date`.
  - Queries active booking conflicts in one single query.
  - Queries product status (`is_available` flag in `custom_products`).
  - Returns:
    ```json
    {
      "start_date": "2026-09-15",
      "end_date": "2026-09-18",
      "availability": {
        "p-custom-1": {
          "status": "available",
          "is_available": true,
          "reason": null
        },
        "p-custom-2": {
          "status": "unavailable",
          "is_available": false,
          "reason": "Booked for selected dates"
        }
      }
    }
    ```
- `GET /api/products/{id}/availability?start_date=...&end_date=...`
  - Convenience route for single product checking.

#### 2. Cart Endpoints (Authenticated via `Depends(get_current_user_email)`)
- `GET /api/cart`
  - Returns current user's cart items joined with live product details (`title`, `price`, `image`, `category`, `location`).
  - Re-evaluates each item's availability against active bookings for its specific rental dates.
  - Authoritative price calculation:
    `days = max(1, math.ceil((end_dt - start_dt).total_seconds() / 86400))`
    `subtotal = sum(item.daily_price * item.days)`
    `tax = int(subtotal * 0.08)`
    `total = subtotal + tax`
  - Returns `{ items: [...], subtotal: int, tax: int, total: int, count: int }`.
- `POST /api/cart`
  - Body: `AddToCartSchema(product_id: str, start_date: str, end_date: str)`
  - Re-validates product exists and is active.
  - Re-validates that requested rental dates do NOT conflict with existing active bookings.
  - If conflicting, returns HTTP 409 Conflict: `{"detail": "Product is already booked for the selected dates."}`.
  - Inserts/updates `cart_items` and returns the refreshed cart item.
- `DELETE /api/cart/{item_id}`
  - Deletes cart item belonging to the authenticated user.
- `DELETE /api/cart`
  - Clears all cart items for the authenticated user.
- `POST /api/cart/checkout`
  - Pre-checkout validation of all items in cart. If any item has a booking conflict, returns 409 with the conflicted item IDs so the user can update dates or remove items.

---

### C. Frontend Architecture & Components

#### 1. Cart State & Hook (`frontend/src/hooks/useCart.tsx`)
- Provides cart context / TanStack Query integration:
  - `cartItems`: list of items with product details and availability flags.
  - `cartCount`: total number of items in cart.
  - `subtotal`, `tax`, `total`.
  - `addToCart(productId, startDate, endDate)`: validates auth, calls API, triggers success toast, opens mini cart drawer.
  - `removeFromCart(itemId)`: calls API, updates count immediately.
  - `clearCart()`: clears cart.
  - `isCartOpen`, `openCart()`, `closeCart()`: controls mini cart drawer.
  - Unauthenticated fallback: stores pending cart item and prompts login via existing auth modal, preserving intended cart action.

#### 2. Navbar Cart Integration (`frontend/src/components/layout/Navbar.tsx`)
- Add shopping bag Cart icon next to the Wishlist icon.
- Displays a crisp count badge (`cartCount > 0`).
- Neutral dark/light badge styling (or subtle brand red accent dot when active).
- Accessible `aria-label="Rental Cart ({cartCount} items)"`.
- Clicking toggles the `CartDrawer`.

#### 3. Mini Cart Drawer (`frontend/src/components/cart/CartDrawer.tsx`)
- Premium slide-out drawer from the right screen edge.
- Displays:
  - Cart header with item count and close button.
  - List of cart items: product image, title, rental dates range, duration ("X days"), daily rate, item total.
  - Live availability badge: `● Available` or `● Conflict: Already booked for these dates`.
  - Remove item button (`Trash2`).
  - Order summary breakdown: Subtotal, Estimated Tax (8%), Total.
  - Primary Action Button: "Proceed to Checkout →" (routes to `/checkout?productId=...` or batch checkout).
  - Secondary Action Button: "View Cart Page" (`/cart`) or "Continue Shopping".
  - Empty State: "Your cart is empty. Find the gear you need for your next project." + "Explore Gear" button.

#### 4. Dedicated Cart Page (`frontend/src/pages/Cart.tsx` & `frontend/src/routes/cart.tsx`)
- Complete `/cart` route with breadcrumb and editorial layout.
- Full gear breakdown with date adjustments.
- Re-validated booking conflicts banner if any gear becomes unavailable.

#### 5. ProductCard Redesign (`frontend/src/components/common/ProductCard.tsx`)
- Remove forbidden emerald/teal badge (`bg-emerald-500/90`) and emerald icons (`MapPin` color updated to neutral/muted).
- Add date-aware availability indicator badge:
  - `● Available`: subtle semantic positive / neutral badge (`bg-black/60 text-white/90 border border-white/10`).
  - `● Unavailable`: subtle red warning badge (`bg-red-500/20 text-red-400 border border-red-500/30`).
- Action buttons in strict PAYENT neutral system:
  - **Primary**: `Add to Cart` (or `Unavailable` disabled, or `Adding...`, or `Added ✓`).
    - Light Mode: `#161616` background, `#FFFFFF` text, hover `#292929`.
    - Dark Mode: `#F2F0EA` background, `#0A0A0A` text, hover `#FFFFFF`.
    - Disabled state: muted background, opacity 50%, not-allowed cursor.
  - **Secondary**: `View Details` (navigates to `/product/$id`).
    - Light Mode: `#FFFFFF` background, `#171717` text, border `#D6D6D6`.
    - Dark Mode: transparent background, `#F3F3F3` text, border `rgba(255,255,255,0.25)`.

#### 6. Browse Page (`frontend/src/pages/Categories.tsx`)
- Hero Search Bar upgraded to:
  - `[ Gear keyword ]` + `[ City location ]` + `[ Start Date → End Date ]` + `[ Search ]`
- Date Range Selector:
  - Uses native accessible date pickers with min date set to today.
  - Default dates: Tomorrow to 3 days later, or synced from URL query params `?start=YYYY-MM-DD&end=YYYY-MM-DD`.
  - When dates change, automatically triggers `api.checkAvailabilityBatch(startDate, endDate, visibleProductIds)`.
- Availability Filter:
  - Filter options in sidebar and mobile filter drawer: `All Gear` vs `Available for Selected Dates`.
  - Instant client-side filtering backed by the authoritative batch availability API results.
- Fix image 404 and hydration mismatch discovered during MCP inspection.

---

## 3. Verification Plan

### Automated Tests
1. **Backend Unit Tests**:
   - Create `backend/tests/test_cart_and_availability.py`:
     - Test 1: Date conflict logic with overlapping bookings (`req_start <= end_date AND req_end >= start_date`).
     - Test 2: Batch availability endpoint (`POST /api/products/availability/batch`) returns correct map.
     - Test 3: Cart creation and retrieval (`POST /api/cart`, `GET /api/cart`).
     - Test 4: Rejection of conflicting product additions (409 Conflict).
     - Test 5: Cart item deletion (`DELETE /api/cart/{id}`).
     - Test 6: Price calculation verification (daily rate * days + 8% tax).
   - Command:
     ```powershell
     .venv\Scripts\python -m unittest backend/tests/test_cart_and_availability.py
     ```
2. **Frontend Production Build & Linter**:
   - Command:
     ```powershell
     npm run build
     ```
     Must exit with code 0 and zero TypeScript/bundle errors.

### Live MCP Verification (Playwright)
1. **TEST A: Browse Page & Hero Dates**:
   - Navigate to `http://localhost:3000/browse`.
   - Inspect hero search bar with date pickers.
   - Select dates and verify batch availability API network request fires without N+1.
2. **TEST B: Product Card Availability & Add to Cart**:
   - Inspect product cards for `● Available` badge.
   - Click "Add to Cart" on an available product.
   - Verify button switches to "Added ✓", Navbar cart icon badge updates to (1), and Cart Drawer slides in.
3. **TEST C: Cart Drawer Verification**:
   - Inspect Cart Drawer: verify product image, title, selected rental dates, calculated duration, price, and total.
   - Verify remove button removes item and decrements badge count.
4. **TEST D: Conflict & Unavailable State**:
   - Add conflicting booking for a test product in the database.
   - Set Browse dates to match the conflict.
   - Verify card displays `● Unavailable for selected dates` and "Add to Cart" is disabled.
5. **TEST E: Theme Switching**:
   - Toggle light mode: verify buttons are `#161616`.
   - Toggle dark mode: verify buttons are `#F2F0EA`.
   - Confirm zero teal/cyan/aqua elements.
6. **TEST F: Mobile Viewport**:
   - Test at 390px and 768px: verify Filter Drawer, Cart Drawer, and mobile bottom nav.
7. **TEST G: Console & Network Checks**:
   - Inspect console logs: 0 errors, no hydration mismatch, no image 404s.
