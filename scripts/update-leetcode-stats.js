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

function buildDifficultyStats(data) {
  const solved = data.totalSolved ?? 0;
  const easy = data.easySolved ?? 0;
  const medium = data.mediumSolved ?? 0;
  const hard = data.hardSolved ?? 0;
  
  return [
    `| **${solved}** | **${easy}** | **${medium}** | **${hard}** |`,
    `|:--:|:--:|:--:|:--:|`,
    `| Solved | Easy | Medium | Hard |`,
  ].join("\n");
}

function buildRecentQuestions(data) {
  const submissions = Array.isArray(data.recentSubmissions)
    ? data.recentSubmissions
    : [];

  const seen = new Set();
  const questions = [];

  for (const submission of submissions) {
    if (!submission?.titleSlug || seen.has(submission.titleSlug)) {
      continue;
    }

    seen.add(submission.titleSlug);

    questions.push(
      `- [${submission.title}](https://leetcode.com/problems/${submission.titleSlug}/) \`${formatLanguage(
        submission.lang
      )}\``
    );

    if (questions.length === RECENT_COUNT) {
      break;
    }
  }

  return questions.length
    ? questions.join("\n")
    : "_No recent questions found._";
}

function buildLeetCodeBlock(data) {
  return [
    START_MARKER,
    "",
    buildDifficultyStats(data),
    "",
    "**Recent Questions**",
    "",
    buildRecentQuestions(data),
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

  const regex = new RegExp(
    `${START_MARKER}[\\s\\S]*?${END_MARKER}`
  );

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
