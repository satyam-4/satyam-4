const fs = require("fs");

const USERNAME = "satyam-4";
const API_URL = `https://leetcode-api-faisalshohag.vercel.app/${USERNAME}`;
const README_PATH = "README.md";
const START_MARKER = "<!--LEETCODE:START-->";
const END_MARKER = "<!--LEETCODE:END-->";
const RECENT_COUNT = 5;

const LANGUAGE_LABELS = {
  cpp: "C++",
  c: "C",
  java: "Java",
  python: "Python",
  python3: "Python3",
  javascript: "JavaScript",
  typescript: "TypeScript",
  csharp: "C#",
  golang: "Go",
  ruby: "Ruby",
  swift: "Swift",
  kotlin: "Kotlin",
  rust: "Rust",
  scala: "Scala",
  php: "PHP",
  mysql: "MySQL",
  bash: "Bash",
};

function formatLanguage(lang) {
  if (!lang) return "Unknown";
  return LANGUAGE_LABELS[lang] || lang;
}

function buildStatsTable(data) {
  const solved = data.totalSolved ?? 0;
  const easy = data.easySolved ?? 0;
  const medium = data.mediumSolved ?? 0;
  const hard = data.hardSolved ?? 0;

  const allSubs = Array.isArray(data.totalSubmissions)
    ? data.totalSubmissions.find((s) => s.difficulty === "All")
    : null;
  const submissions = allSubs?.submissions ?? 0;

  return [
    `| Solved | Easy | Medium | Hard | Submissions |`,
    `|:---:|:---:|:---:|:---:|:---:|`,
    `| **${solved}** | **${easy}** | **${medium}** | **${hard}** | **${submissions}** |`,
  ].join("\n");
}

function buildRecentList(data) {
  const recentRaw = Array.isArray(data.recentSubmissions) ? data.recentSubmissions : [];

  const seen = new Set();
  const unique = [];
  for (const sub of recentRaw) {
    if (!sub?.titleSlug || seen.has(sub.titleSlug)) continue;
    seen.add(sub.titleSlug);
    unique.push(sub);
    if (unique.length === RECENT_COUNT) break;
  }

  if (unique.length === 0) {
    return "_No recent submissions found._";
  }

  return unique
    .map(
      (sub) =>
        `- [${sub.title}](https://leetcode.com/problems/${sub.titleSlug}/) · ${formatLanguage(sub.lang)}`
    )
    .join("\n");
}

async function main() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`LeetCode stats API request failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  const block = [
    START_MARKER,
    buildStatsTable(data),
    "",
    "<hr>",
    "",
    "**Recent Problems**",
    "",
    buildRecentList(data),
    "",
    "<hr>",
    END_MARKER,
  ].join("\n");

  const readme = fs.readFileSync(README_PATH, "utf8");
  const regex = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`);

  if (!regex.test(readme)) {
    throw new Error(
      `Could not find ${START_MARKER} ... ${END_MARKER} markers in ${README_PATH}. ` +
        "Make sure they exist exactly once, unmodified."
    );
  }

  const updated = readme.replace(regex, block);

  if (updated !== readme) {
    fs.writeFileSync(README_PATH, updated);
    console.log("README.md updated with the latest LeetCode stats.");
  } else {
    console.log("Stats are unchanged — nothing to commit.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});