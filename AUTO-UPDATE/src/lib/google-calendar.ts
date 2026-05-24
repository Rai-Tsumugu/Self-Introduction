import { google, calendar_v3 } from "googleapis";

export interface FetchOptions {
  calendarId: string;
  timeMin: Date;
  timeMax: Date;
}

export async function fetchCalendarEvents(
  opts: FetchOptions,
): Promise<calendar_v3.Schema$Event[]> {
  const credsRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credsRaw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");

  const creds = JSON.parse(credsRaw);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: opts.calendarId,
    timeMin: opts.timeMin.toISOString(),
    timeMax: opts.timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 500,
  });

  return (res.data.items ?? []).filter((e) => e.visibility !== "private");
}
