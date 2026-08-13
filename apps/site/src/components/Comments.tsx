import { useState } from "react";

interface Props {
  articleTitle: string;
}

const FAKE_COMMENTS = [
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

export default function Comments({ articleTitle }: Props) {
  const [count] = useState(FAKE_COMMENTS.length);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-xl">
          {count} responses to "{articleTitle}"
        </h3>
        <p className="mt-1.5 text-sm text-ink-3">Join the conversation. Be kind, be specific, be brave.</p>
      </div>

      <form className="flex gap-3 border-b border-border pb-8" onSubmit={(e) => e.preventDefault()}>
        <img
          className="size-10 shrink-0 rounded-full bg-bg-muted object-cover"
          src="https://images.pexels.com/photos/24017554/pexels-photo-24017554.jpeg?auto=compress&cs=tinysrgb&h=80&w=80"
          alt=""
          width="40"
          height="40"
        />
        <div className="flex flex-1 flex-col gap-2.5">
          <textarea
            className="w-full resize-none rounded-lg border border-border-strong px-3.5 py-3 text-sm text-ink placeholder:text-ink-4 focus:border-primary focus:outline-none"
            placeholder="Add your thoughts…"
            aria-label="Add a comment"
            rows={3}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink-4">Comments are a preview for now.</span>
            <button type="submit" className="rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors duration-200 ease-brand hover:bg-primary-dark">Post comment</button>
          </div>
        </div>
      </form>

      <ul className="flex flex-col gap-6">
        {FAKE_COMMENTS.map((c) => (
          <li className="flex gap-3" key={c.name}>
            <img className="size-10 shrink-0 rounded-full bg-bg-muted object-cover" src={c.avatar} alt="" width="40" height="40" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">{c.name}</span>
                <span className="text-xs text-ink-4">{c.time}</span>
              </div>
              <p className="text-sm leading-relaxed text-ink-2">{c.body}</p>
              <div className="mt-1 flex items-center gap-4">
                <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-4 transition-colors duration-200 hover:text-primary" type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zM7 11l4-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.3 6A2 2 0 0 1 16.7 20H7" />
                  </svg>
                  {c.likes}
                </button>
                <button className="text-xs font-semibold text-ink-4 transition-colors duration-200 hover:text-ink" type="button">Reply</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
