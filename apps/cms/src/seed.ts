/**
 * One-off content seed: writes the demo content in ./seed-data.ts into
 * Payload as real documents (uploading each image to Media in the
 * process). Idempotent — safe to re-run; looks up existing docs by slug/id
 * rather than blindly inserting.
 *
 * Usage: npm run seed   (from apps/cms; requires DATABASE_URI etc. set)
 */
import { getPayload, type Payload } from 'payload'
import config from './payload.config'
import { articles, authors, sections, type SeedArticle, type SeedBlock } from './seed-data'

async function uploadImage(payload: Payload, url: string, filename: string, alt: string): Promise<number | string> {
  // Pexels (the source of every seed image) 403s requests with no
  // browser-like User-Agent.
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; pulse-cms-seed/1.0)" } })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  const data = Buffer.from(await res.arrayBuffer())

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length > 0) return existing.docs[0].id

  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: { data, mimetype: 'image/jpeg', name: filename, size: data.byteLength },
    overrideAccess: true,
  })
  return doc.id
}

function textNode(text: string, format = 0) {
  return { type: 'text', text, format, detail: 0, mode: 'normal', style: '', version: 1 }
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function heading(text: string) {
  return {
    type: 'heading',
    tag: 'h2',
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function blockquote(text: string) {
  return {
    type: 'quote',
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function bulletList(items: string[]) {
  return {
    type: 'list',
    tag: 'ul',
    listType: 'bullet',
    start: 1,
    children: items.map((item, i) => ({
      type: 'listitem',
      value: i + 1,
      children: [textNode(item)],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    })),
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function imageBlockNode(imageId: number | string, caption?: string) {
  return {
    type: 'block',
    format: '',
    version: 2,
    fields: {
      id: crypto.randomUUID(),
      blockType: 'imageBlock',
      image: imageId,
      caption: caption ?? null,
    },
  }
}

async function blocksToLexical(payload: Payload, blocks: SeedBlock[], slugPrefix: string) {
  const children: unknown[] = []
  let imageIndex = 0
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        children.push(paragraph(block.text ?? ''))
        break
      case 'heading':
        children.push(heading(block.text ?? ''))
        break
      case 'quote':
        children.push(blockquote(block.text ?? ''))
        break
      case 'list':
        children.push(bulletList(block.items ?? []))
        break
      case 'image': {
        if (!block.src) break
        imageIndex += 1
        const imageId = await uploadImage(payload, block.src, `${slugPrefix}-body-${imageIndex}.jpg`, block.alt ?? '')
        children.push(imageBlockNode(imageId, block.caption))
        break
      }
      case 'video':
        if (!block.embedUrl) break
        children.push({
          type: 'block',
          format: '',
          version: 2,
          fields: { id: crypto.randomUUID(), blockType: 'videoEmbed', url: block.embedUrl },
        })
        break
    }
  }
  return { root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } }
}

async function findIdBySlug(payload: Payload, collection: 'sections' | 'authors' | 'articles', slug: string) {
  const res = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
  return res.docs[0]?.id
}

async function seedSections(payload: Payload) {
  console.log(`\nSections (${sections.length})`)
  for (const [index, section] of sections.entries()) {
    const existingId = await findIdBySlug(payload, 'sections', section.slug)
    const data = {
      title: section.name,
      slug: section.slug,
      tagline: section.tagline,
      accentColor: section.accent,
      order: index,
    }
    if (existingId) {
      await payload.update({ collection: 'sections', id: existingId, data, overrideAccess: true })
    } else {
      await payload.create({ collection: 'sections', data, overrideAccess: true })
    }
    console.log(`  - ${section.slug}`)
  }
}

async function seedAuthors(payload: Payload) {
  console.log(`\nAuthors (${authors.length})`)
  for (const author of authors) {
    const avatarId = await uploadImage(payload, author.avatar, `${author.slug}-avatar.jpg`, author.name)
    const existingId = await findIdBySlug(payload, 'authors', author.slug)
    const data = {
      name: author.name,
      slug: author.slug,
      role: author.role,
      bio: author.bio,
      avatar: avatarId,
      twitter: author.twitter,
    }
    if (existingId) {
      await payload.update({ collection: 'authors', id: existingId, data, overrideAccess: true })
    } else {
      await payload.create({ collection: 'authors', data, overrideAccess: true })
    }
    console.log(`  - ${author.slug}`)
  }
}

async function seedArticle(payload: Payload, article: SeedArticle) {
  const heroId = await uploadImage(payload, article.hero, `${article.slug}-hero.jpg`, article.heroAlt)
  const body = await blocksToLexical(payload, article.blocks, article.slug)
  const sectionId = await findIdBySlug(payload, 'sections', article.section)
  const authorIds = await Promise.all(article.authors.map((slug) => findIdBySlug(payload, 'authors', slug)))

  const data = {
    title: article.title,
    slug: article.slug,
    dek: article.dek,
    section: sectionId,
    authors: authorIds,
    hero: heroId,
    body,
    publishedAt: new Date(article.date).toISOString(),
    readTime: article.readTime,
    tags: article.tags,
    premium: article.premium ?? false,
    featured: article.featured ?? false,
    _status: 'published' as const,
  }

  const existingId = await findIdBySlug(payload, 'articles', article.slug)
  if (existingId) {
    await payload.update({ collection: 'articles', id: existingId, data, overrideAccess: true })
  } else {
    await payload.create({ collection: 'articles', data, overrideAccess: true })
  }
  console.log(`  - ${article.slug}`)
}

async function seedSiteSettings(payload: Payload) {
  console.log('\nSite settings')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      title: 'PULSE',
      tagline: 'Modern news, bold takes. Built for people who\'d rather think than scroll.',
      defaultSeo: {
        metaTitle: 'PULSE — Modern news, bold takes.',
        metaDescription:
          'PULSE is a young, bold publisher covering tech, culture, science, sports and business.',
      },
      mainNav: [{ label: 'Subscribe', linkType: 'external', externalUrl: '/subscription' }],
      footerLinkGroups: [
        {
          heading: 'Company',
          links: [
            { label: 'About', linkType: 'external', externalUrl: '/about' },
            { label: 'Contact', linkType: 'external', externalUrl: '/contact' },
            { label: 'Subscribe', linkType: 'external', externalUrl: '/subscription' },
          ],
        },
        {
          heading: 'Legal',
          links: [
            { label: 'Privacy', linkType: 'external', externalUrl: '/privacy' },
            { label: 'Terms', linkType: 'external', externalUrl: '/terms' },
          ],
        },
      ],
      socialLinks: [],
    },
    overrideAccess: true,
  })
  console.log('  - site-settings')
}

async function main() {
  const payload = await getPayload({ config })
  await seedSections(payload)
  await seedAuthors(payload)
  console.log(`\nArticles (${articles.length})`)
  for (const article of articles) {
    await seedArticle(payload, article)
  }
  await seedSiteSettings(payload)
  console.log('\nSeed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
