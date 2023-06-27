const express = require("express");
const fs = require('fs')
const multer = require('multer')
require("dotenv").config();

require("../db/config");
const userModel = require("../db/users")
const clubModel = require("../db/clubs")
let {templatesLoc, verifyToken} = require("../server.js");

const route=express()

route.post("/",async(req,res)=>{
    if(req.body.id){
        let user = await userModel.findOne({_id:req.body.id,access:"admin"});
        if(user){
            
            res.send({status:"ok"});
        }else{
            res.send({status:"false"});
        }
    }else{
        res.send({status:"error"});
    }
});


var upload = multer({
    storage:multer.diskStorage({
        destination:(req,file,cb)=>{
            if(file.fieldname=="video"){
                cb(null,'public/dynamic/videos')
            }
            if(file.fieldname=="icon"){
                cb(null,"public/dynamic/images")
            }
        },
        filename:(req,file,cb)=>{
            if(file.fieldname=="icon"){
                cb(null,req.body.name+"-clubIcon.png")
            }
            if(file.fieldname=="video"){
                if(req.body.name!=null){
                    cb(null,req.body.name+"-clubVideo.mp4")
                }else{
                    //for api edit-dsw-video
                    cb(null,"dsw-clubVideo.mp4")
                }
                
            }
                
        }
    })
});

route.post("/addClub",upload.fields([{name:"icon",maxCount:1},{name:"video",maxCount:1}]),verifyToken,async(req,res)=>{
    let admin = req.body.validation.user;
    console.log(req.body);
    if(admin && admin.Access=="admin"){
        let clubAdmin = await userModel.findOne({ERP_ID:req.body.ERP_ID});
        if(clubAdmin){
            if(clubAdmin.access=='clubAdmin' || clubAdmin.access=="admin"){
                res.send({status:"Already clubAdmin"});
            }else{
                let club = await userModel.findOne({name:req.body.name});
                if(club && club.name==req.body.name){
                    res.send({status:"Club Already Exist"});
                }else{
                    let newClub =new clubModel({
                        name:req.body.name,
                        admin:clubAdmin._id,
                        description:req.body.desc,
                        desc2:req.body.desc2,
                        whatsapp:req.body.whatsapp,
                        members:[],
                        number:req.body.number,
                        Email:req.body.Email,
                        icon:"/dynamic/images/"+req.body.name+"-clubIcon.png",
                        video:"/dynamic/videos/"+req.body.name+"-clubVideo.mp4",
                        event:[]
                    })
                    await newClub.members.push({userId:clubAdmin._id,position:"clubAdmin"});
                    clubAdmin.access = "clubAdmin";
                    clubAdmin.accessID = newClub._id;
                    await clubAdmin.save();
                    await newClub.save();
                    res.send({status:"ok"});
                }
            }
        }else{
            res.redirect({status:"clubAdmin not exist or not  verified"})
        }
    }else{
        res.redirect({status:"UnAuthorized"})
    }
    
});
//-----------Edit DSW club video API Start-----------

route.post("/edit-dsw-video",upload.fields([{name:"video",maxCount:1}]),async(req,res)=>{
    res.redirect("/admin");
});
//------------Edit DSW club video api End -----------

module.exports = route;