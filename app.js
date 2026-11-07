const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');

const path = require('path');



const app = express();

const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://vensoeng.vercel.app',
    'https://vensoeng.free.nf',
    'https://vensoeng.github.io',
    'https://likaworknote.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);


app.use(cors({
    origin: function (origin, callback) {
        // allow mobile apps or server-to-server
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS blocked: ' + origin));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent', 'X-Requested-With']
}));

app.use(express.json());
// auth routes
app.use("/auth", require('./src/routes/auth'));
//task type routes
app.use("/task-types", require('./src/routes/taskType'));
//task category routes
app.use("/task-categories", require('./src/routes/taskCategory'));
//task schedule routes
app.use("/task-schedules", require('./src/routes/taskSchedule'));
//task status routes
app.use("/task-statuses", require('./src/routes/taskStatus'));
//this is storage for image and file 
app.use("/storage", require('./src/routes/storage'));
//this is task reminder
app.use("/task-reminder", require('./src/routes/taskReminder'));
//this is telegram account of user
app.use("/user-telegram", require('./src/routes/telegram'));
//this is task location
app.use("/tasks", require('./src/routes/task'));
//this is chech rate limit 
app.use("/rate-limit", require('./src/routes/counReques'));
//this is public routes for task today
app.use("/task-today", require('./src/routes/taskToday'));
//this is public routes my task
app.use("/mytask", require('./src/routes/taskToday'));
//this is for test route
// app.use("/test", require('./src/routes/test'));

// for automation cron 
app.use("/cron", require("./src/routes/cron"));

app.get("/", (req, res) => {  
    res.send("Work note work!");
});

const PORT = process.env.PORT || 5000;

// Function to start the server
const startServer = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

startServer();

module.exports = app;