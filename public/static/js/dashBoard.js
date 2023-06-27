const onLoad = async()=>{
    const token = localStorage.getItem("token");
    if(token){
        let res = await fetch("/dashboard/getAccessData",{
            method:"GET",
            headers:{
                authorization:token
            }
        });
        $("body").html(await res.text());
    }else{
        window.location.replace("/");
    }
    
}