const clubDetailFetch = async (value) => {
    let club = await fetch("/clubAdmin/clubDetail", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({
            clubName: value
        })
    });
    return await club.json();
}
const setClubDetail = async (value) => {
    $("#"+value).prop('disabled',true);
    let mainFrame = $("#clubDetail");
    mainFrame.css("display", "none")
    let club = await clubDetailFetch(value);
    if (club.status == "ok") {
        let responseFrame = $("#clubLoading")
        responseFrame.css("display", "block");
        responseFrame.text("Loading...");
        //set all input values of clubId
        document.querySelectorAll(".clubIDInput").forEach(clubAdmin => {
            clubAdmin.value = club.club._id;
        })
        // console.log(club);
        $(".clubIcon").each(function(){
            $(this).attr("src",club.club.icon);
        })
        
        // attr("src", club.club.icon);
        $("#clubName").html(club.club.name)
        let clubNames = document.querySelectorAll(".clubName");

        clubNames.forEach(clubName => {
            clubName.value = club.club.name;
        })
        $("#clubDesc1").html(club.club.description);
        $("#clubDesc2").html(club.club.desc2);
        let clubdescs1 = document.querySelectorAll(".clubDesc1");
        let clubdescs2 = document.querySelectorAll(".clubDesc2");
        clubdescs1.forEach(clubdesc => {
            clubdesc.value = club.club.description;
        })
        clubdescs2.forEach(clubdesc => {
            clubdesc.value = club.club.desc2;
        })
        $("#clubHelpLineNumber1").html(club.club.number[0]);
        let clubNumber1s = document.querySelectorAll(".clubHelpLineNumber1");

        clubNumber1s.forEach(clubNumber => {
            clubNumber.value = club.club.number[0];
        })

        if (club.club.number.length == 2) {
            $("#clubHelpLineNumber2").html(club.club.number[1]);
            let clubNumber2s = document.querySelectorAll(".clubHelpLineNumber2");
            clubNumber2s.forEach(clubNumber => {
                clubNumber.value = club.club.number[1];
            })
        }

        $("#clubHelpLineEmail1").html(club.club.Email[0]);
        let clubEmail1s = document.querySelectorAll(".clubHelpLineEmail1");

        clubEmail1s.forEach(clubEmail => {
            clubEmail.value = club.club.Email[0];
        })

        if (club.club.Email.length == 2) {
            $("#clubHelpLineEmail2").html(club.club.Email[1]);
            let clubEmail2s = document.querySelectorAll(".clubHelpLineEmail2");
            clubEmail2s.forEach(clubEmail => {
                clubEmail.value = club.club.Email[1];
            })
        }
        let clubwhatsapps = document.querySelectorAll(".clubWhatsapp");

        clubwhatsapps.forEach(clubWhatsapp => {
            clubWhatsapp.value = club.club.Email[0];
        });

        let clubAdminDetail = await memberDetailFetch(club.club.admin);
        if (clubAdminDetail.status == "ok") {
            document.querySelectorAll(".clubAdmin").forEach(clubAdmin => {
                clubAdmin.value = clubAdminDetail.member.ERP_ID;
            })
        }
        await ShowClubMember(club.club);
        await ShowClubEvent(club.club.events);
        responseFrame.css("display", "none")
        mainFrame.css("display", "block");
        responseFrame.text("");
    } else {
        alert(club.status);
    }
    $("#"+value).prop('disabled',false);
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
                <button onclick='deleteMember("${res.member.ERP_ID}","${club._id}")'>Delete Member</button>
            </div>
            `
        } else {
            alert(res.status);
        }

    }
}
const ShowClubEvent = async (events) => {
    $("#clubEvents").html("");
    for (let i = 0; i < events.length; i++) {
        $("#clubEvents").append(`
        <div style='border:1px solid black;margin:1px 2px;display:flex;flex-direction:column;text-align:center;'>
            <img src='${events[i].eventIcon}' alt='${events[i].eventName}' style='height:100px;width:100px;border-radius:100%;'>
            <p>${events[i].eventName}</p>
            <button onclick='deleteEvent("${events[i].eventName}","${document.getElementById('clubName').innerHTML}")'>Delete Event</button>
        </div>
        `)
    }
}
const newClubBtn = async () => {
    let element = document.getElementById("addClubForm");
    element.classList.toggle("activeClubBtn");
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
const addClubMemberToggle = async () => {
    if ($("#addMemberForm").css("display") == "none") {
        $("#addMemberForm").css("display", "block");
    } else {
        $("#addMemberForm").css("display", "none");
    }
}
const editClubToggle = async () => {
    if ($("#editClubForm").css("display") == "none") {
        $("#editClubForm").css("display", "block");
    } else {
        $("#editClubForm").css("display", "none");
    }
}
const addClubEventToggle = async () => {
    if ($("#addClubEventForm").css("display") == "none") {
        $("#addClubEventForm").css("display", "block");
    } else {
        $("#addClubEventForm").css("display", "none");
    }
}
const logout = ()=>{
    localStorage.clear();
    window.location.reload();
}
const validateClubMember = async (value) => {
    document.getElementById("validateMemberID").innerText = "Verifiying...";
    $("#addMemberBtn").prop("disabled", true);
    $("#validateMemberID").css("display", "block");
    let clubID = document.getElementsByClassName("clubIDInput")[0].value;
    let res = await fetch("/clubAdmin/isMember", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
            memberID: value,
            clubID: clubID
        }),
    });

    res = await res.json();
    if (res.status == "yes") {
        $("#validateMemberID").css("color", "red");
        document.getElementById("validateMemberID").innerText = "Already Member";
        $("#addMemberBtn").prop("disabled", true);
    } else if (res.status == "not exist") {
        $("#validateMemberID").css("color", "red");
        document.getElementById("validateMemberID").innerText = "User Not exist";
        $("#addMemberBtn").prop("disabled", true);
    } else if (res.status == "no") {
        $("#validateMemberID").css("color", "green");
        document.getElementById("validateMemberID").innerText = "Verified:)";
        $("#addMemberBtn").prop("disabled", false);
    } else {
        $("#validateMemberID").css("color", "red");
        document.getElementById("validateMemberID").innerText = "Invalid Input:/";
        $("#addMemberBtn").prop("disabled", true);
    }
}
let deleteMember = async (ERP_ID, clubID) => {
    let res = await fetch("/clubAdmin/deleteMember", {
        method: "PUT",
        body: JSON.stringify({
            memberID: ERP_ID,
            clubID: clubID
        }),
        headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token")
        },
    });
    res = await res.json();
    if (res.status == "ok") {
        setClubDetail($("#clubName").text())
    } else {
        alert(res.status);
    }
}
const deleteEvent = async (eventName, clubName) => {
    let res = await fetch("/clubAdmin/deleteEvent", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({
            clubName: clubName,
            eventName: eventName
        })
    });
    res = await res.json();
    if (res.status == "ok") {
        setClubDetail($("#clubName").text());
    } else {
        alert(res.status);
    }
}
let addMemberForm = async () => {
    var formData = $("#addMemberForm").serializeArray();
    let data = {}
    formData.forEach((field) => {
        data[field.name] = field.value;
    });
    let res = await fetch("/clubAdmin/addMember", {
        method: "PUT",
        body: await JSON.stringify(data),
        headers: {
            "Content-type": "application/json",
            authorization: localStorage.getItem("token")
        }
    });
    res = await res.json();
    if (res.status == "ok") {
        setClubDetail($("#clubName").text())
    } else {
        alert(res.status);
    }
}

$("#addMemberForm").on("submit", function (e) {
    e.preventDefault();
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
        let prevName = $("#clubName").text();
        await setClubDetail(formData.get("name"));
        $("#" + prevName).attr("id", formData.get("name"));
        $("#" + formData.get("name")).attr("value", formData.get("name"));
        $("#" + formData.get("name")).text(formData.get("name"));

    } else {
        alert(response.status);
    }
});
var addClubForm = document.getElementById("addClubForm");
addClubForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    var formData = new FormData(addClubForm);
    // Set the desired headers
    var headers = new Headers();
    headers.append("Authorization", localStorage.getItem("token"));
    headers.append("Custom-Header", "custom-value");
    let response = await fetch(addClubForm.action, {
        method: addClubForm.method,
        headers: headers,
        body: formData
    });
    response = await response.json();
    if (response.status == "ok") {
        window.location.reload();
    } else {
        alert(response.status);
    }
})
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
        await setClubDetail($("#clubName").text());
    } else {
        alert(response.status);
    }
});