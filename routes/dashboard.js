const express = require("express");
const {templatesLoc,verifyToken} = require("../server.js")
require("../db/config.js");
const clubModel = require("../db/clubs.js")
const route=express()

route.get("/",async(req,res)=>{
    res.render(templatesLoc+"/dashboard.ejs");
});

route.get("/getAccessData",verifyToken,async(req,res)=>{
    if(req.body.validation.verified){
        if(req.body.validation.user.Access=="admin"){
            let clubs = await clubModel.find({});
            res.render(templatesLoc+"/admin.ejs",{clubs:clubs,MAIN_DIR:process.env.MAIN_DIR});
        }else if(req.body.validation.user.Access=="clubAdmin"){
            let club = await clubModel.findOne({_id:req.body.validation.user.AccessID});
            res.render(templatesLoc+"/clubAdmin.ejs",{club:club,MAIN_DIR:process.env.MAIN_DIR});
        }else{
            res.sendStatus(403);
        }
    }else{
        res.sendStatus(404);
    }
});

module.exports = route;