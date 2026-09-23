/* Standalone Shopify-friendly interaction. This gag intentionally never plays audio. */
(() => {
  function mount(root) {
    if (root.dataset.mounted) return;
    root.dataset.mounted = 'true';
    const area=root.querySelector('.playground'), button=root.querySelector('.play-button');
    const status=root.querySelector('[role="status"]');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const controller=new AbortController(), opts={signal:controller.signal};
    let x=0,y=0,tx=0,ty=0,vx=0,vy=0,w=0,h=0,size=0,attempts=0,raf=0,last=0,lastEscape=-1000;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const messages=['stay in touch','knapp daneben','heute leider nicht','willst du','so raus'];
    function paint(){
      const speed=Math.hypot(vx,vy),stretch=reduced.matches?0:Math.min(speed*.00013,.075);
      const angle=Math.atan2(vy,vx)*180/Math.PI;
      button.style.transform=`translate3d(${x}px,${y}px,0) rotateX(${reduced.matches?0:clamp(-vy*.015,-12,12)}deg) rotateY(${reduced.matches?0:clamp(vx*.015,-12,12)}deg) rotate(${angle}deg) scale(${1+stretch},${1-stretch}) rotate(${-angle}deg)`;
    }
    function frame(now){
      const dt=Math.min((now-last)/1000||1/60,.032);last=now;
      vx+=(145*(tx-x)-20*vx)*dt;vy+=(145*(ty-y)-20*vy)*dt;
      x=clamp(x+vx*dt,12,Math.max(12,w-size-12));y=clamp(y+vy*dt,12,Math.max(12,h-size-12));paint();
      if(Math.hypot(tx-x,ty-y)>.1||Math.hypot(vx,vy)>.5)raf=requestAnimationFrame(frame);
      else{x=tx;y=ty;vx=vy=0;paint();raf=0}
    }
    function animate(){if(!raf){last=performance.now();raf=requestAnimationFrame(frame)}}
    function measure(){w=area.clientWidth;h=area.clientHeight;size=button.offsetWidth;x=tx=(w-size)/2;y=ty=(h-size)/2;vx=vy=0;paint()}
    function dodge(px,py,explicit=false){
      const now=performance.now();if(!explicit&&now-lastEscape<350)return;lastEscape=now;
      status.textContent=messages[attempts++%messages.length];
      // Reduced motion preserves the joke through text, without moving the target.
      if(reduced.matches)return;
      const margin=22, maxX=Math.max(margin,w-size-margin), maxY=Math.max(margin,h-size-margin);
      const away=Math.atan2(y+size/2-py,x+size/2-px);
      const candidates=[];
      // Continuous angles and distances avoid repeated corner-to-corner flights.
      for(let i=0;i<36;i++){
        const angle=away+(Math.random()-.5)*Math.PI*1.7;
        const distance=Math.min(w,h)*(.3+Math.random()*.48);
        const nx=clamp(x+Math.cos(angle)*distance,margin,maxX);
        const ny=clamp(y+Math.sin(angle)*distance,margin,maxY);
        const travel=Math.hypot(nx-x,ny-y);
        const clearance=Math.hypot(nx+size/2-px,ny+size/2-py);
        if(travel>Math.min(95,Math.min(w,h)*.3)&&clearance>size*.85)candidates.push([nx,ny]);
      }
      if(candidates.length)[tx,ty]=candidates[Math.floor(Math.random()*candidates.length)];
      else{tx=x<(w-size)/2?maxX:margin;ty=y<(h-size)/2?maxY:margin;}
      const heading=Math.atan2(ty-y,tx-x),side=Math.random()<.5?-1:1;
      // A small sideways impulse curves the spring trajectory without teleporting.
      vx+=Math.cos(heading+side*Math.PI/2)*160;
      vy+=Math.sin(heading+side*Math.PI/2)*160;
      animate();
    }
    area.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches||button.matches(':focus-visible'))return;const r=area.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;if(Math.hypot(px-x-size/2,py-y-size/2)<size/2+85)dodge(px,py)},opts);
    button.addEventListener('pointerdown',e=>{const r=area.getBoundingClientRect();dodge(e.clientX-r.left,e.clientY-r.top,true)},opts);
    button.addEventListener('click',e=>{e.preventDefault();if(e.detail===0)dodge(x+size/2,y+size/2,true)},opts);
    reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(raf);raf=0;vx=vy=0;x=tx;y=ty;paint()}},opts);
    const observer=new ResizeObserver(measure);observer.observe(area);measure();
    root.cleanup=()=>{controller.abort();observer.disconnect();cancelAnimationFrame(raf);delete root.dataset.mounted};
  }
  document.querySelectorAll('[data-album-teaser]').forEach(mount);
  document.addEventListener('shopify:section:load',e=>e.target.querySelectorAll('[data-album-teaser]').forEach(mount));
  document.addEventListener('shopify:section:unload',e=>e.target.querySelectorAll('[data-album-teaser]').forEach(root=>root.cleanup?.()));
})();
