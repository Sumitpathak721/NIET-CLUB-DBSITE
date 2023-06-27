

// backend services and fetch api functions 
$("form").on("submit", function (e) {
    e.preventDefault();
});

const onLoad = async()=>{
    let token = localStorage.getItem("token");
    if(token){
        let response = await fetch("/validate",{
            method:"GET",
            headers:{
                "Content-type":"application/json",
                authorization:token
            }            
        });
        response = await response.json();
        if(response.verified){
            window.location.replace("../dashboard");
        }else{
            localStorage.removeItem("token");
            window.location.reload();
        }
    }
}
const removeResponse = ()=>{
    $('#response').css('display','none');
}
const login = async()=>{
    var formData = $("#login").serializeArray();
    let data = {}
    formData.forEach((field)=>{
        data[field.name] = field.value;
    });
        let response = await fetch("/login",{
            method:"POST",
            body:JSON.stringify(data),
            headers:{
                "Content-Type":"application/json"
            }
        });
        response = await response.json();
        console.log(response);
        if(response.status==404){
            $("#response").css("display" , "block");
            $("#responseText").text("Invalid Credential");
        }else if(response.status==401){
            $("#response").css("display","block");
            $("#responseText").text("Unauthorized access");
        }else{
            localStorage.setItem("token",response.respond.token);
            console.log("got called");
            window.location.replace("/dashboard");
        }
}