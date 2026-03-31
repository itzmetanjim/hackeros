var bframe=document.getElementById("backgroundframe")
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/*
try{
    var bframe=document.getElementById("backgroundframe")

    const doc=bframe.contentdocument||bframe.contentWindow.document

    doc.getelementbyid("ui").style.display="none"
}catch(e){
    try{
        var bframe=document.getElementById("backgroundframe")
        bframe.contentWindow.postMessage({type:"hideui"},"*")
    }catch(e){}
}
bframe.addEventListener("load",()=>{
    try{
        undefined()
        var bframe=document.getElementById("backgroundframe")

        const doc=bframe.contentDocument||bframe.contentWindow.document

        doc.getelementbyid("ui").style.display="none"
    }catch(e){
        console.log(e)
        var bframe=document.getElementById("backgroundframe")
        bframe.contentWindow.postMessage({type:"hideui"},"*")
    }


})*/

bframe.width=window.innerWidth
bframe.height=window.innerHeight
bframe.contentWindow.postMessage({type:"getCanvasSize"},"*")
window.addEventListener("message",(e)=>{
    if(e.data.type=="canvasSize"){
        console.log("got canvas size",e.data.width,e.data.height)
        if(e.data.width==0||e.data.height==0){
            bframe.src=bframe.src
            bframe.contentWindow.postMessage({type:"hideui"},"*")
            bframe.contentWindow.postMessage({type:"getCanvasSize"},"*")
        }
    }
})
window.addEventListener("resize",()=>{
    console.log("resize")
    bframe.width=window.innerWidth
    bframe.height=window.innerHeight
    bframe.src=bframe.src
    bframe.contentWindow.postMessage({type:"hideui"},"*")
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
const lastElement=document.createElement("span")
app.appendChild(lastElement)
function genHandleModalDrag(rsc=(a,e,s)=>{},preventDownsize=true){
    function handleModalDrag(e){

        app.appendChild(lastElement)
        rsc("mousemove",e,e.target.closest(".modal"))
        let moveWhen=window.data?.settings?.moveWhen || 1
        let resizeWhen=window.data?.settings?.resizeWhen || 1
        let bringToFrontWhen=window.data?.settings?.bringToFrontWhen || 1
        if(!e.buttons&resizeWhen) {
            window.prevcursor=null}
        if(e.buttons&bringToFrontWhen){
            if(app.lastChild!=e.target.closest(".modal")){
                //app.appendChild(e.target.closest(".modal"))
                app.moveBefore(e.target.closest(".modal"),lastElement)
            }
        }
        if(e.shiftKey && e.buttons&resizeWhen){
            //resize
            if(!window.prevcursor){window.prevcursor={x:e.clientX,y:e.clientY}}
            var moddiv=e.target.closest(".modal")
            var cwidth=moddiv.style.width
            moddiv.style.width="fit-content"
            var style=window.getComputedStyle(moddiv)
            var fcwidth=parseInt(style.width)
            moddiv.style.width=cwidth
            //do the same thing for height
            var cheight=moddiv.style.height
            moddiv.style.height="fit-content"
            style=window.getComputedStyle(moddiv)
            var fcheight=parseInt(style.height)
            moddiv.style.height=cheight
            if(!preventDownsize){
                fcwidth=0
                fcheight=0
            }

            style=window.getComputedStyle(moddiv)
            var width=parseInt(style.width)
            var height=parseInt(style.height)
            var deltaX=e.clientX-window.prevcursor.x
            var deltaY=e.clientY-window.prevcursor.y
            if(e.ctrlKey){
                deltaX=-deltaX
                deltaY=-deltaY
            }
            moddiv.style.width=(Math.max(width+deltaX,fcwidth))+"px"
            moddiv.style.height=(Math.max(height-deltaY,fcheight))+"px"
            if(height+deltaY<fcheight){
                console.log("hlim")
                moddiv.style.top=(parseInt(style.top)+deltaY/2)+"px"
            }
            if(width+deltaX<fcwidth){
                moddiv.style.left=(parseInt(style.left)+deltaX/2)+"px"
            }
            rsc("resize",e,moddiv)
            window.prevcursor={x:e.clientX,y:e.clientY}
            return
        }
        if(e.buttons&moveWhen){
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
            rsc("move",e,moddiv)
        }
    }
    return handleModalDrag
}
window.closableWindows=false
function openModal(closable=10,rsc=(a,e,s)=>{},preventDownsize=true){
    var moddiv=document.createElement("div")
    moddiv.classList.add("modal")
    var modbef=document.createElement("div")
    modbef.classList.add("before")
    moddiv.appendChild(modbef)
    app.appendChild(moddiv)
    modbef.addEventListener("mousemove",genHandleModalDrag(rsc,preventDownsize))
    if(window.closableWindows&&closable!==false||closable===true){
        modbef.addEventListener("dblclick",(e)=>{
            e.target.closest(".modal").remove()
            rsc("close",e,moddiv)
        })}
    return [moddiv,modbef]

}
function easyModal(title,text,closable=10,rsc=(a,e,s)=>{},preventDownsize=true,initResize=false){
    let mod=openModal(closable,rsc,preventDownsize)
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
        if (closable===10||closable===true){
            let close=document.createElement("button")
            close.textContent="Close"
            modcont.appendChild(close)
            close.addEventListener("click",()=>{
                moddiv.remove()
            })
        }
    }
    if(initResize){
        rsc("resize",null,moddiv)
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


    await delay(1000) //wait for the DOM to stabilize
    bframe.contentWindow.postMessage({type:"getCanvasSize"},"*") 
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
            <form>
            <input type="password" id="enckeyinput" placeholder="Enter encryption password" autocomplete="new-password"><br>
            <button id="enckeysubmit" type="submit">Submit</button>
            </form>
            `
        document.getElementById("enckeyinput").focus()
        document.addEventListener("click",(e)=>{
            e.preventDefault()
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
            <form>
            <input type="password" id="enckeyinput" placeholder="Enter encryption password" autocomplete="current-password"><br>
            <button type="submit" id="enckeysubmit">Submit</button><br>
            </form>
            <button id="cleardata" class="red" style="float:right">Clear data</button>
            `
        document.getElementById("enckeyinput").focus()
        mod[0].style.left="15%"
        mod[0].style.top="22%" //idk aesthetics
        document.addEventListener("click",(e)=>{
            e.preventDefault()
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
                        let errmod=easyModal("Error","Incorrect password",true)
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
    /*
        let mod=easyModal("","")
    mod[1].remove()
    mod[2].innerHTML=`
        <span class="huge mono">HackerOS</span><br>
        <p>(login successful, OS will be implemented)
        </p>
        `*/
    window.closableWindows=true
    welcome()
    // github()
    var taskbar=openModal()
    taskbar[1].remove() //we dont need a titlebar
    taskbar[0].style.top="95%"
    taskbar[0].style.height="fit-content"
    taskbar[0].classList.add("dock")
    var style=window.getComputedStyle(taskbar[0])
    console.log(style.height)
    taskbar[0].style.height=style.height
    taskbar[0].innerHTML=`
        <img src="welcomeicon.png" class="appicon" onclick="welcome()">
        <img src="githubicon.png" class="appicon" onclick="iframeModal('GitHub','https://tanjim.org/github.com/?homepage#/itzmetanjim/hackeros')">
        `
}
function welcome(){
    var welcome=easyModal("Welcome!","",true)
    welcome[2].innerHTML=`
        <span class="huge mono">HackerOS</span><br>
        <p>Welcome to HackerOS, a webOS designed for hackers</p>
        <p><strong>To move a window:</strong> Click and drag the titlebar of the window.</p>
        <p><strong>To close a window:</strong> Double click the titlebar, or click the close button if there is one.<br>
        Some windows can not be closed, like the log in window.</p>
        <p><strong>To open a window:</strong> Use the dock at the bottom </p>
        <p><strong>To resize a window:</strong> Hold shift and drag the titlebar. Hold ctrl to resize in the opposite direction<br>
        You cannot make a window smaller than its content, so it 
        </p>
        `
}
async function github(){
    alert("there is a bug: use the generic app modal")
    rsc=(a,e,s)=>{
        
        if(a==="resize2"){
            console.log("resize2")
            frame.style.marginBottom="-40px"
            return
        }
        
        if(a!="resize"){return}
        if(!frame){return}
        // console.log(s.getBoundingClientRect().width,s.getBoundingClientRect().height)
        let GBCR=s.getBoundingClientRect()
        frame.width=(GBCR.width -3)
        frame.height=(GBCR.height -22)
        // frame.src=frame.src
    }
    var scale=1
    var github=easyModal("GitHub","",true,rsc,false,true)
    if(window.innerHeight>800){
    github[2].innerHTML=`
    <iframe src='https://tanjim.org/github.com/?homepage#/itzmetanjim/hackeros' width="700" height="700"></iframe>
    `
    }else{
        github[2].innerHTML=`
        <iframe src='https://tanjim.org/github.com/?homepage#/itzmetanjim/hackeros' width="600" height="600"></iframe>
        `

    }
    var frame=github[2].querySelector("iframe")
    // frame.width=github[0].offsetWidth
    // frame.height=github[0].offsetHeight
    // console.log(github[0].offsetWidth,github[0].offsetHeight)
    frame.style.margin="0"
    var flag=false
    frame.addEventListener("load",()=>{
        if(flag){return}
        flag=true
        rsc("resize2",null,github[0])
    })
    // console.log(github[0].getBoundingClientRect().width,github[0].getBoundingClientRect().height)
    // frame.width=github[0].getBoundingClientRect().width -1
    // frame.height=github[0].getBoundingClientRect().height -20

}
function iframeModal(title,url,h1=700,thres=800,h2=600){
    rsc=(a,e,s)=>{

        if(a==="resize2"){
            console.log("resize2")
            frame.style.marginBottom="-40px"
            return
        }

        if(a!="resize"){return}
        if(!frame){return}
        // console.log(s.getBoundingClientRect().width,s.getBoundingClientRect().height)
        let GBCR=s.getBoundingClientRect()
        frame.width=(GBCR.width -3)
        frame.height=(GBCR.height -22)
        // frame.src=frame.src
    }
    // var scale=1
    var appmodal=easyModal(title,"",true,rsc,false,true)
    if(window.innerHeight>thres){
    appmodal[2].innerHTML=`
    <iframe src='${url}' width="${h1}" height="${h1}"></iframe>
    `
    }else{
        appmodal[2].innerHTML=`
        <iframe src='${url}' width="${h1}" height="${h1}"></iframe>
        `

    }
    var frame=appmodal[2].querySelector("iframe")
    // frame.width=appmodal[0].offsetWidth
    // frame.height=appmodal[0].offsetHeight
    // console.log(appmodal[0].offsetWidth,appmodal[0].offsetHeight)
    frame.style.margin="0"
    var flag=false
    frame.addEventListener("load",()=>{
        if(flag){return}
        flag=true
        rsc("resize2",null,appmodal[0])
    })
    // console.log(appmodal[0].getBoundingClientRect().width,appmodal[0].getBoundingClientRect().height)
    // frame.width=appmodal[0].getBoundingClientRect().width -1
    // frame.height=appmodal[0].getBoundingClientRect().height -20

}
window.welcome=welcome
//loading screen
let loadmod=easyModal("")
loadmod[1].remove()
loadmod[2].innerHTML=`
    <span class="huge mono">HackerOS</span><br>
    <p>Loading...</p>
    `
window.addEventListener("load",run)
