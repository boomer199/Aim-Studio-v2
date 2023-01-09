const express = require('express');
const { dirname } = require('path');

const app = express();
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req,res) =>{
    res.sendFile(__dirname + "/home.html");
})

app.listen(8080 , () => {
    console.log('server running on port 8080');
})
