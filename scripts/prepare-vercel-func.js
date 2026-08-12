import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, ".vercel", "output");
const targetFuncDir = path.join(outputDir, "functions", "api", "index.func");

if (!fs.existsSync(targetFuncDir)) {
  fs.mkdirSync(targetFuncDir, { recursive: true });
}

// 1. Copy api/index.py
fs.copyFileSync(
  path.join(rootDir, "api", "index.py"),
  path.join(targetFuncDir, "index.py")
);

// 2. Copy requirements.txt
if (fs.existsSync(path.join(rootDir, "requirements.txt"))) {
  fs.copyFileSync(
    path.join(rootDir, "requirements.txt"),
    path.join(targetFuncDir, "requirements.txt")
  );
}

// 3. Copy backend folder recursively
const copyDirSync = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__pycache__" && entry.name !== ".venv") {
        copyDirSync(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

copyDirSync(
  path.join(rootDir, "backend"),
  path.join(targetFuncDir, "backend")
);

// 4. Create .vc-config.json for Vercel Python runtime (without launcherType: Nodejs)
const vcConfig = {
  runtime: "python3.12",
  handler: "index.py"
};

fs.writeFileSync(
  path.join(targetFuncDir, ".vc-config.json"),
  JSON.stringify(vcConfig, null, 2)
);

// 5. Ensure .vercel/output/config.json exists with route mapping
const configPath = path.join(outputDir, "config.json");
const outputConfig = {
  version: 3,
  routes: [
    {
      src: "^/api(?:/(.*))$",
      dest: "/api/index"
    },
    {
      handle: "filesystem"
    },
    {
      src: "^(?:/(.*))$",
      dest: "/index.html"
    }
  ]
};

fs.writeFileSync(
  configPath,
  JSON.stringify(outputConfig, null, 2)
);

console.log("✓ Successfully prepared Vercel Python serverless function (python3.12 without launcherType) and config.json");
