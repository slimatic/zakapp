// Compiles src/donate.css to public/donate.css. Vite copies public/ verbatim,
// so the donation page needs its stylesheet built beside it rather than loaded
// from a CDN the production CSP blocks.
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");

const root = path.resolve(__dirname, "..");
const from = path.join(root, "src/donate.css");
const to = path.join(root, "public/donate.css");

postcss([tailwind()])
  .process(fs.readFileSync(from, "utf8"), { from, to })
  .then((r) => {
    if (!r.css.trim()) throw new Error("donate.css compiled to nothing");
    fs.writeFileSync(to, r.css);
    console.log("donate.css " + r.css.length + " bytes");
  })
  .catch((e) => { console.error(e); process.exit(1); });
