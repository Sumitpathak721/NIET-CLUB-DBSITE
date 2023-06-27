const route = require("express")()
require("dotenv").config();
const fs = require('fs')
const multer = require('multer')

let {templatesLoc,verifyToken}  = require("../server");
require("../db/config.js");
const userModel = require("../db/users");
const clubModel = require("../db/clubs");
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
    console.log(req.body);
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
var upload = multer({
    storage:multer.diskStorage({
        destination:(req,file,cb)=>{
            cb(null,'public/dynamic/images')
        },
        filename:(req,file,cb)=>{
            if(file.fieldname=="icon"){
                cb(null,req.body.name+(new Date()).getTime()+"-clubIcon.png")
            }else if(file.fieldname=="eventIcon"){
                cb(null,(new Date()).getTime()+"-clubEventIcon.png")
            }
        }
    })
});
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
                fs.unlink(""+path.join("public",club.icon),(e)=>{
                    if(e){
                        console.e("File Deletion error:",e)
                        return;
                    }
                });
                club.icon="/dynamic/images/"+req.file.filename;
            }
            await club.save();
            res.send({status:"ok"});
        }else{
            res.send({status:"Invalid club"})
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
            let event = {
                eventName:req.body.eventName,
                eventDesc:req.body.desc,
                eventIcon:"/dynamic/images/"+req.file.filename
            };
            club.events.push(event);
            await club.save();
            res.send({status:"ok"});
        }else{
            res.send({status:"Access Denied!!"})
        }
    }else{
        res.send({status:"Unauthorized access"});
    }
});

// ------ Edit club Events -------------

route.put("/deleteEvent",verifyToken,async(req,res)=>{
    let {user} = req.body.validation;
    if(user){
        let club;
        if(user.Access=="admin" && req.body.clubName){
            club = await clubModel.findOne({name:req.body.clubName});
        }else if(user.Access=="clubAdmin"){
            club = await clubModel.findOne({_id:user.AccessID});
        }
        if(club){
            if(req.body.eventName){
                for(let i=0;i<club.events.length;i++){
                    if(club.events[i].eventName==req.body.eventName){
                        fs.unlink(""+path.join("public",club.events[i].eventIcon),(e)=>{
                            if(e){
                                console.log("File Deletion error:",e)
                                return;
                            }
                        });
                        club.events.splice(i,1);
                        await club.save()
                        res.send({status:"ok"});
                        return;
                    }
                }
                res.send({status:"Event Not found!!"})
            }else{
                res.send({status:"user not exist"})
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