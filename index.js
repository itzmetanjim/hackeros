const bframe=document.getElementById("backgroundframe");
bframe.addEventListener("load",()=>{
    const doc=bframe.contentDocument||bframe.contentWindow.document;
    try{
        doc.getElementById("ui").style.display="none";
    }catch(e){console.error(e)}

})
