import { FAKE_COMMENTS } from "../lib/fake-comments";

export default function CommentsList() {
  return (
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
  );
}
