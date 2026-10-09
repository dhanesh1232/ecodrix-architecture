# Google OAuth verification demo

## What changed

The Google workspace now has a **Calendar** view backed by the connected account's live primary Google Calendar. It uses the already-requested `calendar.events` scope to list, create, and edit events. CRM **Bookings** and **Event Types** are separate product data and must not be used as proof of Calendar API functionality.

## Before recording

- Deploy both `server` and `saas` changes.
- Confirm Google Calendar API is enabled in the submitted Cloud project.
- Confirm the production redirect URI is exactly `https://<api-host>/api/auth/callback/google`.
- Use the same OAuth client/project submitted for verification.
- Use an English-language browser and a dedicated test Google account.
- If that account was connected before, open **Google → Config → Remove** before recording. Wait for removal to complete; this revokes the Google grant, deletes the stored token, and clears module grants so the next authorization is a clean consent flow.
- Create one harmless existing event in the test account's primary calendar.
- Reconnect Google if the stored refresh token is stale.
- Do not show secrets, environment variables, Cloud credentials, or unrelated customer data.

## Recording script

Record one continuous video with the browser address bar visible:

1. Sign in to ECODrIx and open `/<workspace>/infra/connect`.
2. Open **Google**, click the connect/authorize action, and show the complete Google consent screen in English.
3. Ensure the consent screen visibly identifies the same app and requested Calendar permissions submitted for verification; approve access.
4. Show the successful return to ECODrIx and the connected state.
5. Open **Google → Calendar** at `/<workspace>/infra/connect/google/calendar`.
6. Show the seeded event loaded in the ECODrIx table. State that this is live data from the connected primary Google Calendar—not a CRM booking.
7. Click **New event**, create `ECODrIx OAuth verification demo`, choose a visible future time, and save.
8. Show the event immediately in the ECODrIx Calendar table.
9. Click **Google** on that row to show the same event in Google Calendar.
10. Return to ECODrIx, click **Edit**, change the title to `ECODrIx OAuth verification demo — edited` and adjust the time, then save.
11. Refresh ECODrIx and show the edited values. Open the Google link again and show the matching edit there.
12. End on the ECODrIx Calendar page with the app URL and successful live event visible.

Upload the video as an unlisted YouTube video or another reviewer-accessible link with no login or access request.

## Reply to Google's email

Hello Third Party Data Safety Team,

We addressed the app-functionality issue and updated the application to visibly demonstrate the requested `calendar.events` functionality inside the ECODrIx user interface.

The new demo shows the complete OAuth consent flow, viewing a live Google Calendar event, creating a new event, editing that event, and confirming the same changes in Google Calendar.

Demo video: <PUBLIC_OR_UNLISTED_VIDEO_URL>

OAuth client/project: <PROJECT_OR_CLIENT_IDENTIFIER>

Test path shown: `/<workspace>/infra/connect/google/calendar`

Please continue the verification review. Thank you.
