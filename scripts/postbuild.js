import fs from "fs";
import path from "path";

const publicDir = path.resolve(".output/public");
const distDir = path.resolve("dist");
const assetsDir = path.join(publicDir, "assets");

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const jsFile =
    files.find((f) => f.startsWith("index-") && f.endsWith(".js")) ||
    files.find((f) => f.endsWith(".js"));
  const cssFile =
    files.find((f) => f.startsWith("styles-") && f.endsWith(".css")) ||
    files.find((f) => f.endsWith(".css"));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payent - Premium Tech Gear Rental Marketplace</title>
  <script>
    window.PAYENT_API_URL = window.PAYENT_API_URL || "";
  </script>
  ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}">` : ""}
</head>
<body class="bg-slate-950 text-slate-50 antialiased">
  <div id="root"></div>
  ${jsFile ? `<script type="module" src="/assets/${jsFile}"></script>` : ""}
</body>
</html>`;

  fs.writeFileSync(path.join(publicDir, "index.html"), html);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  fs.cpSync(publicDir, distDir, { recursive: true });
  console.log(
    `[Postbuild] Injected JS (${jsFile}) and CSS (${cssFile}) into index.html and copied to dist/`,
  );
}
