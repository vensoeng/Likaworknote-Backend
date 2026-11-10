const router = require("express").Router();
const Mytask = require("../controllers/taskTodayController");

router.get("/mytask/:user_id", Mytask.myTasksToday);

router.get(
    "/today/:user_id", 
    Mytask.myTasksToday
);

router.get("/week/:user_id", Mytask.tasksThisWeek);
router.get("/month/:user_id", Mytask.tasksThisMonth);
router.get("/year/:user_id", Mytask.tasksThisYear);
router.get("/:username/:date", Mytask.publicCompletedTasksByDate);

module.exports = router;