import { google } from 'googleapis'
import { sql } from '@/lib/db'
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'tasklist-secret-key')

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

export async function getAuthUrl(userId, { scopes, returnTo } = {}) {
  const oauth2Client = getOAuth2Client()

  const state = await new SignJWT({ userId, returnTo: returnTo || 'google-calendar' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(secret)

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes || [CALENDAR_SCOPE],
    include_granted_scopes: true,
    state,
  })
}

export async function verifyState(state) {
  const { payload } = await jwtVerify(state, secret)
  return { userId: payload.userId, returnTo: payload.returnTo || 'google-calendar' }
}

export async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function saveTokens(userId, tokens, scopes) {
  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000)
  const scopeStr = scopes || tokens.scope || ''

  // Upsert
  const { rows: existing } = await sql`SELECT id FROM google_calendar_connections WHERE user_id = ${userId}`
  if (existing.length > 0) {
    await sql`
      UPDATE google_calendar_connections SET
        access_token = ${tokens.access_token},
        refresh_token = COALESCE(${tokens.refresh_token || null}, refresh_token),
        token_expiry = ${expiry.toISOString()},
        granted_scopes = COALESCE(${scopeStr || null}, granted_scopes),
        updated_at = NOW()
      WHERE user_id = ${userId}`
  } else {
    await sql`
      INSERT INTO google_calendar_connections (user_id, access_token, refresh_token, token_expiry, granted_scopes)
      VALUES (${userId}, ${tokens.access_token}, ${tokens.refresh_token}, ${expiry.toISOString()}, ${scopeStr})`
  }
}

export async function getAuthenticatedClient(userId) {
  const { rows } = await sql`SELECT * FROM google_calendar_connections WHERE user_id = ${userId}`
  if (!rows.length) return null

  const conn = rows[0]
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: conn.access_token,
    refresh_token: conn.refresh_token,
    expiry_date: new Date(conn.token_expiry).getTime(),
  })

  // Check if token needs refresh
  if (new Date(conn.token_expiry) <= new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)
    await saveTokens(userId, credentials)
  }

  return oauth2Client
}

export async function listCalendars(userId) {
  const auth = await getAuthenticatedClient(userId)
  if (!auth) return []

  const calendar = google.calendar({ version: 'v3', auth })
  const res = await calendar.calendarList.list()
  return (res.data.items || []).map((cal) => ({
    id: cal.id,
    summary: cal.summary,
    primary: cal.primary || false,
    backgroundColor: cal.backgroundColor,
  }))
}

export async function createEvent(userId, task, calendarId) {
  const auth = await getAuthenticatedClient(userId)
  if (!auth) throw new Error('Not connected to Google Calendar')

  const calendar = google.calendar({ version: 'v3', auth })
  const event = {
    summary: task.name,
    description: task.notes || '',
    start: { date: task.due_date },
    end: { date: task.due_date },
  }

  const res = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    requestBody: event,
  })

  return res.data.id
}

export async function updateEvent(userId, task, calendarId, eventId) {
  const auth = await getAuthenticatedClient(userId)
  if (!auth) throw new Error('Not connected to Google Calendar')

  const calendar = google.calendar({ version: 'v3', auth })
  const event = {
    summary: task.name,
    description: task.notes || '',
    start: { date: task.due_date },
    end: { date: task.due_date },
  }

  await calendar.events.update({
    calendarId: calendarId || 'primary',
    eventId,
    requestBody: event,
  })
}

export async function deleteEvent(userId, calendarId, eventId) {
  const auth = await getAuthenticatedClient(userId)
  if (!auth) return

  const calendar = google.calendar({ version: 'v3', auth })
  try {
    await calendar.events.delete({
      calendarId: calendarId || 'primary',
      eventId,
    })
  } catch (e) {
    // Event may have been deleted already
    if (e.code !== 404 && e.code !== 410) throw e
  }
}

export async function getConnection(userId) {
  const { rows } = await sql`
    SELECT selected_calendar_id, selected_calendar_name
    FROM google_calendar_connections
    WHERE user_id = ${userId}`
  return rows[0] || null
}

export async function ensureGcalTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS google_calendar_connections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      token_expiry TIMESTAMPTZ NOT NULL,
      selected_calendar_id TEXT,
      selected_calendar_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
  // Add gcal_event_id and gmail_message_id to tasks if not exists
  try {
    await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS gcal_event_id TEXT`
    await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS gmail_message_id TEXT`
  } catch {}
  // Add Gmail columns to connections
  try {
    await sql`ALTER TABLE google_calendar_connections ADD COLUMN IF NOT EXISTS gmail_enabled BOOLEAN DEFAULT FALSE`
    await sql`ALTER TABLE google_calendar_connections ADD COLUMN IF NOT EXISTS gmail_label_id TEXT`
    await sql`ALTER TABLE google_calendar_connections ADD COLUMN IF NOT EXISTS granted_scopes TEXT`
  } catch {}
}
