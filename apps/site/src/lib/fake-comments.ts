// Placeholder comment data until real comments land. Shared between the
// static intro (needs the count, rendered directly in [slug].astro) and
// CommentsList.tsx (renders the list) so there's a single source of truth.
export interface FakeComment {
  name: string;
  avatar: string;
  time: string;
  body: string;
  likes: number;
}

export const FAKE_COMMENTS: FakeComment[] = [
  {
    name: "Alex M.",
    avatar: "https://images.pexels.com/photos/325865/pexels-photo-325865.jpeg?auto=compress&cs=tinysrgb&h=80&w=80",
    time: "2 hours ago",
    body: "This is the clearest take I've read on this all week. The bit about the interface being the ideology is going to stick with me.",
    likes: 24,
  },
  {
    name: "Jordan T.",
    avatar: "https://images.pexels.com/photos/1054048/pexels-photo-1054048.jpeg?auto=compress&cs=tinysrgb&h=80&w=80",
    time: "1 hour ago",
    body: "Not sure I agree with the second point. The unit of loyalty growing assumes people actually want loyalty anymore — feels like the opposite is true.",
    likes: 8,
  },
  {
    name: "Sam K.",
    avatar: "https://images.pexels.com/photos/8727669/pexels-photo-8727669.jpeg?auto=compress&cs=tinysrgb&h=80&w=80",
    time: "35 minutes ago",
    body: "Brilliant framing. Writing more like this, please.",
    likes: 3,
  },
];
