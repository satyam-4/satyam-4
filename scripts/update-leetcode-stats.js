const fs = require("fs");

const USERNAME = "satyam-4";
const API_URL = `https://leetcode-api-faisalshohag.vercel.app/${USERNAME}`;
const README_PATH = "README.md";
const START_MARKER = "<!--LEETCODE:START-->";
const END_MARKER = "<!--LEETCODE:END-->";

async function main() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`LeetCode stats API request failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  const solved = data.totalSolved ?? 0;
  const easy = data.easySolved ?? 0;
  const medium = data.mediumSolved ?? 0;
  const hard = data.hardSolved ?? 0;

  const allSubs = Array.isArray(data.totalSubmissions)
    ? data.totalSubmissions.find((s) => s.difficulty === "All")
    : null;
  const submissions = allSubs?.submissions ?? 0;

  const table = [
    `| **${solved}** | **${easy}** | **${medium}** | **${hard}** | **${submissions}** |`,
    `|:---:|:---:|:---:|:---:|:---:|`,
    `| Solved | Easy | Medium | Hard | Submissions |`,
  ].join("\n");

  const block = `${START_MARKER}\n${table}\n${END_MARKER}`;

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