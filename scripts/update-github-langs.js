const fs = require("fs");

const USERNAME = "satyam-4";
const WIDTH = 985;
const HEIGHT = 140;
const COL_X = 25;

const LANG_COLORS = {
  JavaScript: "#f7df1e",
  TypeScript: "#3178c6",
  "C++": "#00599C",
  C: "#A8B9CC",
  Java: "#ED8B00",
  HTML: "#e34c26",
  CSS: "#1572B6",
  Python: "#3776AB",
  Vue: "#4FC08D",
};
const DEFAULT_COLOR = "#4cc9f0";

const FONT_FAMILY =
  "ConsolasFallback,Cascadia Code,Fira Code,ui-monospace,DejaVu Sans Mono,Liberation Mono,Consolas,Menlo,monospace";

async function fetchLanguageStats() {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    "User-Agent": "NodeJS-Script",
    ...(token && { Authorization: `token ${token}` }),
  };

  const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`, { headers });
  if (!res.ok) throw new Error(`GitHub API Error: ${res.statusText}`);

  const repos = await res.json();
  const langTotals = {};

  for (const repo of repos) {
    if (repo.fork || !repo.languages_url) continue;
    const lRes = await fetch(repo.languages_url, { headers });
    if (!lRes.ok) continue;

    const languages = await lRes.json();
    for (const [lang, bytes] of Object.entries(languages)) {
      langTotals[lang] = (langTotals[lang] || 0) + bytes;
    }
  }

  return langTotals;
}

function generateSvg(langTotals, outputPath = "languages_stats.svg") {
  const totalBytes = Object.values(langTotals).reduce((a, b) => a + b, 0);
  if (totalBytes === 0) return;

  const sortedLangs = Object.entries(langTotals)
    .map(([lang, bytes]) => ({
      lang,
      bytes,
      percent: parseFloat(((bytes / totalBytes) * 100).toFixed(1)),
      color: LANG_COLORS[lang] || DEFAULT_COLOR,
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 5);

  const svg = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" font-family="${FONT_FAMILY}" font-size="14px">`);
  svg.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="#0b0e1a" rx="15"/>`);

  const dashes = "\u2500".repeat(68);
  svg.push(
    `<text x="${COL_X}" y="30" fill="#d8d9f0" font-size="14px">` +
      `top-languages<tspan fill="#565a7a">@</tspan><tspan fill="#f72585">${USERNAME}</tspan>` +
      `<tspan fill="#23263a"> ${dashes}</tspan></text>`
  );

  const barX = COL_X;
  const barY = 50;
  const barWidth = WIDTH - 2 * COL_X;
  const barHeight = 12;

  let currentX = barX;
  sortedLangs.forEach((item, index) => {
    const segmentWidth = (item.percent / 100) * barWidth;
    const rx = index === 0 ? "rx='6'" : "";
    svg.push(`<rect x="${currentX}" y="${barY}" width="${segmentWidth}" height="${barHeight}" fill="${item.color}" ${rx}/>`);
    currentX += segmentWidth;
  });

  const legendY = 98;
  const colWidth = Math.floor(barWidth / sortedLangs.length);
  const legendSpans = sortedLangs.map((item, i) => {
    const x = COL_X + i * colWidth;
    return (
      `<tspan x="${x}" fill="${item.color}">● </tspan>` +
      `<tspan fill="#d8d9f0">${item.lang} </tspan>` +
      `<tspan fill="#565a7a">${item.percent}%</tspan>`
    );
  });

  svg.push(`<text y="${legendY}" font-size="13px">${legendSpans.join("")}</text>`);
  svg.push("</svg>");

  fs.writeFileSync(outputPath, svg.join("\n"), "utf8");
  console.log(`Languages SVG written to ${outputPath}`);
}

async function main() {
  const stats = await fetchLanguageStats();
  generateSvg(stats);
}

main().catch(console.error);