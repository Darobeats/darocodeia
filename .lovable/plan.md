

## Feature: Embed External Sites via URL Path

The user wants a page at a route like `/view/https://example.com` where users can enter a URL and view it embedded (via iframe) within the DaroCode site, keeping the site's navbar/branding visible.

### Important Limitation

Many websites block being embedded in iframes via `X-Frame-Options` or `Content-Security-Policy` headers. Sites like Google, Facebook, YouTube, etc. will refuse to load. This is a browser security restriction that cannot be bypassed from the frontend. The feature will work only with sites that allow iframe embedding.

### Plan

1. **Create `EmbedViewer` page** (`src/pages/EmbedViewer.tsx`)
   - Uses a wildcard route param to capture the full URL from the path
   - Displays a top bar with: the current URL (editable input), a "Go" button, and a "Copy share link" button
   - Renders the target URL in a full-height `<iframe>` below
   - Shows an error state if the iframe fails to load (via `onError`)
   - Input validation: only allow `http://` and `https://` URLs

2. **Add route to `App.tsx`**
   - Add route: `<Route path="/view/*" element={<EmbedViewer />} />`
   - The wildcard captures everything after `/view/` as the target URL

3. **Add a landing state** when no URL is provided (`/view`)
   - Shows a centered input field where users can paste a URL and click "Open"
   - On submit, navigates to `/view/{url}`

### Flow
- User visits `darocodeia.com/view` → sees input to enter URL
- User enters `https://example.com` → navigates to `darocodeia.com/view/https://example.com`
- Page shows the site's header bar + iframe with the external content
- The share link `darocodeia.com/view/https://example.com` can be shared with others

