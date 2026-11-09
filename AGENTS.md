<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store gallery covers in `public/galeria` and select them through `src/lib/news-covers.ts` using stable URLs, so Cloudflare serves the same paths without hashed-asset manifest dependence.
- Use a shared news-feed component and pure classification helper before display filters: Top and Latest contain the complete synthesized set in original and chronological order respectively, while Hírfolyam contains non-synthesized stories, keeping all views consistent during live updates.
