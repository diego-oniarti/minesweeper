const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const key = urlParams.get('key');
let t = urlParams.get('tempo');
if (isNaN(parseFloat(t)))
  t=3
t = parseFloat(t)
let tempo = t*1000;

const socket = new WebSocket('wss://minesweeper2357.onrender.com')
//const socket = new WebSocket('ws://127.0.0.1:3000')
socket.onopen = ()=>{
  socket.send(JSON.stringify({event:'join', key: key, tempo: tempo}));
}
const w=30;
const h=16;
aaaa=true
let vittoria_disconnessione=false;
let turno=false;
let primoTurno=false
let inizioTurno= new Date();
let gameStarted=false;
let gameStartTime=0
let overtime=false
let overtimeNemico=false
let movesStack = [];
let flagmode=false
let flagbutton;
let sconfitta = false

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
      tempo = tmp.tempo
      generaMappa(tmp.seed);
      gameStarted=true
      gameStartTime=new Date();
      if (tmp.primoTurno){
        primoTurno = true
        turno = true
      }
      aaaa=true
      vittoria_disconnessione=false;
      inizioTurno= new Date();
      overtime=false
      overtimeNemico=false
      movesStack = [];
      flagmode=false
      sconfitta = false
      break;
    case "enemy_disconnected":
      vittoria_disconnessione=true;
      break;
    case "overtime":
        overtimeNemico=true;
        break;
  }
};

let griglia,celle;
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
  if(eletto)eletto.click(false,"c");
}

let lato = 19;
function setup() {
  let w=30;
  let h=16;
  createCanvas(w*lato, h*lato);

  flagbutton = createButton("select flag");
  flagbutton.mousePressed(bottone);
  
  textFont('Helvetica', lato-1);

  for (let element of document.getElementsByClassName("p5Canvas")) {
    element.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  background(220);

}

function draw() {
  if(!gameStarted) return;
  background(220);

  textSize(74);
  noStroke()
  fill(primoTurno?color(0,190,190):color(190,0,190))
  let ms = new Date()-gameStartTime;
  if (ms<1000){
    text("3",width/2,height/2)
    return;
  }
  if (ms<2000){
    text("2",width/2,height/2)
    return;
  }
  if (ms<3000){
    text("1",width/2,height/2)
    return;
  }
  if (aaaa){
    aaaa=false;
    inizioTurno = new Date();
  }
  textSize(17)
  
  let elapsedMs = new Date()-inizioTurno;

  stroke(0);
  noStroke()
  textAlign(CENTER, CENTER);
  
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
  if (turno && elapsedMs>tempo){
      sconfitta=true;
      overtime=true;
      socket.send(JSON.stringify({event:'overtime'}))
  }
  if (sconfitta || overtimeNemico){
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
    return;
  }
  if (vittoria()){
    for (let cella of celle.filter((c)=>{return c.bomba})){
        fill(0,190,0);
        noStroke();  
        text("⚐",(cella.x+0.5)*lato,(cella.y+0.5)*lato+1);  
    }
    annunciaPunteggio();
    noLoop();
    return;
  }

  stroke((turno)?color(0,190,190,50):color(190,0,190,50));
  strokeWeight(15);
  noFill();
  circle(width/2,height/2,height*0.8)
  noStroke()
  fill((turno)?color(0,190,190,50):color(190,0,190,50));
  arc(width/2,height/2,height*0.8-15,height*0.8-15, -PI/2, -PI/2+map(elapsedMs,0,tempo,0,TWO_PI));

}

function annunciaPunteggio(){
  let looser;
  for (let cella of celle){
    if (cella.bomba && cella.visible){
      if (cella.lastClick=="a")
        looser = "a";
      else
        looser = "b";
    }
  }
  textSize(74);
  noStroke();
  if ((looser == "a" || overtime) && !overtimeNemico){
    fill(190,0,0)
    text("HAI PERSO",width/2,height/2);
  }
  if (looser == "b" || vittoria_disconnessione || overtimeNemico){
    fill(0,190,0)
    text("HAI VINTO",width/2,height/2);
  }
  if (!looser && vittoria() && !overtime && !vittoria_disconnessione && !overtimeNemico){
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
  console.log("A")
    if (!turno && author=="a") return
    console.log("B")
  if (griglia[y][x].flag && griglia[y][x].lastClick=="b" && flagmode && author=="a") return;

  if (!flagmode && author!="c"){
      turno=!turno;
      inizioTurno = new Date();
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