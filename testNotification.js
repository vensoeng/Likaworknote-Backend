require("dotenv").config();

const {
  sendMorningReminders,
  sendEveningSummaries
} = require("./src/services/taskNotificationService");

async function test() {
  // const result = await sendMorningReminders();
  // console.log("Morning result:", result);

  const result = await sendEveningSummaries();
  console.log("Evening result:", result);
}

test().catch(console.error);