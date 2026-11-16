import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
const root = process.cwd();
const domainCode = ts.transpileModule(
  fs.readFileSync(path.join(root, "src/domain.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const domainURL =
  "data:text/javascript;base64," + Buffer.from(domainCode).toString("base64");
const code = ts
  .transpileModule(fs.readFileSync(path.join(root, "src/data.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  })
  .outputText.replace(
    /from ["']\.\/domain["']/g,
    "from " + JSON.stringify(domainURL),
  );
const data = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
const photos = {},
  vectors = {},
  iconSvgs = {};
for (const name of [
  "oats.jpg",
  "yogurt.jpg",
  "bowl.jpg",
  "toast.jpg",
  "salmon.jpg",
])
  photos[name] = fs
    .readFileSync(path.join(root, "public/assets", name))
    .toString("base64");
for (const name of [
  "squat.svg",
  "deadlift.svg",
  "bridge.svg",
  "press.svg",
  "plank.svg",
  "row.svg",
  "logo.svg",
])
  vectors[name] = fs.readFileSync(
    path.join(root, "public/assets", name),
    "utf8",
  );
for (const name of [
  "Leaf",
  "ArrowLeft",
  "ArrowRight",
  "ChevronRight",
  "Eye",
  "Mail",
  "LockKeyhole",
  "Utensils",
  "Dumbbell",
  "Users",
  "BookOpen",
  "Plus",
  "Check",
  "Clock",
  "Flame",
  "Play",
  "PenLine",
  "ImagePlus",
  "Link",
  "Send",
  "Trash2",
  "Search",
  "X",
  "Lightbulb",
  "Sprout",
  "ExternalLink",
])
  iconSvgs[name] = renderToStaticMarkup(
    createElement(icons[name], {
      size: 24,
      color: "#3F4A24",
      strokeWidth: 1.7,
    }),
  );
const prelude = `const FITCOACH_DATA=${JSON.stringify({ clients: data.initialData.clients, exercises: data.initialData.exercises, meals: data.meals, days: data.DAYS, fullDays: data.FULL_DAYS, mealTypes: data.MEAL_TYPES })};\nconst FITCOACH_PHOTOS=${JSON.stringify(photos)};\nconst FITCOACH_VECTORS=${JSON.stringify(vectors)};\nconst FITCOACH_ICONS=${JSON.stringify(iconSvgs)};\n`;
const out = path.join(root, "design/figma-plugin");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, "code.js"),
  prelude +
    fs.readFileSync(path.join(root, "design/generator-core.js"), "utf8"),
);
fs.writeFileSync(
  path.join(out, "manifest.template.json"),
  JSON.stringify(
    {
      name: "FitCoach · Diseño y prototipo",
      api: "1.0.0",
      main: "code.js",
      editorType: ["figma"],
      documentAccess: "dynamic-page",
      networkAccess: { allowedDomains: ["none"] },
    },
    null,
    2,
  ),
);
fs.copyFileSync(
  path.join(root, "design/FIGMA-LEEME.md"),
  path.join(out, "LEEME.md"),
);
console.log("Figma generator built. No network access required.");
