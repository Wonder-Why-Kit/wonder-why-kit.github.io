# Publishing worlds and companion videos

## Recommended structure

Use one repository and one static site for the collection, with a stable path per activity: `/helicopter-seeds/`, then future slugs. Keep those URLs stable because YouTube descriptions, QR codes and classroom links may use them for years. Redirect old URLs if a slug must change.

GitHub Pages is enough for this static project. Other hosting automation can publish the same `dist/` folder. No backend or build-time secrets are required.

## Brand and domain

The collection is **Wonder Why Kit**, with the tagline **Open. Play. Wonder.** and mission line **For every child who wonders.** Follow [brand and voice](BRAND.md) for page, packaging and video copy. The chosen domain is `wonderwhykit.org`; confirm registration before configuring it in hosting and DNS. Keep `/helicopter-seeds/` and future activity paths stable.

## GitHub Pages

1. Create the intended GitHub repository and push the reviewed source. The website repository is `Wonder-Why-Kit/wonder-why-kit.github.io`.
2. In repository Settings → Pages, select GitHub Actions as the source.
3. Run **Publish Pages** manually from Actions. It checks the project, builds `dist/`, uploads only that directory and deploys it.
4. Verify the collection homepage, activity, modules, stylesheet and video links at the real project URL.

Deployment runs on pushes to `main` and can also be triggered manually. CI already runs on pushes and pull requests. Configure the environment's approval rules if desired.

Official reference: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Before first public release

- Choose the repository owner/name and licence. Consider separate terms for code versus written/art assets; do not assume third-party material shares those terms.
- Review the exact files being committed. Raw media and Word documents are also excluded if added later. Commit `package-lock.json`; it records the formatter dependency.
- Run `npm ci`, `npm run check`, `npm run build`.
- Serve `dist/` and test Chromium, Firefox, Safari, keyboard-only use and a touch device. Inspect narrow screens, end-of-round messages, start/restart, paired drops, autoplay, zero breeze, sprouts on hills and collection by both chickens.
- Confirm no console errors, overflow, missing dependencies or broken relative URLs on the real hosting path.
- Review accessibility limits and performance on a lower-powered device. No full WCAG conformance claim is made.
- Add social preview art, favicon and canonical/OG URLs once domain ownership and the production hosting URL are confirmed. These are outstanding, not placeholder production URLs.
- Tag the reviewed release (for example `v0.1.0`) and record material changes in CHANGELOG.md.

## One or more YouTube videos per world

Store published video IDs and descriptive titles in the world's `videos` list in `worlds.json`. Multiple videos are supported; the build renders links on the page. Keep the list empty until an actual video exists.

For each video:

- Open with an engaging phenomenon, show a prediction and a comparison, then connect the result to the idea.
- Include the stable activity URL in the description and a clear invitation to play.
- Provide accurate captions and a text transcript; make visual changes understandable in narration.
- Record which release was filmed so later changes can be reconciled with the demonstration.
- Check rights for footage, music and identifiable people. Do not assume development reference footage is cleared for public release.
- Review audience settings against the platform's current requirements at upload time.

Avoid autoplay embeds by default. Ordinary links keep the activity focused and avoid loading a third-party player before the learner chooses to watch.

## Volunteer applications

The About page currently contains a non-submitting preview form. Connect a chosen submission service before enabling it; do not put service secrets in client-side code. Update privacy copy, add appropriate consent and retention details for the selected service, and verify successful delivery and failure feedback before removing the preview notice. `site/volunteer.js` currently prevents all submissions.
