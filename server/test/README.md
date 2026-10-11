# DealRoom server tests

## Unit tests

Run from `server/` after installing dependencies:

```powershell
npm ci
npm test
```

The default command runs the validation/schema unit tests only. They do not connect to MongoDB.

## Critical workflow integration test

Use a **dedicated test database** whose database name contains `test`. Never point this test at development or production data. The suite creates test users, profiles, connection requests, Deal Rooms, messages, notes, notifications, and activity records, then deletes records it created; it does not drop the database.

PowerShell example (replace the URI with credentials for your isolated test database):

```powershell
$env:TEST_MONGODB_URI = "mongodb+srv://<user>:<encoded-password>@<cluster>/<dealroom_test>?retryWrites=true&w=majority"
npm run test:integration
Remove-Item Env:TEST_MONGODB_URI
```

The integration test uses HTTP sessions, CSRF cookies, and WebSockets against the real Express app. The MongoDB deployment must support transactions because message sequencing and persistence use a transaction. MongoDB Atlas replica-set clusters support this requirement.

## First administrator

Public registration intentionally cannot create admin accounts. After configuring the server's normal environment variables, set the following variables only in your shell or secure secret manager and run `npm run bootstrap:admin` once:

- `ADMIN_BOOTSTRAP_NAME`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD` (16–128 characters)

The bootstrap command refuses to create a second administrator or reuse an existing email. Do not commit the password or put it in a tracked `.env` file.
