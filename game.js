'use strict';
const el=id=>document.getElementById(id), canvas=el('ice'), ctx=canvas.getContext('2d');
const W=320,H=500,mid=160, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const skater=(x,y)=>({x,y,vx:0,vy:0});
const blue=skater(mid,286),red=skater(mid,214),puck=skater(mid,250);
let goalie=[mid,mid],owner=null,mode='intro',points=[0,0],period=1,clock=45,lock=0,cool=0,elapsed=0;
let joy={x:0,y:0},pointer=null,keys=new Set(),previous=0;
function faceoff(){
 Object.assign(blue,skater(mid,282));Object.assign(red,skater(mid,203));Object.assign(puck,skater(mid,250));
 goalie=[mid,mid];owner=null;lock=.12;cool=0;elapsed=0;
}
function menu(state,title,desc,button,tag){
 mode=state;el('panel').hidden=false;el('heading').textContent=title;el('info').textContent=desc;
 el('go').textContent=button;el('tag').textContent=tag;el('action').disabled=el('pause').disabled=true;
 clearInput();
}
function play(){mode='play';el('panel').hidden=true;el('action').disabled=el('pause').disabled=false;}
function pause(){if(mode==='play')menu('pause','Time out','The clock is stopped. Your shift resumes right here.','Resume play','PLAY PAUSED');}
el('pause').onclick=pause;
el('go').onclick=()=>{if(mode==='final'){points=[0,0];period=1;clock=45;}if(mode!=='pause')faceoff();play();hud();};
function hud(){el('home').textContent=points[0];el('away').textContent=points[1];el('period').textContent=period===4?'OVERTIME':'PERIOD '+period;
 el('clock').textContent=period===4?'SD':'0:'+String(Math.ceil(clock)).padStart(2,'0');
 el('action').textContent=owner===blue?'Shoot':'Poke';el('status').textContent=owner===blue?'Your puck ↑':owner===red?'Defend ↓':'Loose puck';}
function finish(){menu('final',points[0]>points[1]?'Frost wins!':'Ember wins!',points[0]+' – '+points[1]+' at the final horn.','Play again','FINAL SCORE');}
function goal(side){points[side]++;hud();if(period===4)return finish();
 menu('goal',side?'Ember scores!':'Frost scores!',points[0]+' – '+points[1]+' · Back to center ice.','Next faceoff','GOAL');}
function shoot(player,aim){
 const dir=player===blue?-1:1, target=dir===-1?13:487;
 const dx=aim-player.x,dy=target-player.y,d=Math.hypot(dx,dy)||1;
 Object.assign(puck,{x:player.x,y:player.y+dir*14,vx:dx/d*435,vy:dy/d*435});owner=null;lock=.23;
}
function action(){if(mode!=='play'||cool>0)return;cool=.23;
 if(owner===blue){const steer=joy.x+Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a'));
 shoot(blue,mid+(Math.abs(steer)>.15?Math.sign(steer):(goalie[0]>=mid?-1:1))*29);}
 else if(Math.hypot(blue.x-puck.x,blue.y-puck.y)<35){owner=blue;lock=.85;}
 hud();}
el('action').onpointerdown=e=>{e.preventDefault();action();};
el('action').onclick=e=>{if(e.detail===0)action();};
function clearInput(){keys.clear();joy={x:0,y:0};pointer=null;el('knob').style.transform='';}
function stickMove(e){if(pointer!==e.pointerId)return;const r=el('stick').getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.max(24,Math.hypot(x,y));
 joy={x:x/d,y:y/d};el('knob').style.transform='translate('+joy.x*22+'px,'+joy.y*22+'px)';}
el('stick').onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;el('stick').setPointerCapture(pointer);stickMove(e);};
el('stick').onpointermove=stickMove;el('stick').onlostpointercapture=e=>{if(e.pointerId===pointer)clearInput();};
onkeydown=e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' ','escape'].includes(k)&&mode==='play'){e.preventDefault();keys.add(k);if(k===' '&&!e.repeat)action();if(k==='escape')pause();}};
onkeyup=e=>keys.delete(e.key.toLowerCase());onblur=pause;document.onvisibilitychange=()=>{if(document.hidden)pause();};
function skate(p,x,y,speed,dt){const d=Math.max(1,Math.hypot(x,y)),f=1-Math.exp(-8*dt);
 p.vx+=(speed*x/d-p.vx)*f;p.vy+=(speed*y/d-p.vy)*f;
 p.x=clamp(p.x+p.vx*dt,19,W-19);p.y=clamp(p.y+p.vy*dt,39,H-39);}
function tick(dt){elapsed+=dt;lock-=dt;cool-=dt;
 if(period<4){clock=Math.max(0,clock-dt);if(clock===0){if(period===3&&points[0]!==points[1]){hud();return finish();}period++;clock=45;hud();return menu('break',period===4?'Sudden death':'Period '+period,period===4?'Next goal wins.':'Switch lines and return to center ice.','Drop the puck','INTERMISSION');}}
 const key=(a,b)=>Number(keys.has(a)||keys.has(b));
 skate(blue,joy.x+key('d','arrowright')-key('a','arrowleft'),joy.y+key('s','arrowdown')-key('w','arrowup'),177,dt);
 const tx=owner===red?mid+Math.sin(elapsed*2)*44:puck.x,ty=owner===red?456:puck.y;
 const dx=tx-red.x,dy=ty-red.y,dist=Math.max(10,Math.hypot(dx,dy));skate(red,dx/dist,dy/dist,owner===red?134:142,dt);
 if(owner===red&&red.y>365&&lock<=0)shoot(red,mid+(goalie[1]>mid?-1:1)*(15+Math.random()*16));
 if(owner===blue&&lock<=0&&Math.hypot(red.x-blue.x,red.y-blue.y)<15){owner=red;lock=.9;}
 for(let i=0;i<2;i++){const target=clamp(mid+(puck.x-mid)*.57,mid-28,mid+28);goalie[i]+=clamp(target-goalie[i],-58*dt,58*dt);}
 if(owner){puck.x=owner.x+5;puck.y=owner.y+(owner===blue?-12:12);}
 else {puck.x+=puck.vx*dt;puck.y+=puck.vy*dt;const drag=Math.exp(-.48*dt);puck.vx*=drag;puck.vy*=drag;
 if(puck.x<11||puck.x>309){puck.x=clamp(puck.x,11,309);puck.vx*=-.86;}
 for(let i=0;i<2;i++){const y=i?466:34,sign=i?-1:1;
 if(Math.abs(puck.x-goalie[i])<14&&Math.abs(puck.y-y)<9&&puck.vy*sign<0){puck.vy=sign*Math.max(110,Math.abs(puck.vy)*.72);puck.vx+=(puck.x-goalie[i])*7;lock=.08;}}
 if(puck.y<14||puck.y>486){if(Math.abs(puck.x-mid)<35)return goal(puck.y<14?0:1);puck.y=clamp(puck.y,14,486);puck.vy*=-.84;}
 if(lock<=0){const near=[blue,red].sort((a,b)=>Math.hypot(a.x-puck.x,a.y-puck.y)-Math.hypot(b.x-puck.x,b.y-puck.y))[0];
 if(Math.hypot(near.x-puck.x,near.y-puck.y)<14){owner=near;lock=.65;}}}
 hud();}
const c=ctx;
function circle(x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,2*Math.PI);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.2;c.stroke();}}
function line(x,y,X,Y,color,width){c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function player(x,y,blueTeam,keeper=false){c.save();c.translate(x,y);if(!blueTeam)c.rotate(Math.PI);
 const color=blueTeam?'#167ba7':'#e75b39',outline='#223947';
 line(-4,8,-6,13,outline,3);line(4,8,6,13,outline,3);
 line(7,1,11,-12,outline,2);line(11,-12,6,-13,outline,2.5);
 if(keeper){line(-8,-1,-8,8,'#edf5fa',5);line(8,-1,8,8,'#edf5fa',5);}
 c.fillStyle=outline;c.fillRect(-7,-2,14,12);
 c.fillStyle=color;c.beginPath();c.roundRect(-9,-5,18,13,4);c.fill();line(-8,4,8,4,'#f9eecf',2);
 circle(0,-4,5,outline);line(-3,-5,3,-5,color,2);c.restore();}
function draw(){const box=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2),w=Math.round(box.width*ratio),h=Math.round(box.height*ratio);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}if(!w||!h)return;
 const s=Math.min(w/W,h/H);c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.setTransform(s,0,0,s,(w-W*s)/2,(h-H*s)/2);
 c.save();c.beginPath();c.roundRect(5,7,310,486,36);c.fillStyle='#e5f3f4';c.fill();c.strokeStyle='#7798a9';c.lineWidth=5;c.stroke();c.clip();
 for(let i=0;i<145;i++){let x=(i*73)%320,y=(i*97)%500;line(x,y,x+7+(i%21),y-4,'#bad6da60',.7);}
 const redLine='#d59192',blueLine='#719fb8';for(const y of [158,342])line(4,y,316,y,blueLine,4);
 line(4,250,316,250,redLine,3);
 for(const y of [94,406])for(const x of [79,241]){circle(x,y,33,null,redLine);circle(x,y,2.8,redLine);
 for(const sign of [-1,1]){line(x+sign*8,y-6,x+sign*8,y+6,redLine,1.2);}}
 circle(mid,250,41,null,blueLine);c.save();c.translate(mid,250);c.rotate(-.16);c.fillStyle='#91b3be';c.textAlign='center';c.font='italic 900 19px system-ui';c.fillText('POCKET',0,-1);c.fillText('RINK',0,16);c.restore();
 for(const y of [21,479]){const side=y<250?1:-1;c.save();c.translate(mid,y);c.scale(1,side);c.beginPath();c.arc(0,0,34,0,Math.PI);c.fillStyle='#b2d9e4';c.fill();line(-153,0,153,0,redLine,1.3);c.fillStyle='#f7faf8';c.fillRect(-35,-12,70,12);
 for(let k=-32;k<35;k+=5)line(k,-12,k,0,'#9aaeb4',.8);line(-35,-6,35,-6,'#9aaeb4',.7);c.strokeStyle='#b5534c';c.lineWidth=2.5;c.strokeRect(-35,-12,70,12);c.restore();}
 c.restore();player(goalie[0],34,false,true);player(goalie[1],466,true,true);
 circle(blue.x,blue.y,15,null,'#1587b7');player(blue.x,blue.y,true);player(red.x,red.y,false);
 circle(puck.x,puck.y,4.2,'#142230','#fff');}
function frame(t){let dt=Math.min(.06,(t-previous)/1000);previous=t;while(mode==='play'&&dt>.00001){const step=Math.min(dt,1/120);tick(step);dt-=step;}draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
