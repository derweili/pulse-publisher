import { createHmac } from 'node:crypto'

/**
 * Signs and sends the same shape `apps/site/src/lib/payload/webhookSignature.ts`
 * verifies and `resolveRevalidationTags.ts` consumes — see
 * docs/cache-revalidation.md. `type` values line up with that switch:
 * "article" | "liveBlog" | "section" | "author" purge a narrow tag set;
 * anything else (e.g. "siteSettings") falls through to purging everything,
 * which is what a nav/footer-wide document like site-settings needs anyway.
 */
export interface RevalidationPayload {
  type: string
  slug?: string | null
  sectionSlug?: string | null
  authorSlugs?: (string | null)[] | null
  tags?: (string | null)[] | null
}

function sign(body: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const mac = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('base64url')
  return `t=${timestamp},v1=${mac}`
}

export async function triggerRevalidate(payload: RevalidationPayload): Promise<void> {
  const url = process.env.REVALIDATE_URL
  const secret = process.env.REVALIDATE_WEBHOOK_SECRET
  if (!url || !secret) {
    console.warn('[revalidate] REVALIDATE_URL / REVALIDATE_WEBHOOK_SECRET not configured — skipping purge')
    return
  }

  const body = JSON.stringify(payload)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'webhook-signature': sign(body, secret),
      },
      body,
    })
    if (!res.ok) {
      console.error(`[revalidate] purge request failed: ${res.status} ${await res.text()}`)
    }
  } catch (err) {
    console.error('[revalidate] purge request threw', err)
  }
}
