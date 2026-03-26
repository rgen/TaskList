import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function analyzeEmail({ subject, from, date, body, categories = [] }) {
  const categoryList = categories.length > 0
    ? categories.map((c) => {
        const subs = c.subcategories?.length
          ? ` (subcategories: ${c.subcategories.map((s) => s.name).join(', ')})`
          : ''
        return `- ${c.name}${subs}`
      }).join('\n')
    : 'No categories available'

  const today = new Date().toISOString().slice(0, 10)

  const prompt = `Analyze this email and extract task information. Today's date is ${today}.

EMAIL:
Subject: ${subject}
From: ${from}
Date: ${date}
Body:
${(body || '').slice(0, 2000)}

AVAILABLE CATEGORIES:
${categoryList}

Return a JSON object with these fields:
- "summary": A concise 1-2 sentence summary of what action is needed (this becomes the task notes). Do not repeat the subject.
- "task_name": A short, actionable task name derived from the email (max 80 chars). Make it action-oriented (e.g. "Review Q3 report" not "Q3 Report Email").
- "due_date": Best guess for when this should be done, in YYYY-MM-DD format. Look for deadlines, dates mentioned, or urgency cues. Use null if no date can be reasonably inferred.
- "priority": One of "high", "medium", or "low". Base on urgency words (ASAP, urgent, deadline = high), normal requests = medium, FYI/newsletters = low.
- "category_name": The best matching category from the list above, or null if none fit.
- "subcategory_name": The best matching subcategory within the chosen category, or null if none fit.

Return ONLY valid JSON, no markdown or explanation.`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0]?.text || '{}'
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    return {
      task_name: parsed.task_name || null,
      summary: parsed.summary || null,
      due_date: parsed.due_date || null,
      priority: ['high', 'medium', 'low'].includes(parsed.priority) ? parsed.priority : 'medium',
      category_name: parsed.category_name || null,
      subcategory_name: parsed.subcategory_name || null,
    }
  } catch (e) {
    console.error('AI analysis failed:', e.message)
    return null
  }
}
