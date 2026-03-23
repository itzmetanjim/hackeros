const bframe=document.getElementById("backgroundframe");

bframe.addEventListener("load",()=>{
    const doc=bframe.contentDocument||bframe.contentWindow.document;
    try{
        doc.getElementById("ui").style.display="none";
    }catch(e){console.error(e)}

})
bframe.width=window.innerWidth;
bframe.height=window.innerHeight;

window.addEventListener("resize",()=>{
    bframe.width=window.innerWidth;
    bframe.height=window.innerHeight;
})
