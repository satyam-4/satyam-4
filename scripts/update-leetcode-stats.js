const fs = require("fs");

const USERNAME = "satyam-4";
const API_URL = `https://leetcode-api-faisalshohag.vercel.app/${USERNAME}`;
const README_PATH = "README.md";

const START_MARKER = "<!--LEETCODE:START-->";
const END_MARKER = "<!--LEETCODE:END-->";

const RECENT_COUNT = 5;

const LANGUAGE_META = {
  cpp: { label: "C++", color: "00599C", logo: "cplusplus" },
  c: { label: "C", color: "A8B9CC", logo: "c" },
  java: { label: "Java", color: "E76F00", logo: "openjdk", logoColor: "white" },
  python: { label: "Python", color: "3776AB", logo: "python" },
  python3: { label: "Python3", color: "3776AB", logo: "python" },
  javascript: { label: "JavaScript", color: "F7DF1E", logo: "javascript", logoColor: "black" },
  typescript: { label: "TypeScript", color: "3178C6", logo: "typescript" },
  csharp: { label: "C#", color: "239120", logo: "csharp" },
  golang: { label: "Go", color: "00ADD8", logo: "go" },
  ruby: { label: "Ruby", color: "CC342D", logo: "ruby" },
  swift: { label: "Swift", color: "FA7343", logo: "swift" },
  kotlin: { label: "Kotlin", color: "7F52FF", logo: "kotlin" },
  rust: { label: "Rust", color: "000000", logo: "rust" },
  scala: { label: "Scala", color: "DC322F", logo: "scala" },
  php: { label: "PHP", color: "777BB4", logo: "php" },
  mysql: { label: "MySQL", color: "4479A1", logo: "mysql" },
  bash: { label: "Bash", color: "4EAA25", logo: "gnubash" },
};

function formatLanguage(lang) {
  if (!lang) return "Unknown";
  return LANGUAGE_META[lang]?.label || lang;
}

function languageBadge(lang) {
  const meta = LANGUAGE_META[lang];
  const label = formatLanguage(lang);

  if (!meta) {
    const url = `https://img.shields.io/badge/-${encodeURIComponent(
      label
    )}-30363d?style=flat-square`;
    return `<img src="${url}" alt="${label}" />`;
  }

  const logoColor = meta.logoColor || "white";
  const url = `https://img.shields.io/badge/-${encodeURIComponent(
    label
  )}-${meta.color}?style=flat-square&logo=${meta.logo}&logoColor=${logoColor}`;
  return `<img src="${url}" alt="${label}" />`;
}

function statCell(label, value, color) {
  const url = `https://img.shields.io/badge/-${encodeURIComponent(
    `${label} ${value}`
  )}-${color}?style=for-the-badge&labelColor=${color}`;
  return `<td align="center" width="25%"><img src="${url}" alt="${label}: ${value}" width="100%" /></td>`;
}

function buildDifficultyStats(data) {
  const solved = data.totalSolved ?? 0;
  const easy = data.easySolved ?? 0;
  const medium = data.mediumSolved ?? 0;
  const hard = data.hardSolved ?? 0;

  return [
    '<table width="100%">',
    "<tr>",
    statCell("Solved", solved, "8957e5"),
    statCell("Easy", easy, "00b8a3"),
    statCell("Medium", medium, "ffb700"),
    statCell("Hard", hard, "ef4763"),
    "</tr>",
    "</table>",
  ].join("\n");
}

function buildRecentQuestions(data) {
  const submissions = Array.isArray(data.recentSubmissions)
    ? data.recentSubmissions
    : [];

  const seen = new Set();
  const rows = [];

  for (const submission of submissions) {
    if (!submission?.titleSlug || seen.has(submission.titleSlug)) {
      continue;
    }

    seen.add(submission.titleSlug);

    const url = `https://leetcode.com/problems/${submission.titleSlug}/`;
    rows.push(
      `<tr><td><a href="${url}">${submission.title}</a></td><td align="center">${languageBadge(
        submission.lang
      )}</td></tr>`
    );

    if (rows.length === RECENT_COUNT) {
      break;
    }
  }

  if (!rows.length) {
    return "_No recent questions found._";
  }

  return [
    '<table width="100%">',
    '<tr><th align="left" width="70%">Problem</th><th align="center" width="30%">Language</th></tr>',
    ...rows,
    "</table>",
  ].join("\n");
}

function buildProfileLink() {
  const url = `https://leetcode.com/u/${USERNAME}/`;
  const badge = `https://img.shields.io/badge/-View%20Full%20Profile-FFA116?style=for-the-badge&logo=leetcode&logoColor=black`;
  return `<p align="center"><a href="${url}" target="_blank"><img src="${badge}" alt="View LeetCode Profile" /></a></p>`;
}

function buildLeetCodeBlock(data) {
  return [
    START_MARKER,
    "",
    buildDifficultyStats(data),
    "",
    "<sub><b>Recent submissions</b></sub>",
    "",
    buildRecentQuestions(data),
    "",
    buildProfileLink(),
    "",
    END_MARKER,
  ].join("\n");
}

async function main() {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error(
      `LeetCode stats API request failed: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();

  const block = buildLeetCodeBlock(data);

  const readme = fs.readFileSync(README_PATH, "utf8");

  const regex = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`);

  if (!regex.test(readme)) {
    throw new Error(
      `Could not find ${START_MARKER} ... ${END_MARKER} in ${README_PATH}.`
    );
  }

  const updated = readme.replace(regex, block);

  if (updated !== readme) {
    fs.writeFileSync(README_PATH, updated);
    console.log("README.md updated with the latest LeetCode data.");
  } else {
    console.log("LeetCode data is unchanged, nothing to commit.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
