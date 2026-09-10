/* Material studies: each texture has distinct geometry and motion.
   Everything is drawn locally. No textures, image requests or per-frame allocations of buffers. */
(function(root){
  const TAU=Math.PI*2;
  const rand=(i)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(110,105,170,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
  function ellipse(c,x,y,rx,ry,angle,color){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fillStyle=color;c.fill();}
  function line(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function mist(c,w,h,t,p){
    c.globalCompositeOperation='screen';
    for(let i=0;i<18;i++){const x=w*(.16+rand(i)*.68)+Math.sin(t*.22+i)*w*.12,y=h*(.25+rand(i+30)*.46)+Math.cos(t*.15+i)*h*.06;glow(c,x,y,w*(.15+rand(i+70)*.18),`rgba(${155+i%3*12},${163+i%4*5},211,${.025+p*.02})`);}
    c.globalCompositeOperation='source-over';for(let i=0;i<12;i++){const y=h*(.25+i*.035);c.beginPath();c.moveTo(w*.1,y);c.bezierCurveTo(w*.35,y-25*Math.sin(t*.3+i),w*.6,y+20,w*.9,y);c.strokeStyle=`rgba(195,203,237,${.014+i%3*.006})`;c.stroke();}
  }
  function glue(c,w,h,t,p){
    // Two sticky surfaces pull apart. Their joining membrane narrows into threads.
    const stretch=.5-.5*Math.cos(t*.48),spread=w*(.12+stretch*.11),cx=w*.5,cy=h*.45;
    const left=cx-spread,right=cx+spread,r=w*.115,sag=h*(.035+stretch*.045+p*.025);
    glow(c,cx,cy,w*.37,'rgba(165,132,193,.14)');
    for(let i=0;i<9;i++){
      const offset=(i-4)*r*.19,thickness=r*(.11-stretch*.075)*(1-Math.abs(i-4)*.08);
      const ya=cy+offset+Math.sin(t*.36+i)*3,yb=cy+offset+Math.cos(t*.31+i)*3;
      c.beginPath();c.moveTo(left,ya-thickness*2.4);
      c.bezierCurveTo(left+r*.9,ya+ sag,right-r*.9,yb+sag,right,yb-thickness*2.4);
      c.lineTo(right,yb+thickness*2.4);
      c.bezierCurveTo(right-r*.9,yb+sag+thickness,left+r*.9,ya+sag+thickness,left,ya+thickness*2.4);c.closePath();
      const g=c.createLinearGradient(0,ya-8,0,ya+sag+10);g.addColorStop(0,'#dbc3e68c');g.addColorStop(.45,'#9679ad6e');g.addColorStop(.72,'#4f3b655c');g.addColorStop(1,'#e9d8eea6');c.fillStyle=g;c.fill();
      c.beginPath();c.moveTo(left,ya);c.bezierCurveTo(left+r*.9,ya+sag,right-r*.9,yb+sag,right,yb);c.strokeStyle='rgba(236,218,243,'+(.22+stretch*.18)+')';c.lineWidth=.65;c.stroke();
    }
    for(const [x,direction] of [[left,-1],[right,1]]){
      c.beginPath();c.moveTo(x,cy-r*.95);
      c.bezierCurveTo(x+direction*r*1.65,cy-r*1.7,x+direction*r*1.7,cy+r*1.2,x,cy+r);
      c.bezierCurveTo(x-direction*r*.3,cy+r*.7,x-direction*r*.32,cy-r*.55,x,cy-r*.95);c.closePath();
      const g=c.createLinearGradient(x-r,cy-r,x+r,cy+r);g.addColorStop(0,'#e3c7efb0');g.addColorStop(.26,'#ac8fc8a6');g.addColorStop(.6,'#664978a8');g.addColorStop(1,'#ceb0d990');c.fillStyle=g;c.fill();c.strokeStyle='#efd8f355';c.stroke();
      c.beginPath();c.moveTo(x+direction*r*.42,cy-r*.8);c.bezierCurveTo(x+direction*r*.9,cy-r*.7,x+direction*r,cy-r*.18,x+direction*r*.94,cy+r*.12);c.strokeStyle='#fae8ff99';c.lineWidth=2;c.stroke();
    }
    // Tiny beads caught on stretched strands move slowly toward their anchors.
    for(let i=0;i<11;i++){const u=.1+rand(i)*.8,x=left+(right-left)*u,y=cy+(i%5-2)*r*.19+Math.sin(Math.PI*u)*sag*.8;ellipse(c,x,y,1.5+rand(i+5)*2,2.3+stretch*2,0,'#e8cfee66');}
  }
  // Pigment drains out of a folded luminous surface, leaving silver contour traces.
  function fade(c,w,h,t,p){
    const phase=.5+.5*Math.sin(t*.23),cx=w*.5,cy=h*.45;
    glow(c,cx,cy,w*.4,'rgba(155,161,189,.12)');
    for(let layer=0;layer<64;layer++){
      const v=layer/63,base=h*(.25+v*.39),age=Math.max(0,Math.min(1,(v-phase*.55+.15)*1.7+p*.23));
      const saturation=72*(1-age),light=69-age*18;
      c.beginPath();
      for(let j=0;j<=80;j++){
        const u=j/80,x=w*(.15+u*.7),envelope=Math.sin(u*Math.PI);
        const y=base+Math.sin(u*5.8+v*3+t*.12)*h*.065*envelope+Math.sin(u*12-v*4)*h*.022;
        j?c.lineTo(x,y):c.moveTo(x,y);
      }
      const g=c.createLinearGradient(w*.15,0,w*.85,0);
      g.addColorStop(0,'rgba(166,174,196,0)');
      g.addColorStop(.2,'hsla('+(208+v*70)+','+saturation+'%,'+light+'%,.48)');
      g.addColorStop(.62,'hsla('+(245+v*45)+','+(saturation*.55)+'%,'+(light+9)+'%,.62)');
      g.addColorStop(1,'rgba(179,183,196,0)');
      c.strokeStyle=g;c.lineWidth=1.3;c.stroke();
    }
    // Desaturated fragments drift away from the continuous fabric.
    for(let i=0;i<170;i++){
      const u=rand(i),travel=(rand(i+400)+t*.014)%1;
      const x=w*(.18+u*.65)+travel*w*.035,y=h*(.39+rand(i+170)*.22)+travel*h*.14;
      c.fillStyle='rgba(207,210,220,'+((1-travel)*.28)+')';c.fillRect(x,y,.6+rand(i+30)*1.2,.7);
    }
  }
  // Grain, not waveforms: a dense field of independent, irregular specks.
  const grain=Array.from({length:6800},(_,i)=>({x:rand(i),y:rand(i+7200),seed:rand(i+14400),size:.55+rand(i+21600)*1.15}));
  function noise(c,w,h,t,p){
    const cx=w*.5,cy=h*.46,rx=w*.36,ry=h*.29;
    glow(c,cx,cy,w*.38,'rgba(176,164,193,.11)');
    for(let i=0;i<grain.length;i++){
      const g=grain[i],dx=(g.x-.5)*2,dy=(g.y-.5)*2,dist=dx*dx+dy*dy;
      if(dist>1)continue;
      const edge=Math.pow(1-dist,.48),flicker=.5+.5*Math.sin(t*(4+g.seed*9)+g.seed*230);
      const x=cx+dx*rx+Math.sin(t*2.1+g.seed*80)*(.8+p*1.3),y=cy+dy*ry+Math.cos(t*1.7+g.seed*150)*.9;
      const shade=135+Math.floor(g.seed*100),alpha=edge*(.1+flicker*.52);
      c.fillStyle=i%17?'rgba('+shade+','+(shade-3)+','+Math.min(255,shade+10)+','+alpha+')':'rgba(188,170,216,'+(alpha*.7)+')';
      c.fillRect(x,y,g.size*(1+p*.3),g.size);
    }
    // Coarser irregular grains interrupt the fine static without forming scan lines.
    for(let i=0;i<150;i++){const a=rand(i+33)*TAU,r=Math.sqrt(rand(i+90)),alpha=(1-r)*(.12+.16*Math.sin(t*2+ i)**2);c.fillStyle='rgba(231,221,240,'+alpha+')';c.fillRect(cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r,1.4+rand(i)*2.3,1.5);}
  }
  // A dense suspended mass deforms the illuminated field beneath it.
  function heavy(c,w,h,t,p){
    const cx=w*.5,load=.62+p*.38,settle=Math.sin(t*.32)*.006;
    const cy=h*(.36+p*.035+settle),rx=w*.205,ry=h*.185;
    glow(c,cx,h*.58,w*.36,'rgba(143,119,173,.1)');
    // Curved horizontal strata make downward pressure legible even when paused.
    for(let row=0;row<27;row++){
      const v=row/26,base=h*(.48+v*.25),depth=h*.16*load*(1-v*.62);
      c.beginPath();
      for(let j=0;j<=90;j++){
        const u=j/90,x=w*(.07+u*.86),d=(u-.5)/(.23+v*.1);
        const y=base+depth*Math.exp(-d*d*2.4);
        j?c.lineTo(x,y):c.moveTo(x,y);
      }
      c.strokeStyle='rgba(185,166,210,'+(.25-v*.17)+')';c.lineWidth=row%5? .8:1.3;c.stroke();
    }
    // Cross-lines describe a depressed, tensioned mesh rather than a flat pedestal.
    for(let column=0;column<19;column++){
      const u=column/18,d=(u-.5)/.27;c.beginPath();
      for(let j=0;j<=25;j++){
        const v=j/25,x=w*(.07+u*.86),y=h*(.48+v*.25)+h*.16*load*(1-v*.62)*Math.exp(-d*d*2.4);
        j?c.lineTo(x,y):c.moveTo(x,y);
      }
      c.strokeStyle='#aa93c518';c.lineWidth=.7;c.stroke();
    }
    ellipse(c,cx,cy+ry*.97,rx*.9,h*.025,0,'#080910aa');
    // Irregular, densely shaded contours; upper rim catches a narrow cold light.
    function outline(){c.beginPath();for(let j=0;j<=100;j++){const a=j/100*TAU,rough=1+.025*Math.sin(a*5)+.012*Math.sin(a*11);const x=cx+Math.cos(a)*rx*rough,y=cy+Math.sin(a)*ry*rough;j?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();}
    const g=c.createRadialGradient(cx-rx*.4,cy-ry*.65,rx*.04,cx+rx*.3,cy+ry*.45,rx*1.6);
    g.addColorStop(0,'#a79caf');g.addColorStop(.18,'#696374');g.addColorStop(.48,'#35313f');g.addColorStop(.78,'#181722');g.addColorStop(1,'#0d0e17');
    outline();c.fillStyle=g;c.fill();c.save();outline();c.clip();
    for(let i=0;i<1250;i++){
      const x=cx+(rand(i)*2-1)*rx,y=cy+(rand(i+1300)*2-1)*ry;
      c.fillStyle=i%3?'rgba(9,10,17,.16)':'rgba(218,207,227,.12)';c.fillRect(x,y,.7+rand(i+60)*1.1,.6);
    }
    for(let i=0;i<8;i++){const y=cy-ry*.7+i*ry*.2;c.beginPath();c.moveTo(cx-rx,y);c.bezierCurveTo(cx-rx*.3,y-ry*.12,cx+rx*.2,y+ry*.08,cx+rx,y+ry*.28);c.strokeStyle='#c5b4d30c';c.stroke();}
    c.restore();
    c.beginPath();c.ellipse(cx,cy,rx*.99,ry*.99,0,3.45,5.1);c.strokeStyle='#c9bed773';c.lineWidth=1.1;c.stroke();
    // Slow descending dust reinforces gravity without flashing or bouncing.
    for(let i=0;i<35;i++){const x=w*(.3+rand(i)*.4),f=(rand(i+70)+t*.035)%1,y=h*(.16+f*.46);if(Math.pow((x-cx)/rx,2)+Math.pow((y-cy)/ry,2)<1.12)continue;line(c,[[x,y],[x,y+3+load*4]],'rgba(194,181,209,'+(.12*Math.sin(f*Math.PI))+')',.8);}
  }
  function weightless(c,w,h,t){
    for(let i=0;i<14;i++){const x=w*(.2+rand(i)*.6)+Math.sin(t*.2+i)*12,y=h*(.23+rand(i+33)*.5)-Math.sin(t*.35+i)*13,r=w*(.012+rand(i+90)*.052);const g=c.createRadialGradient(x-r*.3,y-r*.4,0,x,y,r);g.addColorStop(0,'#d9eef138');g.addColorStop(.7,'#9fc0d808');g.addColorStop(.94,'#c5ddeb30');g.addColorStop(1,'#c5ddeb06');ellipse(c,x,y,r,r,0,g);c.beginPath();c.arc(x,y,r*.91,3.7,5.05);c.strokeStyle='#daf3f47a';c.stroke();}
    for(let i=0;i<7;i++){const x=w*(.2+rand(i)*.6),y=h*(.38+rand(i+11)*.3);c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+8,y-25,x-10,y-50,x+3,y-75);c.strokeStyle='#b8dae914';c.stroke();}
  }
  function petrified(c,w,h){
    const vertices=[[.31,.28],[.56,.2],[.73,.36],[.69,.65],[.48,.75],[.26,.59]],center=[w*.47,h*.47];
    vertices.forEach((v,i)=>{const next=vertices[(i+1)%vertices.length];c.beginPath();c.moveTo(...center);c.lineTo(v[0]*w,v[1]*h);c.lineTo(next[0]*w,next[1]*h);c.closePath();c.fillStyle=['#5e5b6e','#484759','#2f303f','#272936','#393947','#555162'][i];c.fill();c.strokeStyle='#a3a0b81e';c.stroke();});
    c.save();c.beginPath();vertices.forEach((v,i)=>i?c.lineTo(v[0]*w,v[1]*h):c.moveTo(v[0]*w,v[1]*h));c.closePath();c.clip();for(let i=0;i<36;i++){const y=h*(.21+i*.016);line(c,[[w*.2,y],[w*.47,y-h*.06],[w*.8,y+h*.03]],`rgba(194,187,210,${i%4?.06:.14})`);}c.restore();
  }
  function hollow(c,w,h,t){
    const x=w*.5,y=h*.47,r=Math.min(w*.25,h*.29);for(let i=18;i>=0;i--){const radius=r*(.6+i*.037);c.beginPath();c.ellipse(x+Math.sin(t*.1+i*.13)*2,y,radius,radius*.89,-.18,0,TAU);c.strokeStyle=`rgba(155,138,189,${.02+(18-i)*.007})`;c.lineWidth=i%4?1:2;c.stroke();}const g=c.createRadialGradient(x,y,0,x,y,r*.69);g.addColorStop(0,'#080912');g.addColorStop(.8,'#0c0d17');g.addColorStop(1,'#11121d');ellipse(c,x,y,r*.69,r*.61,-.18,g);glow(c,x-r*.6,y-r*.3,r*.45,'#c1a5e11a');
  }
  function water(c,w,h,t,p){
    const g=c.createLinearGradient(0,h*.17,0,h*.9);g.addColorStop(0,'#66899227');g.addColorStop(.35,'#24435355');g.addColorStop(1,'#0a152233');c.fillStyle=g;c.fillRect(w*.08,h*.17,w*.84,h*.68);
    for(let i=0;i<12;i++){const y=h*(.2+i*.044);c.beginPath();for(let j=0;j<=45;j++){const x=w*(.08+j/45*.84),yy=y+Math.sin(j*.22+t*.5+i*.45)*(4+i*.7);j?c.lineTo(x,yy):c.moveTo(x,yy);}c.strokeStyle=`rgba(153,203,211,${.11-i*.007})`;c.lineWidth=i<3?2:1;c.stroke();}
    for(let i=0;i<4;i++){c.beginPath();const x=w*(.22+i*.14)+Math.sin(t*.2+i)*10;c.moveTo(x,h*.19);c.lineTo(x+w*.05,h*.83);c.lineTo(x+w*.14,h*.83);c.lineTo(x+5,h*.19);c.fillStyle='#c4dfdf05';c.fill();}
    for(let i=0;i<28;i++){const x=w*(.19+rand(i)*.62),y=h*(.22+(1-(rand(i+44)+t*.015) %1)*.54);c.beginPath();c.arc(x,y,1+rand(i+12)*2.5,0,TAU);c.strokeStyle='#c4e1ea33';c.stroke();}
  }
  function shards(c,w,h,t){
    for(let i=0;i<17;i++){const x=w*(.22+rand(i)*.57),y=h*(.23+rand(i+50)*.49),r=w*(.035+rand(i+11)*.073),a=rand(i+77)*TAU+Math.sin(t*.12+i)*.045;c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(-r,-r*.6);c.lineTo(r*.85,-r*.2);c.lineTo(r*.15,r*1.6);c.closePath();const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#e0e9f86b');g.addColorStop(.4,'#a794bc08');g.addColorStop(.6,'#a7c8e843');g.addColorStop(1,'#4d426208');c.fillStyle=g;c.fill();c.strokeStyle=i%3?'#c5cae961':'#e1d7faad';c.stroke();line(c,[[-r,-r*.6],[r*.15,r*1.6]],'#f4e7fd66');c.restore();}
  }
  const renderers={'迷雾':mist,'胶水':glue,'褪色':fade,'噪点':noise,'沉重':heavy,'失重':weightless,'石化':petrified,'空洞':hollow,'溺水':water,'碎玻璃':shards};
  function draw(c,w,h,t,texture,pressure){c.clearRect(0,0,w,h);c.save();const scale=1+pressure*.08;c.translate(w*.5,h*.5);c.scale(scale,scale);c.translate(-w*.5,-h*.5);(renderers[texture]||mist)(c,w,h,t,pressure);c.restore();}
  root.EchoVisual={draw,renderers};
})(typeof window==='undefined'?this:window);
