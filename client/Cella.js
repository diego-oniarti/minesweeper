class Cella{
    constructor(x,y){
      this.x=x;
      this.y=y;
      this.visible = false;
      this.bomba = false;
      this.numero=0;
      this.flag=false;
      this.lastClick=undefined;
    }
    _click(flagmode,author){
      if (this.visible)return;
          
      if(!flagmode){
        this.visible=true
        if (this.numero==0){
          for (let i=max(0,this.x-1); i<min(w,this.x+2); i++){
            for (let j=max(0,this.y-1); j<min(h,this.y+2); j++){
              griglia[j][i].click(flagmode,author);
            }
          }
        }
      }else{
        this.flag=!this.flag
      }
    }
    
    click(flagmode, author){
      if (!this.visible)
        this.lastClick=author;
      this._click(flagmode,author);
      }
    
    
    calcolaNumero(){
      this.numero=0;
      for (let i=max(0,this.x-1); i<min(w,this.x+2); i++){
        for (let j=max(0,this.y-1); j<min(h,this.y+2); j++){
          if (griglia[j][i].bomba)
            this.numero++
        }
      }
    }
  }
  
  
  
  
  
  
  
  
  
  