# n8n automation: Booking reminder

This workflow reminds invitees about upcoming meetings. It is intentionally
simple: it polls the backend, asks for bookings that are due for a reminder,
and emails each invitee.

## Import

1. In n8n, create a credential of type **Header Auth** and set the header name to
   `Authorization` (n8n's genericAuthType wiring is configured in the workflow).
2. Import `booking-reminder.workflow.json` (Workflows > Add workflow > Import from file).
3. Set the following environment variables in n8n:

   | Variable             | Purpose                                          |
   | -------------------- | ------------------------------------------------ |
   | `N8N_API_BASE_URL`   | e.g. `http://localhost:8000`                     |
   | `N8N_HOST_EMAIL`     | Email of the host account (used to obtain a JWT) |
   | `N8N_HOST_PASSWORD`  | Password of the host account                     |
   | `N8N_FROM_EMAIL`     | From address for reminder emails                 |

   No credentials are hard-coded in the workflow file.

4. Configure the SMTP credentials on the **Send email** node (n8n SMTP credential)
   or replace the node with your preferred provider.

## Trigger

A **Schedule Trigger** runs every 15 minutes. This avoids polling per booking
and keeps the call volume low.

## Workflow steps

1. **Login (get JWT)** — `POST /api/v1/auth/login/` with the host credentials
   from environment variables. Extracts the access token.
2. **Claim due reminders** — `POST /api/v1/bookings/reminders-due/` with the
   JWT as a Bearer token. The backend atomically locks and returns confirmed
   bookings starting within the next `BOOKING_REMINDER_WINDOW_HOURS` (default
   24 h) that have not been reminded yet, marking them `reminder_sent = True`.
3. **Split into bookings** — iterates over the returned list.
4. **Send reminder email** — emails the invitee with meeting time and Meet link.

## Failure path

* If login fails (bad credentials), the workflow stops at step 1 and n8n marks
  the execution as failed. Fix the environment variables.
* If the reminders endpoint returns an error (e.g. backend down), the workflow
  fails before any emails are sent — nothing is marked as reminded, so the
  next run retries.
* If a single email send fails, n8n records the error for that execution; the
  booking is already marked reminded, so at-most-once behavior holds (no spam).

## Duplicate-execution prevention

The backend does the deduplication, not the workflow:

* `claim_due_reminders` uses `SELECT ... FOR UPDATE` inside a transaction, so
  two concurrent workflow runs cannot claim the same booking.
* Bookings are returned only once (`reminder_sent = False` filter) and are
  immediately marked `reminder_sent = True` before the workflow emails them.

Re-running the workflow or running two instances in parallel therefore never
sends a duplicate reminder for the same booking.