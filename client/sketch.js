const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const key = urlParams.get('key');
const socket = new WebSocket('wss://minesweeper2357.onrender.com')
//const socket = new WebSocket('ws://127.0.0.1:3000')
socket.onopen = ()=>{
  socket.send(JSON.stringify({event:'join', key: key}));
}

let movesStack = [];
let flagmode=false
let flagbutton;
let sconfitta = false
let vittoria_disconnessione=false;

puntiFlagstealA=0;
puntiFlagstealB=0;

socket.onmessage = (msg)=>{
  const tmp = JSON.parse(msg.data);
  switch (tmp.event){
    case "mossa2":
      registraMossa(
        tmp.mossa.x,
        tmp.mossa.y,
        tmp.mossa.flagmode,
        tmp.mossa.author,
        tmp.mossa.time
      );
      break;
    case "start":
      generaMappa(tmp.seed);
      movesStack = [];
      flagmode=false
      sconfitta = false
      vittoria_disconnessione=false
      loop();
      break;
    case "enemy_disconnected":
      vittoria_disconnessione=true;
      break;
  }
};

let griglia,celle;
const w=30,h=16;
let lato = 19
let Nbombe = Math.floor((w*h)*0.20625)
//let Nbombe = Math.floor((w*h)*0.01025)






function generaMappa(seed){
  randomSeed(seed)
  griglia = [];
  for (let i=0; i<h; i++){
    griglia.push([]);
    for (let j=0; j<w; j++){
      griglia[i].push(new Cella(j,i))
    }
  }
  celle = [];
  for (let riga of griglia)
    celle.push(...riga)
  
  //piazza le bombe
  let i=0;
  while (i<Nbombe){
    let x = Math.floor(random(w));
    let y = Math.floor(random(h));
    if (!griglia[y][x].bomba){
      griglia[y][x].bomba=true;
      
      for (let p=max(0,y-1); p<min(h,y+2); p++){
        for (let j=max(0,x-1); j<min(w,x+2); j++){
          griglia[p][j].numero++;
        }
      }     
      i++
    }
  }
  let eletto;
  for (let cella of celle.filter((c)=>{return c.numero==0})){
    if (!eletto)eletto=cella;
    if (dist(eletto.x,eletto.y,w/2,h/2)>dist(cella.x,cella.y,w/2,h/2))
      eletto=cella
  }
  if(eletto)eletto.click();
}


function setup() {
  noLoop();
  createCanvas(w*lato, h*lato);
  //crea le celle

  flagbutton = createButton("select flag");
  flagbutton.mousePressed(bottone);
  
  textFont('Helvetica', lato-1);

  for (let element of document.getElementsByClassName("p5Canvas")) {
    element.addEventListener("contextmenu", (e) => e.preventDefault());
  }

}

function draw() {
  background(220);
  
  stroke(0);
  noStroke()
  textAlign(CENTER, CENTER);
  textSize(lato-1);
  
  for (let i=0; i<h; i++){
    for (let j=0; j<w; j++){
      let cella = griglia[i][j];
      
      if (!cella.visible){
        fill(240);
        rect(j*lato,i*lato,lato,lato)
        if (cella.flag){
          //fill(100)
          fill(cella.lastClick=="a"?color(0,190,190):cella.lastClick=="b"?color(190,0,190):100)
          text("⚐",(j+0.5)*lato,(i+0.5)*lato+1);
        }
      }
      if (cella.visible){
//        fill(100)
        fill(cella.lastClick=="a"?color(0,190,190):cella.lastClick=="b"?color(190,0,190):100)
        if (cella.bomba)
          text("*",(j+0.5)*lato,(i+0.5)*lato+1)
        else
          text(cella.numero==0?"":cella.numero,(j+0.5)*lato,(i+0.5)*lato+1)        
      }
    }
  }
  if (sconfitta){
    for (let cella of celle.filter((c)=>{return c.bomba})){
      if (cella.flag){
        fill(0,190,0);
        stroke(0,190,0);
        noStroke()
        text("⚐",(cella.x+0.5)*lato,(cella.y+0.5)*lato+1);        
      }else{
        fill(190,0,0);
        stroke(190,0,0);
        noStroke();
        text("*",(cella.x+0.5)*lato,(cella.y+0.5)*lato+1);
      }
    }
    annunciaPunteggio();
    noLoop();
  }
  if (vittoria()){
    for (let cella of celle.filter((c)=>{return c.bomba})){
        fill(0,190,0);
        noStroke();  
        text("⚐",(cella.x+0.5)*lato,(cella.y+0.5)*lato+1);  
    }
    annunciaPunteggio();
    noLoop();
  }
}

function annunciaPunteggio(){
  let puntia = puntiFlagstealA;
  let puntib = puntiFlagstealB;
  let looser;
  for (let cella of celle){
    if (cella.flag && cella.bomba && !cella.visible){
      if (cella.lastClick=="a")
        puntia++;
      else
        puntib++;
    }
    if (cella.bomba && cella.visible){
      if (cella.lastClick=="a")
        looser = "a";
      else
        looser = "b";
    }
  }
  if (vittoria_disconnessione) looser="b";
  textSize(74);
  noStroke();
  if (looser == "a" || (!looser && puntia<puntib) ){
    fill(190,0,0)
    text("HAI PERSO",width/2,height/2);
  }
  if (looser == "b" || (!looser && puntib<puntia) ){
    fill(0,190,0)
    text("HAI VINTO",width/2,height/2);
  }
  if (!looser && puntia==puntib){
    fill(190,190,0);
    text("PAREGGIO",width/2,height/2)
  }
}

function vittoria(){
  if (vittoria_disconnessione) return true;
  let ret = false;
  if (celle.filter((c)=>{return c.visible && !c.bomba}).length == w*h-Nbombe){
    ret = true;
  }
  return ret;
}

function mousePressed(eve){
  if (mouseX<0||mouseX>width||mouseY<0||mouseY>height) return; 
  if (eve.type=="touchstart" || eve.type=="touchend") return;

  let x = Math.floor(mouseX/lato)
  let y = Math.floor(mouseY/lato)

  if (!sconfitta && !vittoria()){
    registraMossa(x,y,eve.button==0?flagmode:!flagmode, "a")
  }
}

let clickDuration = 300;
let beginTouch;
let touchTimeout;
function touchStarted(){
    if (mouseX<0||mouseX>width||mouseY<0||mouseY>height) return; 
    beginTouch = new Date();
    let x = Math.floor(mouseX/lato)
    let y = Math.floor(mouseY/lato)

    touchTimeout = setTimeout(()=>{
        if (window.navigator && window.navigator.vibrate){
            window.navigator.vibrate(200);
            if (!sconfitta && !vittoria())
                registraMossa(x,y,!flagmode, "a")
        }
    }, clickDuration);
    return false;
}
function touchEnded(){
    if (mouseX<0||mouseX>width||mouseY<0||mouseY>height) return; 
    let x = Math.floor(mouseX/lato)
    let y = Math.floor(mouseY/lato)
  
    let tap = new Date()-beginTouch<clickDuration;

    if (tap){
        clearTimeout(touchTimeout);
        if (!sconfitta && !vittoria())
            registraMossa(x,y,flagmode, "a")
    }
    return false;
}


function registraMossa(x,y,flagmode,author,time){
  if (griglia[y][x].flag && griglia[y][x].lastClick=="b" && flagmode && !author) return;
  time = time||(new Date().getTime())

  if (!flagmode && griglia[y][x].flag && griglia[y][x].lastClick != author||"a"){
    if (author=="b")
      puntiFlagstealB++
    else
      puntiFlagstealA++
  }

  mossa = new Mossa(
    x,
    y,
    flagmode,
    author,
    time
  );
  movesStack.push(mossa);
  griglia[y][x].click(flagmode,author||"a");

  if (griglia[y][x].visible && griglia[y][x].bomba){
    sconfitta=true;
  }

  if (author=="a"){
    //socket.emit('mossa',mossa)
    socket.send(JSON.stringify({event:'mossa',mossa:mossa}))
  }
}



function bottone(){
  flagmode = !flagmode;
  if (flagmode){
    flagbutton.html ("select shovel")
  }else{
    flagbutton.html ("select flag")
  }
}

window.onbeforeunload = function(){
  socket.send(JSON.stringify({event:'leave'}));
};


//⚐⚑




