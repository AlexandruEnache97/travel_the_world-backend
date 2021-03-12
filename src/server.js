const express = require('express');
const mongoose = require('mongoose');
const serverConfig = require('./config/config');
const routes = require('./routes');

// create the server express
const app = express();

// add middleware for parsing JSON
app.use(express.json());

// connect to mongoose
mongoose.connect(process.env.MONGODB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
}, (err) => {
    if(err) throw err;
    console.log('Connected to MongoDB');
})

// set routes of the server
routes(app);

// app listener
app.listen(serverConfig.PORT, () => {
    console.log(`Server is running at http://${process.env.HOST_NAME}:${process.env.PORT}`)
})