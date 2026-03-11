/*const Errormsg=document.getElementById("ErrorMsg");
const submitbtn=document.getElementById("submitbtn");


submitbtn.addEventListener("click",

    function (e){



const name=document.getElementById("username");
const email=document.getElementById("email");
const password=document.getElementById("password");

if(name.value.trim()===''){
    Errormsg.textContent="Name cannot be Empty!";
    Errormsg.style.color="red";
    Errormsg.style.backgroundColor="White";
    
    return
}
if(email.value.trim()===''){
    Errormsg.textContent="Email cannot be Empty!";
 Errormsg.style.color="white";
     Errormsg.style.backgroundColor="black";
    return
}
if(password.value.trim()===''){
    Errormsg.textContent="Password cannot be Empty!";
    Errormsg.style.color="white";
     Errormsg.style.backgroundColor="black";
    return
}
if(password.value.length<6){
    Errormsg.textContent="Password must be at least 6 characters long!";
    Errormsg.style.color="white";
     Errormsg.style.backgroundColor="black";
    return
}
else{
    Errormsg.textContent="Submitted Successfully!"
     Errormsg.style.color="green";
     Errormsg.style.backgroundColor="White";
    
}
 
document.getElementById("signupform").reset();
setTimeout(() => {
    Errormsg.textContent="";
}, 5000);


   

    }
)


*/




const Errormsg = document.getElementById("ErrorMsg");
const signupform = document.getElementById("signupform");

signupform.addEventListener("submit", function (e) {

    const name = document.getElementById("username");
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    if (name.value.trim() === '') {
        e.preventDefault();
        Errormsg.textContent = "Name cannot be Empty!";
        Errormsg.style.color = "red";
        return;
    }

    if (email.value.trim() === '') {
        e.preventDefault();
        Errormsg.textContent = "Email cannot be Empty!";
        return;
    }

    if (password.value.trim() === '') {
        e.preventDefault();
        Errormsg.textContent = "Password cannot be Empty!";
        return;
    }

    if (password.value.length < 6) {
        e.preventDefault();
        Errormsg.textContent = "Password must be at least 6 characters long!";
        return;
    }


});
