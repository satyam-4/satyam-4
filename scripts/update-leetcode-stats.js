const fs = require("fs");

const LEETCODE_USERNAME = process.env.LEETCODE_USERNAME || "satyam-4";
const API_URL = `https://leetcode-api-faisalshohag.vercel.app/${LEETCODE_USERNAME}`;

const WIDTH = 985;
const LINE_HEIGHT = 22;
const COL_X = 25;
const RECENT_COUNT = 8;
const MAX_TITLE_LEN = 68;

const DIFF_COLORS = {
  solved: "#4cc9f0",
  easy: "#3fb950",
  medium: "#ffb703",
  hard: "#f85149",
};

const FONT_FAMILY =
  "ConsolasFallback,Cascadia Code,Fira Code,ui-monospace," +
  "DejaVu Sans Mono,Liberation Mono,Consolas,Menlo,monospace";

const FONT_FACE_SRC =
  "local('Cascadia Code'), local('Fira Code'), local('DejaVu Sans Mono'), " +
  "local('Liberation Mono'), local('Consolas'), local('Menlo')";

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function truncate(text, maxLen = MAX_TITLE_LEN) {
  const str = String(text);
  if (str.length > maxLen) {
    return str.slice(0, maxLen - 3) + "...";
  }
  return str;
}

async function fetchLeetCodeStats() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(
      `LeetCode stats API request failed: ${res.status} ${res.statusText}`
    );
  }
  return await res.json();
}

function generateLeetCodeSvg(data, outputPath = "leetcode_stats.svg") {
  const solved = data.totalSolved ?? 0;
  const easy = data.easySolved ?? 0;
  const medium = data.mediumSolved ?? 0;
  const hard = data.hardSolved ?? 0;

  const submissions = Array.isArray(data.recentSubmissions)
    ? data.recentSubmissions
    : [];

  const seen = new Set();
  const rows = [];

  for (const sub of submissions) {
    const slug = sub?.titleSlug;
    if (!slug || seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    rows.push({
      title: sub.title || slug,
      lang: sub.lang || "",
    });
    if (rows.length === RECENT_COUNT) {
      break;
    }
  }

  const header_y = 30;
  const stats_y = 58;
  const divider_y = 78;
  const first_row_y = 106;
  const height = first_row_y + Math.max(rows.length, 1) * LINE_HEIGHT + 18;

  const svg = [];
  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" font-family="${FONT_FAMILY}" font-size="14px">`
  );
  svg.push("<style>");
  svg.push("@font-face {");
  svg.push(`  src: ${FONT_FACE_SRC};`);
  svg.push("  font-family: 'ConsolasFallback';");
  svg.push("  font-display: swap;");
  svg.push("}");
  svg.push("text, tspan { white-space: pre; }");
  svg.push("</style>");
  svg.push(`<rect width="${WIDTH}" height="${height}" fill="#0b0e1a" rx="15"/>`);
  svg.push("");

  const dashes = "\u2500".repeat(68);
  svg.push(
    `<text x="${COL_X}" y="${header_y}" fill="#d8d9f0" font-size="14px">` +
      `leetcode-stats` +
      `<tspan fill="#565a7a">@</tspan>` +
      `<tspan fill="#f72585">${esc(LEETCODE_USERNAME)}</tspan>` +
      `<tspan fill="#23263a"> ${dashes}</tspan>` +
      `</text>`
  );
  svg.push("");

  const statDefs = [
    ["Solved", solved, DIFF_COLORS.solved],
    ["Easy", easy, DIFF_COLORS.easy],
    ["Medium", medium, DIFF_COLORS.medium],
    ["Hard", hard, DIFF_COLORS.hard],
  ];

  const colWidth = Math.floor((WIDTH - 2 * COL_X) / statDefs.length);
  const statSpans = [];

  for (let i = 0; i < statDefs.length; i++) {
    const [label, value, color] = statDefs[i];
    const x = COL_X + i * colWidth;
    statSpans.push(
      `<tspan x="${x}" fill="${color}">${esc(label)}: ${value}</tspan>`
    );
  }

  svg.push(`<text y="${stats_y}" font-size="15px">${statSpans.join("")}</text>`);
  svg.push("");

  const subDashes = "\u2500".repeat(68);
  svg.push(
    `<text x="${COL_X}" y="${divider_y}">` +
      `<tspan fill="#565a7a">- </tspan><tspan fill="#d8d9f0">Recent Submissions</tspan>` +
      `<tspan fill="#23263a"> ${subDashes}</tspan></text>`
  );
  svg.push("");

  if (rows.length > 0) {
    rows.forEach((row, i) => {
      const y = first_row_y + i * LINE_HEIGHT;
      const num = String(i + 1).padStart(2, " ") + ".";
      svg.push(
        `<text y="${y}">` +
          `<tspan x="${COL_X}" fill="#3d4159">${num}</tspan>` +
          `<tspan x="${COL_X + 35}" fill="#7dd3fc">${esc(truncate(row.title))}</tspan>` +
          `<tspan x="${WIDTH - 140}" fill="#9d4edd">${esc(row.lang)}</tspan>` +
          `</text>`
      );
    });
  } else {
    svg.push(
      `<text x="${COL_X}" y="${first_row_y}" fill="#565a7a">` +
        `No recent submissions found.</text>`
    );
  }

  svg.push("</svg>");

  fs.writeFileSync(outputPath, svg.join("\n"), "utf8");
  console.log(`LeetCode SVG written to ${outputPath}`);
}

async function main() {
  const stats = await fetchLeetCodeStats();
  generateLeetCodeSvg(stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
