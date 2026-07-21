const fs = require('fs');
async function check() {
  try {
    const res = await fetch('https://api.github.com/repos/Aomine-c2c/bikita-it/actions/runs?per_page=1');
    const data = await res.json();
    const run = data.workflow_runs[0];
    
    // Attempt to download the workflow run logs
    const logsRes = await fetch(run.logs_url);
    console.log("Logs URL:", run.logs_url);
    console.log("Logs status:", logsRes.status);
    
    console.log("Run name:", run.name);
    console.log("Run display title:", run.display_title);
  } catch (err) {
    console.error(err);
  }
}
check();
