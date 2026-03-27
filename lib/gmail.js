import { google } from 'googleapis'
import { sql } from '@/lib/db'
import { getAuthenticatedClient } from '@/lib/gcal'
import { analyzeEmail } from '@/lib/ai'

const LABEL_NAME = 'TaskList'

export async function ensureGmailLabel(userId) {
  const auth = await getAuthenticatedClient(userId)
  if (!auth) throw new Error('Not connected to Google')

  const gmail = google.gmail({ version: 'v1', auth })

  // Check if we already have the label ID stored
  const { rows } = await sql`
    SELECT gmail_label_id FROM google_calendar_connections WHERE user_id = ${userId}`
  if (rows[0]?.gmail_label_id) {
    // Verify the label still exists
    try {
      await gmail.users.labels.get({ userId: 'me', id: rows[0].gmail_label_id })
      return rows[0].gmail_label_id
    } catch {
      // Label was deleted, recreate it
    }
  }

  // Look for existing label
  const labelList = await gmail.users.labels.list({ userId: 'me' })
  const existing = (labelList.data.labels || []).find(
    (l) => l.name.toLowerCase() === LABEL_NAME.toLowerCase()
  )

  let labelId
  if (existing) {
    labelId = existing.id
  } else {
    // Create the label
    const created = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: LABEL_NAME,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    })
    labelId = created.data.id
  }

  // Store the label ID
  await sql`
    UPDATE google_calendar_connections SET gmail_label_id = ${labelId}, gmail_enabled = TRUE
    WHERE user_id = ${userId}`

  return labelId
}

function decodeBase64Url(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

function extractPlainText(payload) {
  if (!payload) return ''

  // Single part message
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }

  // Multipart message
  if (payload.parts) {
    // Look for text/plain first
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data)
      }
    }
    // Recurse into nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const text = extractPlainText(part)
        if (text) return text
      }
    }
    // Fall back to HTML with tag stripping
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64Url(part.body.data)
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
      }
    }
  }

  return ''
}

function getHeader(headers, name) {
  const header = (headers || []).find((h) => h.name.toLowerCase() === name.toLowerCase())
  return header?.value || ''
}

export async function importEmailsAsTasks(userId) {
  // Ensure required columns exist
  try {
    await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS gmail_message_id TEXT`
    await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source TEXT`
  } catch {}

  const auth = await getAuthenticatedClient(userId)
  if (!auth) throw new Error('Not connected to Google')

  const gmail = google.gmail({ version: 'v1', auth })
  const labelId = await ensureGmailLabel(userId)

  // Fetch messages with the TaskList label
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    labelIds: [labelId],
    maxResults: 50,
  })

  const messages = listRes.data.messages || []
  if (!messages.length) {
    return { imported: 0, skipped: 0, total: 0 }
  }

  // Check which message IDs are already imported
  const { rows: existingRows } = await sql`
    SELECT gmail_message_id FROM tasks
    WHERE user_id = ${userId} AND gmail_message_id IS NOT NULL`
  const existingIds = new Set(existingRows.map((r) => r.gmail_message_id))

  // Fetch user's categories for AI categorization
  let categories = []
  try {
    const { rows: catRows } = await sql`
      SELECT c.id, c.name FROM categories c WHERE c.user_id = ${userId} ORDER BY c.position`
    for (const cat of catRows) {
      const { rows: subRows } = await sql`
        SELECT id, name FROM subcategories WHERE category_id = ${cat.id} ORDER BY position`
      categories.push({ ...cat, subcategories: subRows })
    }
  } catch {}

  const hasAI = !!process.env.ANTHROPIC_API_KEY

  let imported = 0
  let skipped = 0

  for (const msg of messages) {
    if (existingIds.has(msg.id)) {
      skipped++
      continue
    }

    try {
      // Fetch full message
      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      })

      const headers = fullMsg.data.payload?.headers || []
      const subject = getHeader(headers, 'Subject') || '(No subject)'
      const from = getHeader(headers, 'From')
      const date = getHeader(headers, 'Date')

      let body = extractPlainText(fullMsg.data.payload)
      if (body.length > 3000) body = body.slice(0, 3000) + '…'

      // AI analysis
      let taskName = subject.trim()
      let notes = [from ? `From: ${from}` : '', date ? `Date: ${date}` : '', '', body].filter(Boolean).join('\n').trim()
      let priority = 'medium'
      let dueDate = null
      let categoryId = null
      let subcategoryId = null

      if (hasAI) {
        const analysis = await analyzeEmail({ subject, from, date, body, categories })
        if (analysis) {
          taskName = analysis.task_name || taskName
          priority = analysis.priority || 'medium'
          dueDate = analysis.due_date || null

          // Build notes with AI summary
          const summaryLine = analysis.summary ? `Summary: ${analysis.summary}` : ''
          notes = [
            summaryLine,
            '',
            from ? `From: ${from}` : '',
            date ? `Date: ${date}` : '',
            '',
            body,
          ].filter((l) => l !== undefined).join('\n').trim()

          // Match category by name
          if (analysis.category_name) {
            const matchedCat = categories.find(
              (c) => c.name.toLowerCase() === analysis.category_name.toLowerCase()
            )
            if (matchedCat) {
              categoryId = matchedCat.id
              // Match subcategory
              if (analysis.subcategory_name && matchedCat.subcategories) {
                const matchedSub = matchedCat.subcategories.find(
                  (s) => s.name.toLowerCase() === analysis.subcategory_name.toLowerCase()
                )
                if (matchedSub) subcategoryId = matchedSub.id
              }
            }
          }
        }
      }

      await sql`
        INSERT INTO tasks (name, notes, status, priority, due_date, source, gmail_message_id, user_id, category_id, subcategory_id)
        VALUES (${taskName}, ${notes}, 'pending', ${priority}, ${dueDate}, 'gmail', ${msg.id}, ${userId}, ${categoryId}, ${subcategoryId})`

      imported++
    } catch (e) {
      console.error(`Failed to import message ${msg.id}:`, e.message)
    }
  }

  return { imported, skipped, total: messages.length }
}

export async function getGmailStatus(userId) {
  const { rows } = await sql`
    SELECT gmail_enabled, gmail_label_id, granted_scopes
    FROM google_calendar_connections
    WHERE user_id = ${userId}`

  if (!rows.length) return { connected: false, hasGmailScope: false, enabled: false }

  const conn = rows[0]
  const scopes = conn.granted_scopes || ''
  const hasGmailScope = scopes.includes('gmail')

  return {
    connected: true,
    hasGmailScope,
    enabled: !!conn.gmail_enabled,
    labelName: LABEL_NAME,
  }
}
