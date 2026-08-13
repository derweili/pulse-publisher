export const sectionPath = (slug: string) => `/sections/${slug}`;
export const articlePath = (slug: string) => `/articles/${slug}`;
export const authorPath = (slug: string) => `/authors/${slug}`;
export const tagPath = (tag: string) => `/tags/${encodeURIComponent(tag)}`;
export const liveBlogPath = (slug: string) => `/live/${slug}`;
