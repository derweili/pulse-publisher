import {defineArrayMember, defineType} from 'sanity'

/**
 * Article body: Portable Text. The native `block` type covers paragraphs,
 * headings and quotes via `styles`, plus bullet/numbered lists — replacing
 * the old paragraph/heading/quote/list block types from the mock data with
 * one richer primitive (and adding inline bold/italic/link marks, which the
 * previous plain-string model had no way to express). `imageBlock` and
 * `videoEmbed` cover what Portable Text doesn't natively do.
 */
export const blockContent = defineType({
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading', value: 'h2'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bulleted list', value: 'bullet'},
        {title: 'Numbered list', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            icon: () => '🔗',
            fields: [
              {
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (Rule) =>
                  Rule.required().uri({scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true}),
              },
              {
                name: 'newTab',
                title: 'Open in new tab',
                type: 'boolean',
                initialValue: false,
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({type: 'imageBlock'}),
    defineArrayMember({type: 'videoEmbed'}),
  ],
})
