# eatatnus-backend

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create environment file

   ```bash
   cp .env.example .env
   ```

3. Start the app

   ```bash
   npm run dev
   ```

4. Go to URL

   `http://localhost:3000`

## Unit testing

All unit tests are found under `__tests__` folder

To run all unit test files, run:

```bash
npm test
```

To run a specific unit test file (e.g. canteensController.test.ts), run:

```bash
npm test canteensController.test.ts
```

## Prisma

To create or manipulate database using a graphical user interface, run:

```bash
npx prisma studio
```

## API endpoint routes

| URL                           | Method   | Description                                                                          | Protected |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------ | --------- |
| /api/canteens                 | `GET`    | Retrieves a list of canteens                                                         | No        |
| /api/canteens                 | `POST`   | Create canteen                                                                       | Yes       |
| /api/canteens/:id             | `GET`    | Retrieve canteen using unique id                                                     | No        |
| /api/canteens/:id             | `PATCH`  | Update canteen using unique id                                                       | Yes       |
| /api/canteens/:id             | `DELETE` | Delete canteen using unique id                                                       | Yes       |
| /api/canteens/:id/review      | `POST`   | Create canteen review                                                                | Yes       |
| /api/stalls                   | `GET`    | Retrieves a list of stalls                                                           | No        |
| /api/stalls                   | `POST`   | Create stall                                                                         | Yes       |
| /api/stalls/:id               | `GET`    | Retrieve stall using unique id                                                       | No        |
| /api/stalls/:id               | `PATCH`  | Update stall using unique id                                                         | Yes       |
| /api/stalls/:id/review        | `POST`   | Create stall review                                                                  | Yes       |
| /api/stalls/:id/owner         | `POST`   | Assign owner                                                                         | Yes       |
| /api/reviews/:id              | `PATCH`  | Update stall review                                                                  | Yes       |
| /api/reviews/:id              | `DELETE` | Delete stall review                                                                  | Yes       |
| /api/reviews/:id/reply        | `POST`   | Create a reply to the specified review                                               | Yes       |
| /api/reviews/reply            | `PATCH`  | Update reply                                                                         | Yes       |
| /api/reviews/reply            | `DELETE` | Delete reply                                                                         | Yes       |
| /api/menus                    | `POST`   | Create menu                                                                          | Yes       |
| /api/menus/:id                | `GET`    | Retrieve menu using unique id                                                        | No        |
| /api/menus/:id                | `PATCH`  | Update menu                                                                          | Yes       |
| /api/menus/:id                | `DELETE` | Delete stall menu                                                                    | Yes       |
| /api/caloric-tracker          | `GET`    | Retrieve caloric tracker                                                             | Yes       |
| /api/caloric-tracker          | `POST`   | Create caloric tracker                                                               | Yes       |
| /api/caloric-tracker          | `DELETE` | Delete caloric tracker                                                               | Yes       |
| /api/caloric-tracker/entry    | `POST`   | Create caloric tracker entry                                                         | Yes       |
| /api/caloric-tracker/entry    | `PATCH`  | Update caloric tracker entry                                                         | Yes       |
| /api/caloric-tracker/entry    | `DELETE` | Delete caloric tracker entry                                                         | Yes       |
| /api/caloric-tracker/search   | `GET`    | Search foods using query parameters `q` and `limit`                                  | No        |
| /api/users/                   | `GET`    | Retrieve personal user info                                                          | Yes       |
| /api/users/                   | `POST`   | Create personal user account                                                         | Yes       |
| /api/users/:id                | `GET`    | Retrieve user info using unique id                                                   | No        |
| /api/users/:id                | `PATCH`  | Update user account using unique id                                                  | Yes       |
| /api/users/:id                | `DELETE` | Delete user account using unique id                                                  | Yes       |
| /api/users/:id/profile        | `POST`   | Create user profile using unique id                                                  | Yes       |
| /api/users/:id/profile        | `PATCH`  | Update user profile using unique id                                                  | Yes       |
| /api/users/notifications      | `PATCH`  | Update user notification                                                             | Yes       |
| /api/users/notifications      | `DELETE` | Destroy all user notifications                                                       | Yes       |
| /api/orders                   | `GET`    | Retrieve a list of orders (personal or another user's if userId is provided in body) | Yes       |
| /api/orders                   | `POST`   | Create order                                                                         | Yes       |
| /api/orders/:id               | `GET`    | Retrieve order using unique id                                                       | Yes       |
| /api/orders/:id               | `PATCH`  | Update order (only available for those which are not yet paid)                       | Yes       |
| /api/orders/:id               | `DELETE` | Delete order (only available for those which are not yet paid)                       | Yes       |
| /api/orders/:id/fulfill       | `PATCH`  | Fulfill order (only available for admins and stall owners)                           | Yes       |
| /api/payments/publishable-key | `GET`    | Retrieve Stripe publishable key                                                      | No        |
| /api/payments/account-link    | `GET`    | Retrieve Stripe account link for onboarding (Only for BUSINESS accounts)             | Yes       |
| /api/payments/payment-sheet   | `POST`   | Retrieve Stripe payment sheet                                                        | Yes       |
| /api/payments/webhook         | `POST`   | API endpoint reserved for Stripe webhooks                                            | No        |
| /api/payments/onboarded       | `POST`   | Retrieve boolean value whether BUSINESS user has been onboarded on Stripe            | No        |
| /api/payments/stripe-return   | `GET`    | Redirect for Stripe onboarding                                                       | No        |
| /api/payments/stripe-refresh  | `GET`    | Refresh Stripe onboarding link                                                       | No        |
