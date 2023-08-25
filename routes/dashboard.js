const express = require("express");
const {verifyToken} = require("../server.js")
require("../db/config.js");
const clubModel = require("../db/clubs.js")
const eventModel = require("../db/events.js")
const mainModel = require("../db/main.js")
const route=express()


route.get("/",async(req,res)=>{
    res.render("../templates/dashboard.ejs");
});

route.get("/getAccessData",verifyToken,async(req,res)=>{
    if(req.body.validation.verified){
        if(req.body.validation.user.Access=="admin"){
            let clubs = await clubModel.find({},{name:1});
            let main = await mainModel.findOne({});
            res.render("../templates/admin.ejs",{main:main,clubs:clubs,MAIN_DIR:process.env.MAIN_DIR});
        }else if(req.body.validation.user.Access=="clubAdmin"){
            let club = await clubModel.findOne({_id:req.body.validation.user.AccessID});
            res.render("../templates/clubAdmin.ejs",{club:club,MAIN_DIR:process.env.MAIN_DIR});
        }else{
            res.sendStatus(403);
        }
    }else{
        res.sendStatus(404);
    }
});
route.get("/getEvent",async(req,res)=>{
    let event = await eventModel.findOne({_id:req.query.clubID});
    res.send(event);
});

module.exports = route;