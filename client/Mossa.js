class Mossa{
    constructor(x,y,flagmode,author,time){
      this.time = time||(new Date().getTime());
      this.x=x;
      this.y=y;
      this.flagmode=flagmode;
      this.author=author||"a"
    }
    undo(){
      let x=this.x, y=this.y;
      if (this.flagmode){
        griglia[y][x].flag = !griglia[y][x].flag;
      }else{
        griglia[y][x].visible = !griglia[y][x].visible;
      }
    }
    redo(){
      let x=this.x, y=this.y;
      if (this.flagmode){
        griglia[y][x].flag = !griglia[y][x].flag;
      }else{
        griglia[y][x].visible = !griglia[y][x].visible;
      }
    }
  }
  