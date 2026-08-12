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
    <div class="comments-wrap">
      <div class="comments-head">
        <h3 class="comments-title">
          {count} responses to “{articleTitle}”
        </h3>
        <p class="comments-sub">Join the conversation. Be kind, be specific, be brave.</p>
      </div>

      <form class="comment-form" onSubmit={(e) => e.preventDefault()}>
        <img
          class="comment-avatar"
          src="https://images.pexels.com/photos/24017554/pexels-photo-24017554.jpeg?auto=compress&cs=tinysrgb&h=80&w=80"
          alt=""
          width="40"
          height="40"
        />
        <div class="comment-form-body">
          <textarea
            class="comment-input"
            placeholder="Add your thoughts…"
            aria-label="Add a comment"
            rows={3}
          />
          <div class="comment-form-actions">
            <span class="comment-hint">Comments are a preview for now.</span>
            <button type="submit" class="comment-submit">Post comment</button>
          </div>
        </div>
      </form>

      <ul class="comment-list">
        {FAKE_COMMENTS.map((c) => (
          <li class="comment-item">
            <img class="comment-avatar" src={c.avatar} alt="" width="40" height="40" />
            <div class="comment-body">
              <div class="comment-meta">
                <span class="comment-name">{c.name}</span>
                <span class="comment-time">{c.time}</span>
              </div>
              <p class="comment-text">{c.body}</p>
              <div class="comment-actions">
                <button class="comment-like" type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zM7 11l4-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.3 6A2 2 0 0 1 16.7 20H7" />
                  </svg>
                  {c.likes}
                </button>
                <button class="comment-reply" type="button">Reply</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
