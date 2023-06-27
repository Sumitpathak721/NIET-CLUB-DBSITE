const validateClubMember = async(value)=>{
    document.getElementById("validateMemberID").innerText = "Verifiying...";
    $("#addMemberBtn").prop("disabled",true);
    $("#validateMemberID").css("display","block");
    let res = await fetch("/clubAdmin/isMember",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            authorization:localStorage.getItem("token")
        },
        body:JSON.stringify({
            memberID:value,
        })
    });
    res = await JSON.parse(await res.text());
    if(res.status=="yes"){
        $("#validateMemberID").css("color","red");
        document.getElementById("validateMemberID").innerText = "Already Member";
        $("#addMemberBtn").prop("disabled",true);
    }else if(res.status=="not exist"){
        $("#validateMemberID").css("color","red");
        document.getElementById("validateMemberID").innerText = "User Not exist";
        $("#addMemberBtn").prop("disabled",true);
    }else if(res.status=="no"){
        $("#validateMemberID").css("color","green");
        document.getElementById("validateMemberID").innerText = "Verified:)";
        $("#addMemberBtn").prop("disabled",false);
    }else{
        $("#validateMemberID").css("color","red");
        document.getElementById("validateMemberID").innerText = "Invalid Input:/";
        $("#addMemberBtn").prop("disabled",true);
    }
}
const memberDetailFetch = async (userId) => {
    let res = await fetch("/clubAdmin/getMemberDetail", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({
            memberID: userId
        })
    })
    return await res.json();
}
const ShowClubMember = async (club) => {
    document.getElementById("clubMembers").innerHTML = '';
    let res;
    for (let i = 0; i < club.members.length; i++) {
        res = await memberDetailFetch(club.members[i].userId);
        if (res.status == "ok") {
            let clubMember = document.getElementById("clubMembers");
            clubMember.innerHTML += `
            <div style='border:1px solid black;margin:1px 2px;display:flex;flex-direction:column;text-align:center;'>
                <img src='${window.MAIN_DIR+res.member.avatar}' alt='${res.member.name}' style='height:100px;width:100px;border-radius:100%;'>
                <a href='http://localhost:3000/profile/${res.member.ERP_ID}'>${res.member.name}</a>
                <button onclick='deleteMember("${res.member.ERP_ID}")'>Delete Member</button>
            </div>
            `
        } else {
            alert(res.status);
        }

    }
}
const deleteMember = async (ERP_ID) => {
    let res = await fetch("/clubAdmin/deleteMember", {
        method: "PUT",
        body: JSON.stringify({
            memberID: ERP_ID,
        }),
        headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token")
        },
    });
    res = await res.json();
    if (res.status == "ok") {
        window.location.reload();
    } else {
        alert(res.status);
    }
}
const ShowClubEvent = async (events) => {
    $("#clubEvents").html("");
    for (let i = 0; i < events.length; i++) {
        $("#clubEvents").append(`
        <div style='border:1px solid black;margin:1px 2px;display:flex;flex-direction:column;text-align:center;'>
            <img src='${events[i].eventIcon}' alt='${events[i].eventName}' style='height:100px;width:100px;border-radius:100%;'>
            <p>${events[i].eventName}</p>
            <button onclick='deleteEvent("${events[i].eventName}")'>Delete Event</button>
        </div>
        `)
    }
}
const deleteEvent = async (eventName) => {
    let res = await fetch("/clubAdmin/deleteEvent", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({
            eventName: eventName
        })
    });
    res = await res.json();
    if (res.status == "ok") {
        window.location.reload();
    } else {
        alert(res.status);
    }
}
const logout = ()=>{
    localStorage.clear();
    window.location.reload();
}
const checkClubAdmin = async (value) => {
    let statusTag = $("#statusAdminValidateForm");
    statusTag.text('validating Admin...');

    let data = await fetch("/clubAdmin/checkclubAdmin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ERP_ID: value,
            clubName:$("#clubName").text()
        })
    })
    data = await JSON.parse(await data.text());
    if (data.status == "ok") {
        $("#editClubBtn").prop("disabled", false);
        statusTag.text("Verified:)");
        statusTag.css("color","green");
    } else {
        $("#editClubBtn").prop("disabled", true);
        statusTag.css("color",'red');
        if (data.status == "already admin") {
            statusTag.text("Already Admin of another club");
        } else {
            statusTag.text("User Doesn't exists");
        }
    }
}
const addClubMemberToggle = async()=>{
    if($("#addMemberForm").css("display")=="none"){
        $("#addMemberForm").css("display","block");
    }else{
        $("#addMemberForm").css("display","none");
    }
}
const editClubToggle = async()=>{
    if($("#editClubForm").css("display")=="none"){
        $("#editClubForm").css("display","block");
    }else{
        $("#editClubForm").css("display","none");
    }
}
const addClubEventToggle = async()=>{
    if($("#addClubEventForm").css("display")=="none"){
        $("#addClubEventForm").css("display","block");
    }else{
        $("#addClubEventForm").css("display","none");
    }
}
///add functions to the form
//for adding member form
let addMemberForm = document.getElementById("addMemberForm");
addMemberForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    var formData = new FormData(addMemberForm);
  
    var response = await fetch(addMemberForm.action, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'authorization': localStorage.getItem('token')
      },
      body: JSON.stringify({
        memberID: formData.get('memberID')
      })
    });
  
    response = await response.json();
    if(response.status=="ok"){
        window.location.reload();
    }else{
        alert(response.status);
    }
  });
var editClubForm = document.getElementById("editClubForm");
editClubForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    var formData = new FormData(editClubForm);
    // Set the desired headers
    var headers = new Headers();
    headers.append("Authorization", localStorage.getItem("token"));
    headers.append("Custom-Header", "custom-value");
    let response = await fetch(editClubForm.action, {
        method: editClubForm.method,
        headers: headers,
        body: formData
    });
    response = await response.json();
    if (response.status == "ok") {
        window.location.reload();
    } else {
        alert(response.status);
    }
});
var addClubEventForm = document.getElementById("addClubEventForm");
addClubEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    var formData = new FormData(addClubEventForm);
    // Set the desired headers
    var headers = new Headers();
    headers.append("Authorization", localStorage.getItem("token"));
    headers.append("Custom-Header", "custom-value");
    let response = await fetch(addClubEventForm.action, {
        method: addClubEventForm.method,
        headers: headers,
        body: formData
    });
    response = await response.json();
    if (response.status == "ok") {
        window.location.reload();
    } else {
        alert(response.status);
    }
});