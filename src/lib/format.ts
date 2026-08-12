export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const PER_PAGE = 8;

export function paginate<T>(items: T[], page: number, perPage = PER_PAGE) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: safePage,
    pages,
    total,
    perPage,
  };
}
