const route = require("express")()
require("dotenv").config();
const fs = require('fs')
const multer = require('multer')
const multerS3 = require("multer-s3");
const AWS = require('aws-sdk');

let {verifyToken,unlinkFileStream}  = require("../server");
require("../db/config.js");
const userModel = require("../db/users");
const clubModel = require("../db/clubs");
const eventModel = require("../db/events");
const path = require("path");

route.post("/checkclubAdmin",async(req,res)=>{
    let user = await userModel.findOne({ERP_ID:req.body.ERP_ID});
    let club = await clubModel.findOne({name:req.body.clubName});
    if(user && user.ERP_ID==req.body.ERP_ID){
        if(user.access=='user' || (user.access=='clubAdmin' && user.accessID==""+club._id)){
            res.send({status:"ok"});
        }else{
            res.send({status:"already admin"})
        }
    }else{
        res.send({status:"not exist"})
    }
});
route.post("/clubDetail",verifyToken,async(req,res)=>{
    let club;
    let {user} = req.body.validation;
    if(user && user.Access=="admin" && req.body.clubName){
        club = await clubModel.findOne({name:req.body.clubName});
    }else if(user && user.Access=="clubAdmin"){
        club = await clubModel.findOne({_id:user.AccessID}).select(["-_id"]);
    }
    if(club){
        res.send({status:"ok",club:club})
    }else{
        res.send({status:"Access Denied"})
    }
})
route.get("/isvalidClub",async(req,res)=>{
    if(req.query.clubName){
        let club = await clubModel.findOne({name:req.query.clubName});
        if(club){
            res.send({status:200});
        }else{
            res.send({status:404});
        }
    }else{
        res.send({status:404});
    }
});
route.post("/getMemberDetail",verifyToken,async(req,res)=>{
    //validate admin or clubAdmin
    let {user} = req.body.validation;
    if(user){
        let member = await userModel.findOne({_id:req.body.memberID});
        if(member){
            res.send({status:"ok",member:{name:member.name,ERP_ID:member.ERP_ID,avatar:member.avatar}});
        }else{
            res.sendStatus(403)
        }
    }else{
        res.sendStatus(404)
    }
})
route.put("/addMember",verifyToken,async(req,res)=>{
    let {user} = req.body.validation;
        if(user){
            let club;
            if(user.Access=="admin" && req.body.clubID){
                club = await clubModel.findOne({_id:req.body.clubID});
            }else if(user.Access=="clubAdmin"){
                club = await clubModel.findOne({_id:user.AccessID});
            }else{
                res.send({status:"Denied"});
            }
            let newMember = await userModel.findOne({ERP_ID:req.body.memberID});

            if(newMember){
                for(let i=0;i<club.members.length;i++){
                    if(club.members[i].userId==newMember._id){
                        res.send({status:"already member"});
                    }
                }
                club.members.push({userId:newMember._id,position:"member"});
                await club.save();
                res.send({status:"ok"});
            }else{
                res.send({status:"user not exist"});
            }
        }else{
            res.send({status:"Denied"});    
        }
})
route.post("/isMember",verifyToken,async(req,res)=>{
    let {user} = req.body.validation;
    if(user && req.body.memberID){
        let member = await userModel.findOne({ERP_ID:req.body.memberID});
        let club;
        if(user.Access=="admin" && req.body.clubID){
            club = await clubModel.findOne({_id:req.body.clubID});
        }else if(user.Access=="clubAdmin"){
            club = await clubModel.findOne({_id:user.AccessID});
        }
        if(!club){
            res.send({status:"Invalid Data"});
        }else{
            if(member){
                if(user.Access=="admin" || (user.Access=="clubAdmin" && user.AccessID==club.id)){
                    for(let i=0;i<club.members.length;i++){
                        if(""+member._id==""+club.members[i].userId){
                            res.send({status:"yes"});
                            return;
                        }
                    }
                    res.send({status:"no"});
                }else{
                    res.send({status:"access denied"});
                }
            }else{
                res.send({status:"not exist"});
            }
        }
    }else{
        res.send({status:"Unauthorzed Access"});
    }
});
// ----Edit club Api end---------------

AWS.config.update({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
})
const s3 = new AWS.S3();

var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'niet-dsw',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            console.log(file);
            if(file.fieldname=="icon"){
                cb(null,req.body.name+(new Date()).getTime()+"-clubIcon")
            }else if(file.fieldname=="eventIcon"){
                cb(null,(new Date()).getTime()+"-clubEventIcon")
            }else if(file.fieldname=='eventPhotos'){
                cb(null,(new Date()).getTime()+"-clubEventPhoto")
            }else if(file.fieldname=='eventReport'){
                cb(null,(new Date()).getTime()+"-eventReport")
            }
        }
    })
})

route.post("/editClub",upload.single("icon"),verifyToken,async(req,res)=>{
    let admin = req.body.validation.user;
    if(admin){
        let club;
        if(admin.Access=="admin" && req.body.clubID){
            club = await clubModel.findOne({_id:req.body.clubID});
        }else if(admin.Access=="clubAdmin"){
            club = await clubModel.findOne({_id:admin.AccessID});
        }
        if(club){
            club.name = req.body.name;
            club.Email = req.body.Email;
            club.number = req.body.number;
            club.whatsapp = req.body.whatsapp;
            club.description = req.body.desc1;
            club.desc2=req.body.desc2;
            let clubAdmin = await userModel.findOne({ERP_ID:req.body.ERP_ID});
            if(clubAdmin){
                if(clubAdmin.access=="user"){
                    let currClubAdmin = await userModel.findOne({_id:club.admin});
                    if(currClubAdmin){
                        currClubAdmin.access="user";
                        currClubAdmin.accessID = "";
                        await currClubAdmin.save();
                        clubAdmin.access="clubAdmin";
                        clubAdmin.accessID = club._id;
                        await clubAdmin.save();
                        club.admin = clubAdmin;
                    }else{
                        res.send({status:"club error"});
                    }
                }else if(!(clubAdmin.access=="clubAdmin" && clubAdmin.accessID==""+club._id)){
                    res.send({status:"already admin"});
                }
            }else{
                res.send({status:"Invalid clubAdminID"})
            }
            if(req.file){
                var part = club.icon.split('/');
                await unlinkFileStream(part[part.length-1]);
                club.icon="/files/"+req.file.key;
            }
            await club.save();
            res.send({status:"ok"});
        }else{
            res.send({status:"Invalid club"});
        }
    }else{
        res.send({status:401});
    }
})
// ----Edit club API end-----------------

// ---- add club event -----------------

route.post("/addClubEvent",upload.single("eventIcon"),verifyToken,async(req,res)=>{
    let admin = req.body.validation.user;
    if(admin){
        let club;
        if(admin.Access=="admin"){
            club = await clubModel.findOne({_id:req.body.clubID});
        }else if(admin.Access=="clubAdmin"){
            club = await clubModel.findOne({_id:admin.AccessID});
        }
        if(club){
            let newEvent = new eventModel({
                Name:req.body.eventName,
                Desc:req.body.desc,
                icon:"/files/"+req.file.key,  
                clubName:club.name,
                eventDate:req.body.eventDate,
                
            });
            if(req.body.regDate){
                newEvent.regDate = req.body.regDate;
            }
            await newEvent.save();
            club.events.push(newEvent._id);
            await club.save();
            res.send({status:"ok"});
        }else{
            res.send({status:"Access Denied!!"})
        }
    }else{
        res.send({status:"Unauthorized access"});
    }
});
route.post("/addEventReport",upload.fields([{name:"eventPhotos",maxCount:5},{name:"eventReport",maxCount:1}]),verifyToken,async(req,res)=>{
    let admin = req.body.validation.user;
    if(admin){
        let event = await eventModel.findOne({_id:req.body.eventID})
        if(event){
            if(admin.Access=="admin"){
                if(req.files.eventPhotos!=null){
                    eventPhotos = [];
                    for(let i=0;i<req.files.eventPhotos.length;i++){
                        eventPhotos.push("/files/"+req.files.eventPhotos[i].key);
                    }
                    event.eventPhotos = eventPhotos;
                }
                if(req.files.eventReport){
                    event.report ="/files/"+ req.files.eventReport[0].key;
                }
                await event.save();
                res.send({status:"ok"});
            }else if(admin.Access=='clubAdmin'){
                let club = await clubModel.findOne({_id:admin.AccessID})
                if(club.name==event.clubName){
                    if(req.files.eventPhotos!=null){
                        for(let i=0;i<req.files.eventPhotos.length;i++){
                            event.eventPhotos.push("/files/"+req.files.eventPhotos[i].key);
                        }
                    }
                    
                    if(req.files.eventReport){
                        event.report = "/files/"+req.files.eventReport[0].key;
                    }
                    await event.save();
                    res.send({status:"ok"})
                }else{
                    res.send({status:404});
                }
            }
        }else{
            res.send({status:404});
        }
    }
});

// ------ Edit club Events -------------

route.put("/deleteEvent",verifyToken,async(req,res)=>{
    let {user} = req.body.validation;
    if(user){
        let club;
        let event;
        if(user.Access=="admin" && req.body.clubName){
            club = await clubModel.findOne({name:req.body.clubName});
            event = await eventModel.findOne({Name:req.body.eventName,clubName:req.body.clubName});
        }else if(user.Access=="clubAdmin"){
            club = await clubModel.findOne({_id:user.AccessID});
            event = await eventModel.findOne({Name:req.body.eventName,clubName:club.name});
        }
        if(club){
            if(event){
                for(let i=0;i<club.events.length;i++){
                    if(`${club.events[i]}`== `${event._id}`){
                        var part = event.icon.split('/');
                        await unlinkFileStream(part[part.length-1]);
                        await eventModel.deleteOne({_id:club.events[i]});
                        club.events.splice(i,1);
                        await club.save()
                        res.send({status:"ok"});
                        return;
                    }
                }
                res.send({status:"Event Not found!!"})
            }else{
                res.send({status:"Event not exist"})
            }
        }else{
            res.send({status:"Access Denied"})
        }
    }
});
route.put("/deleteMember",verifyToken,async(req,res)=>{
    let {user} = req.body.validation;
    if(user && req.body.memberID){
        let member = await userModel.findOne({ERP_ID:req.body.memberID});
        let club;
        if(user.Access=="admin" && req.body.clubID){
            club = await clubModel.findOne({_id:req.body.clubID});
        }else if(user.Access=="clubAdmin"){
            club = await clubModel.findOne({_id:user.AccessID});
        }
        if(club){
            if(member){
                if(member.access=="clubAdmin" && ""+member.accessID==""+club._id){
                    res.send({status:"clubAdmin can't delete"});
                }else{
                    for(let i=0;i<club.members.length;i++){
                        if(""+member._id==""+club.members[i].userId){
                            club.members.splice(i,1);
                        }
                    }
                    await club.save();
                    res.send({status:"ok"})
                }
            }else{
                res.send({status:"user not exist"})
            }
        }else{
            res.send({status:"Access Denied"})
        }
    }
});

module.exports = route;