# instructorhamid.github.io

Personal website of Hamid (@instructorhamid), Digital Marketing & Marketing Automation Strategist.

Live at https://instructorhamid.github.io

- `index.html` — homepage: hero, short intro, why me, process, featured work, tools, reviews and contact form
- `about.html` — full story, experience, education, certifications and services
- `portfolio.html` — every project, GoHighLevel build screenshots, earlier work and reviews
- `contact.html` — contact links, the inquiry form, next steps and common questions
- `assets/site.css` — shared stylesheet for all pages
- `assets/site.js` — shared script for all pages; each part only runs when its section is on the page
- `assets/` — portrait, tool logos and project screenshots

The header, mobile menu and footer are repeated in each HTML file. When you change a link there, change it in all four pages.

After editing `assets/site.css` or `assets/site.js`, bump the `?v=` number where each page links to them, so visitors' browsers load the new version.

The contact form has no backend: it prepares a WhatsApp message. To collect inquiries automatically, replace `sendInquiry()` in `assets/site.js` with a POST to a GoHighLevel, n8n or Zapier webhook.
