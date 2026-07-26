# Features

A detailed walkthrough of the Hardware Hub capabilities, mapped to the recruitment task scope.

## 1. Management Engine

### Admin Command Center

A dedicated admin view is available at `/admin/hardware` and `/admin/users`.

#### Hardware Management

Admins can:

- Add new hardware items with Name, Brand, Serial Number, Purchase Date, Status, and Notes.
- Edit existing hardware.
- Delete hardware from the inventory.
- Toggle the Repair status.
- Prevent setting a device to Repair while it is actively rented.

#### Account Management

Admins can:

- Create new user accounts. This is the only way to gain access to the system.
- View all registered users.
- Delete user accounts, with safeguards:
  - Cannot delete your own account.
  - Cannot delete the last admin.
  - Cannot delete a user with active rentals until all hardware is returned.

### Login System

- Simple login screen at `/login`.
- Only users previously created by an Admin can authenticate.
- Session-based authentication using Bearer tokens stored in `localStorage`.
- Unauthenticated requests are redirected to the login page.

### Smart Dashboard

The dashboard displays hardware in a clean table with:

- Columns: Name, Brand, Purchase Date, Status.
- Sorting on Name, Brand, Purchase Date, and Status, with ascending and descending order.
- Filtering by status (Available, In Use, Repair) and brand.
- Pagination for large inventories.

## 2. Rental Engine

### Rent Flow

- Users can rent any hardware with status Available.
- On rent, the status changes to In Use and a rental record is created.

### Return Flow

- Users can return hardware they rented themselves.
- On return, the status changes back to Available and the rental record is timestamped.

### Business Logic Guards

The system prevents impossible states:

- Cannot rent a device marked as Repair.
- Cannot rent a device already In Use.
- Cannot rent a device with an unknown status.
- Cannot rent the same device twice.
- Cannot return a rental that does not exist.
- Cannot return a rental belonging to another user.
- Cannot return the same rental twice.

## 3. AI-Native Layer

### Semantic Search

Available at `/dashboard` via the AI search input.

- Users type natural-language queries, e.g. *"I need something to test a mobile app on"*.
- The backend sends the catalog to an LLM via OpenRouter and returns matching hardware.
- If the AI service is unavailable or no API key is configured, the system falls back to keyword search.
- Results include a reason for each match.

### Future AI Features

A roadmap for additional AI capabilities is documented in [AI_FEATURES_PLAN.md](AI_FEATURES_PLAN.md):

- Smart Assistant: a chat interface for equipment and rental queries.
- Inventory Auditor: an AI-driven check that flags potential inventory issues.
