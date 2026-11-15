# Turn on real emails + Google Meet links (about 10 minutes, free)

When a learner books, this backend (running on **your** Google account) will:

- create the event in **your Google Calendar** with a **real Google Meet link**
- email **you** (rameshjagarapu1993@gmail.com) and the **learner** right away, with the Meet link
- send the learner a Google Calendar invite
- lock the slot for everyone else (including any time you're already busy in Google Calendar)
- send reminder emails 24 hours, 1 hour and 10 minutes before the call

## 1. Create the Apps Script project

1. Sign in as **rameshjagarapu1993@gmail.com** and open <https://script.google.com> → **New project**.
2. Rename it to `Ramesh Booking`.
3. Delete everything in `Code.gs` and paste in the contents of **`backend/Code.gs`** from this folder.
4. Click the gear icon (**Project Settings**) → tick **Show "appsscript.json" manifest file in editor**.
   Go back to the editor, open `appsscript.json` and replace it with **`backend/appsscript.json`**.
5. Click **Save** (💾).

## 2. Grant permissions + start reminders

1. In the function dropdown at the top, choose **`setup`** → **Run**.
2. Google asks for permission → **Review permissions** → choose your account.
   You'll see "Google hasn't verified this app". This is normal for your own script:
   click **Advanced** → **Go to Ramesh Booking (unsafe)** → **Allow**.
3. The log should say `Setup complete`.

**Optional test:** choose **`testBooking`** → **Run**. You'll get two emails at your own address
and a test event next Saturday at 8:40 AM with a Meet link. Delete that event afterwards.

## 3. Publish it as a web app

1. **Deploy** → **New deployment** → gear icon → **Web app**.
2. **Execute as:** `Me`  **Who has access:** `Anyone`.
3. **Deploy** → copy the **Web app URL** (ends in `/exec`).

## 4. Connect the website

**Locally:** create a file called `.env.local` in the project folder:

```
VITE_BOOKING_API_URL=https://script.google.com/macros/s/XXXXXXXX/exec
```

**On Vercel:** Project → **Settings → Environment Variables** → add `VITE_BOOKING_API_URL`
with the same URL → **Redeploy**.

The yellow "Demo mode" bar at the top of the site disappears once it's connected.

## Day-to-day

| You want to… | Do this |
|---|---|
| See bookings | Google Calendar (or the "New booking" emails) |
| Cancel a booking | Delete the event in Google Calendar and choose **Send** to notify the learner. The slot frees up instantly. |
| Block time off | Add any event to your Google Calendar. Overlapping slots show as booked. |
| Open the admin dashboard | Visit your site with `#admin` at the end, e.g. `https://your-site.vercel.app/#admin` |
| Show your photo in emails | Set `PHOTO_URL` at the top of `Code.gs` to `https://your-site.vercel.app/ramesh.jpg` and redeploy. |

## Updating the script later

After editing `Code.gs`: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
The URL stays the same.

## Limits

A free Gmail account can send emails to about **100 recipients per day** from Apps Script.
Each booking uses 2 emails, plus up to 5 more for reminders, so that's roughly 15–25 bookings a day.
A Google Workspace account allows 1,500 a day.
