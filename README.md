# BookIn Appliance System

React JS + PHP 8.1 + MySQL system for logging, tracking, filtering, archiving, and printing catering appliance records.

## Important stack choices

- Frontend: simple React JS using Create React App / `react-scripts`
- No Vite
- No TypeScript
- No `.jsx` files
- React files are readable `.js` files using `htm` templates instead of nested `React.createElement`
- Backend: PHP 8.1 APIs split into separate route/controller files
- Database: MySQL using `mysqli`, not PDO
- Default MySQL port: `3309`

## Folder structure

```txt
bookin-appliance-system-clean-react-mysqli/
  frontend/
    public/
    src/
      api/
      components/
      context/
      layouts/
      pages/
      utils/
  backend/
    config/
    controllers/
    helpers/
    middleware/
    routes/
    uploads/
    index.php
  database/
    schema.sql
```

## Backend setup

1. Create a MySQL database named `bookin_system`.
2. Import `database/schema.sql`.
3. Edit `backend/config/database.php` if needed.

Default database settings:

```php
host: 127.0.0.1
port: 3309
database: bookin_system
username: root
password: empty
```

4. Put the `backend` folder in your PHP server, for example:

```txt
http://localhost/bookin-appliance-system-clean-react-mysqli/backend
```

## Frontend setup

```bash
cd frontend
npm install
npm start
```

The API URL is in `frontend/.env.example`:

```env
REACT_APP_API_BASE_URL=http://localhost/bookin-appliance-system-clean-react-mysqli/backend
```

Copy it to `.env` and update the URL if your backend path is different.

## Default login

```txt
Username: admin
Password: Admin@12345
```

## Roles

### Admin

- Manage users
- Manage BookIn Fields: Clients, Owners, PM, Types
- Create Book In records
- Edit Book In records
- Archive Book In records
- View dashboard
- Filter reports
- Print list reports
- Print stock item information reports
- Manage own profile

### User

- Login
- View dashboard
- Filter report data
- Sort table results
- Print selected list reports
- Print single stock item information report
- Manage own profile

## Latest UI update

- Book In page now uses a cleaner two-card layout inspired by the supplied reference screen.
- Dashboard colors are updated to black and white with blue primary buttons and red danger/archive actions.
- Upload preview now shows one main image, a horizontal scrolling thumbnail strip, and a full-screen popup preview when the main image is clicked.
- Admin Book In page now shows all Book In records below the form, with the newest created record first.
- Backend Book In listing supports `sort=created_at&dir=DESC` for newest-first ordering.


## IMPORTANT FOR EXISTING INSTALLATION

If you previously installed frontend dependencies, delete `frontend/node_modules` and `frontend/package-lock.json`, then run `npm install` again. Dependencies are pinned now to avoid MUI icon export errors.
