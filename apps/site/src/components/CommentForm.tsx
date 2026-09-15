import { useSyncExternalStore } from "react";
import { $userStore } from "@clerk/astro/client";

function useNanostore<T>(store: { get: () => T; subscribe: (cb: () => void) => () => void }): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

// Assumes it's only ever delivered to a signed-in reader — that's enforced
// by the edge removing this island's markup entirely for anonymous readers
// (see the [data-mos-show="signed-in"] wrapper in [slug].astro), not by any
// check in here. See docs/mos-selectors.md for why the branching can't live
// inside a hydrated component.
export default function CommentForm() {
  const user = useNanostore($userStore);

  return (
    <form className="flex gap-3" onSubmit={(e) => e.preventDefault()}>
      <img
        className="size-10 shrink-0 rounded-full bg-bg-muted object-cover"
        src={user?.imageUrl}
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
  );
}
