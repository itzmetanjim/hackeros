const bframe=document.getElementById("backgroundframe")
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
bframe.addEventListener("load",()=>{
    try{
    const doc=bframe.contentDocument||bframe.contentWindow.document
    
        doc.getElementById("ui").style.display="none"
    }catch(e){console.error(e)}

})
bframe.width=window.innerWidth
bframe.height=window.innerHeight

window.addEventListener("resize",()=>{
    bframe.width=window.innerWidth
    bframe.height=window.innerHeight
})

async function encrypt(data,password){
    var string=JSON.stringify(data)
    var enc=new TextEncoder()
    var salt=window.crypto.getRandomValues(new Uint8Array(16))
    var ivector=window.crypto.getRandomValues(new Uint8Array(12))
    var basekey=await window.crypto.subtle.importKey("raw",enc.encode(password),{name:"PBKDF2"},false,["deriveKey"])
    var key=await window.crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:1000000,hash:"SHA-256"},basekey,{name:"AES-GCM",length:256},false,["encrypt"])
    var encd=await window.crypto.subtle.encrypt({name:"AES-GCM",iv:ivector},key,enc.encode(string))
    var combine=new Uint8Array(salt.byteLength+ivector.byteLength+encd.byteLength)
    combine.set(salt,0)
    combine.set(ivector,salt.byteLength)
    combine.set(new Uint8Array(encd),salt.byteLength+ivector.byteLength)
    //return btoa(String.fromCharCode(...combine))
    let binary=""
    for(let i=0;i<combine.byteLength;i++){
        binary+=String.fromCharCode(combine[i])
    }
    return btoa(binary);
}
async function decrypt(data,password){
    try{
        var enc=new TextEncoder()
        var combine=Uint8Array.from(atob(data),c=>c.charCodeAt(0))
        var salt=combine.slice(0,16)
        var ivector=combine.slice(16,28)
        var encd=combine.slice(28)
        var basekey=await window.crypto.subtle.importKey("raw",enc.encode(password),{name:"PBKDF2"},false,["deriveKey"])
        var key=await window.crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:1000000,hash:"SHA-256"},basekey,{name:"AES-GCM",length:256},false,["decrypt"])
        var decd=await window.crypto.subtle.decrypt({name:"AES-GCM",iv:ivector},key,encd)
        return JSON.parse(new TextDecoder().decode(decd))
    }
    catch(e){return false}
}
const app=document.getElementById("app")
function handleModalDrag(e){
    if(!e.buttons&1) return
    var moddiv=e.target.closest(".modal")
    if(moddiv){
        var cursorx=e.clientX 
        var cursory=e.clientY
        var modheight=moddiv.offsetHeight
        var modbefheight=e.target.offsetHeight
        moddiv.style.top=(cursory+modheight/2-modbefheight/2)+"px"
        var modwidth=moddiv.offsetWidth
        moddiv.style.left=(cursorx+0)+"px"
    }
}
function openModal(){
    var moddiv=document.createElement("div")
    moddiv.classList.add("modal")
    var modbef=document.createElement("div")
    modbef.classList.add("before")
    moddiv.appendChild(modbef)
    app.appendChild(moddiv)
    modbef.addEventListener("mousemove",handleModalDrag)
    return [moddiv,modbef]
    
}
function easyModal(title,text){
    let mod=openModal()
    let moddiv=mod[0]
    let modbef=mod[1]
    let modcont=document.createElement("div");console.log(mod,modcont)
    moddiv.appendChild(modcont)
    modbef.textContent=title
    p=null
    if(text){
        let p=document.createElement("p")
        p.textContent=text
        modcont.appendChild(p)
        let close=document.createElement("button")
        close.textContent="Close"
        modcont.appendChild(close)
        close.addEventListener("click",()=>{
            moddiv.remove()
        })
    }
    return [moddiv,modbef,modcont,p]
}
function easyYesNoModal(title,text,callback){
    let mod=openModal()
    let moddiv=mod[0]
    let modbef=mod[1]
    let modcont=document.createElement("div");console.log(mod,modcont)
    moddiv.appendChild(modcont)
    modbef.textContent=title
    p=null
    if(text){
        let p=document.createElement("p")
        p.textContent=text
        modcont.appendChild(p)
        let yes=document.createElement("button")
        yes.textContent="Yes"
        let no=document.createElement("button")
        no.textContent="No"
        no.classList.add("red")
        modcont.appendChild(yes)
        modcont.appendChild(no)
        yes.addEventListener("click",()=>{
            callback(true)
            moddiv.remove()
        })
        no.addEventListener("click",()=>{
            callback(false)
            moddiv.remove()
        })
    }
    return [moddiv,modbef,modcont,p]
}
async function run(){


await delay(1000)
loadmod[0].remove()
//encryption input
var enckey=window.localStorage.getItem("encryptionKey")
if(!enckey){
    let mod=easyModal("Set up full disk encryption",null)
    let moddiv=mod[0]
    let modbef=mod[1]
    let modcont=mod[2]
    modcont.innerHTML=`
    <h1>Set up full disk encryption</h1>
    <p>You have not set up encryption in HackerOS yet. Enter a password to use for encryption.</p>
    <p><strong>Warning:</strong> If you forget this password, you will lose access to all your data.</p>
    <input type="password" id="enckeyinput" placeholder="Enter encryption password"><br>
    <button id="enckeysubmit">Submit</button>
    `
    document.addEventListener("click",(e)=>{
        if(e.target.id=="enckeysubmit"){
            let input=document.getElementById("enckeyinput").value
            if(input.length<8){
                let errmod=easyModal("Error","Password must be at least 8 characters long")
            }
            else{
                modcont.innerHTML=`<h1>Encrypting data...</h1>`
                window.localStorage.setItem("encryptionKey",true)
                encrypt({},input).then((result)=>{
                    window.localStorage.setItem("data",result)
                    moddiv.remove()
                    easyModal("Success","Encryption key set successfully. Reloading!")
                    window.location.reload()
                })
                
            }
        }
    })
    
}
else{
    //login screen
    let mod=easyModal("Login","")
    mod[2].innerHTML=`
    <h1>Login</h1>
    <p>Enter your password to load your data</p>
    <input type="password" id="enckeyinput" placeholder="Enter encryption password"><br>
    <button id="enckeysubmit">Submit</button><br>
    <button id="cleardata" class="red" style="float:right">Clear data</button>
    `
    mod[0].style.left="15%"
    mod[0].style.top="22%" //idk aesthetics
    document.addEventListener("click",(e)=>{
        if(e.target.id=="enckeysubmit"){
            let input=document.getElementById("enckeyinput").value
            let doingit=easyModal("Please wait","")
            doingit[2].innerHTML=`<span class="huge mono">HackerOS</span><br><p>Decrypting data...</p>`
            doingit[1].remove()
            mod[0].style.display="none"
            decrypt(window.localStorage.getItem("data"),input).then((result)=>{
                doingit[0].remove()
                mod[0].style.display="block"
                if(result===false){
                    let errmod=easyModal("Error","Incorrect password")
                }
                else{
                    mod[0].remove()
                    window.data=result
                    launchOS()
                }
            })
        }
        else if(e.target.id=="cleardata"){
            easyYesNoModal("Clear data","Are you sure you want to clear all your data? This action cannot be undone.",(res)=>{
                if(res){
                    window.localStorage.removeItem("data")
                    window.localStorage.removeItem("encryptionKey")
                    easyModal("Success","Data cleared successfully. Reloading!")
                    window.location.reload()
                }
            })
        }
    })
}
/*//modal test
var mod=openModal()
var moddiv=mod[0]
var modbef=mod[1]
modbef.textContent="Login"
var p=document.createElement("p")
p.textContent="Enter your password to load your data"
moddiv.appendChild(p)*/



}
function launchOS(){
    let mod=easyModal("","")
    mod[1].remove()
    mod[2].innerHTML=`
    <span class="huge mono">HackerOS</span><br>
    <p>(login successful, OS will be implemented)
    </p>
    `
}
//loading screen
let loadmod=easyModal("")
loadmod[1].remove()
loadmod[2].innerHTML=`
<span class="huge mono">HackerOS</span><br>
<p>Loading...</p>
`
window.addEventListener("load",run)
