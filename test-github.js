// const https = require("https");

// https.get("https://api.github.com", {
//     headers: {
//         "User-Agent": "WorkNote-Test"
//     }
// }, (res) => {
//     console.log("STATUS:", res.statusCode);

//     let data = "";

//     res.on("data", chunk => {
//         data += chunk;
//     });

//     res.on("end", () => {
//         console.log("RESPONSE:");
//         console.log(data);
//     });

// }).on("error", (error) => {
//     console.error("NODE GITHUB ERROR:");
//     console.error(error);
// });


// require("dotenv").config();

// const { Octokit } = require("@octokit/rest");

// async function test() {
//   try {
//     const token = process.env.GITHUB_TOKEN;
//     const owner = process.env.OWNER;
//     const repo = process.env.REPO;

//     console.log("OWNER:", owner);
//     console.log("REPO:", repo);
//     console.log("TOKEN EXISTS:", !!token);

//     const octokit = new Octokit({
//       auth: token,
//     });

//     const response = await octokit.repos.getContent({
//       owner,
//       repo,
//       path: process.env.USERS_FILE_PATH,
//     });

//     console.log("STATUS:", response.status);
//     console.log("FILE:", response.data.name);
//     console.log("SHA:", response.data.sha);
//     console.log("SUCCESS: GitHub repository access works.");

//   } catch (error) {
//     console.error("OCTOKIT ERROR");
//     console.error("STATUS:", error.status);
//     console.error("MESSAGE:", error.message);
//     console.error("RESPONSE:", error.response?.data);
//   }
// }

// test();


require("dotenv").config();

const { readJsonFile } = require("./src/utils/githubJsonStore");

async function test() {
  try {
    console.log("FILE PATH:", process.env.USERS_FILE_PATH);

    const users = await readJsonFile(
      process.env.USERS_FILE_PATH,
      []
    );

    console.log("SUCCESS");
    console.log("USERS TYPE:", Array.isArray(users) ? "ARRAY" : typeof users);
    console.log("USERS COUNT:", Array.isArray(users) ? users.length : "N/A");
    console.log("USERS:", users);

  } catch (error) {
    console.error("READ USER ERROR");
    console.error("STATUS:", error.status);
    console.error("MESSAGE:", error.message);
    console.error("RESPONSE:", error.response?.data);
    console.error(error);
  }
}

test();