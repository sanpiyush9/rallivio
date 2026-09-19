import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
const crons = Array.isArray(config.crons) ? config.crons : [];

const DAILY_CRON = /^(?:\d{1,2}|\*)\s+\d{1,2}\s+\*\s+\*\s+\*$/;

for (const cron of crons) {
  if (!cron || typeof cron.path !== "string" || typeof cron.schedule !== "string") {
    throw new Error("Invalid Vercel cron entry: every cron needs string path and schedule.");
  }
  if (!DAILY_CRON.test(cron.schedule)) {
    throw new Error(
      `Vercel Hobby guard: sub-daily cron is not deployable. ${cron.path} uses "${cron.schedule}". Use a once-daily schedule unless the hosting plan is explicitly upgraded and this guard is updated.`,
    );
  }
}

console.log(`Validated ${crons.length} Vercel cron entries: daily schedules only.`);
