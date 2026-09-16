function e(){let e=document.createElement(`article`);e.className=`showcase-card design-study`,e.setAttribute(`aria-labelledby`,`design-study-title`),e.innerHTML=`
    <div class="showcase-card__intro">
      <p class="showcase-kicker">Design study</p>
      <h3 id="design-study-title">A calm place to begin</h3>
      <p class="showcase-card__copy">A small brand system for a thoughtful digital studio. Try the palette and layout controls to see the same idea adapt.</p>
    </div>
    <div class="study-preview" data-layout="editorial">
      <div class="study-preview__topline"><span class="study-mark">S&middot;D</span><span class="study-nav">Notes&nbsp;&nbsp;&nbsp;Practice</span></div>
      <div class="study-preview__body">
        <p class="study-label">SAM DIGITAL / STUDY 01</p>
        <h4>Make room<br><em>for better</em> questions.</h4>
        <p class="study-description">An editorial landing page with a gentle point of view.</p>
        <span class="study-action">Explore the thinking <b aria-hidden="true">↗</b></span>
      </div>
      <div class="study-preview__shape" aria-hidden="true"></div>
    </div>
    <div class="study-controls">
      <fieldset>
        <legend>Palette</legend>
        <button type="button" class="study-choice is-active" data-palette="mint" aria-pressed="true">Mint / ink</button>
        <button type="button" class="study-choice" data-palette="lavender" aria-pressed="false">Lavender / plum</button>
        <button type="button" class="study-choice" data-palette="warm" aria-pressed="false">Warm / moss</button>
      </fieldset>
      <fieldset>
        <legend>Layout</legend>
        <button type="button" class="study-choice is-active" data-layout-choice="editorial" aria-pressed="true">Editorial</button>
        <button type="button" class="study-choice" data-layout-choice="compact" aria-pressed="false">Compact</button>
      </fieldset>
    </div>
  `;let t=e.querySelector(`.study-preview`);return e.querySelectorAll(`[data-palette]`).forEach(n=>{n.addEventListener(`click`,()=>{e.querySelectorAll(`[data-palette]`).forEach(e=>{let t=e===n;e.classList.toggle(`is-active`,t),e.setAttribute(`aria-pressed`,String(t))}),t.dataset.palette=n.dataset.palette})}),e.querySelectorAll(`[data-layout-choice]`).forEach(n=>{n.addEventListener(`click`,()=>{e.querySelectorAll(`[data-layout-choice]`).forEach(e=>{let t=e===n;e.classList.toggle(`is-active`,t),e.setAttribute(`aria-pressed`,String(t))}),t.dataset.layout=n.dataset.layoutChoice})}),e}function t(){let e=document.createElement(`article`);e.className=`showcase-card breakout`,e.setAttribute(`aria-labelledby`,`breakout-title`),e.innerHTML=`
    <div class="showcase-card__intro">
      <p class="showcase-kicker">Playable experiment</p>
      <h3 id="breakout-title">Break the routine</h3>
      <p class="showcase-card__copy">A tiny arcade loop: move the paddle, clear the field, and keep your focus. Nothing starts until you ask it to.</p>
    </div>
    <div class="breakout-shell">
      <canvas class="breakout-canvas" width="560" height="330" tabindex="0" aria-label="Breakout game. Use left and right arrow keys, or drag and tap on the game field."></canvas>
      <p class="breakout-status" role="status" aria-live="polite">Ready when you are.</p>
    </div>
    <div class="breakout-controls">
      <button type="button" class="showcase-button breakout-start">Start</button>
      <button type="button" class="showcase-button breakout-pause" disabled>Pause</button>
      <button type="button" class="showcase-button breakout-restart">Restart</button>
      <span class="breakout-score" aria-label="Score and lives"><b>Score <span data-score>0</span></b><b>Lives <span data-lives>3</span></b></span>
    </div>
    <p class="breakout-hint">Arrow keys or touch the canvas to steer.</p>
  `;let t=e.querySelector(`canvas`),n=t.getContext(`2d`),r=e.querySelector(`.breakout-status`),i=e.querySelector(`[data-score]`),a=e.querySelector(`[data-lives]`),o=e.querySelector(`.breakout-start`),s=e.querySelector(`.breakout-pause`),c=e.querySelector(`.breakout-restart`),l={running:!1,pausedByMotion:!1,pausedByVisibility:!1,frame:0,lastTime:0,score:0,lives:3,paddleX:230,ball:{x:280,y:275,dx:3.1,dy:-3.1,radius:7},bricks:[]},u=()=>{l.bricks=[];for(let e=0;e<4;e+=1)for(let t=0;t<7;t+=1)l.bricks.push({x:35+t*72,y:36+e*25,width:60,height:14,alive:!0,color:e%2?`#aca4e2`:`#a9dfd6`})},d=()=>{l.ball={x:280,y:275,dx:3.1*(Math.random()>.5?1:-1),dy:-3.1,radius:7},l.paddleX=230},f=()=>{i.textContent=String(l.score),a.textContent=String(l.lives)},p=e=>{r.textContent=e},m=()=>{g(),l.score=0,l.lives=3,l.running=!1,l.pausedByMotion=!1,l.pausedByVisibility=!1,u(),d(),f(),s.disabled=!0,o.disabled=!1,p(`Ready when you are.`),h()},h=()=>{n.clearRect(0,0,t.width,t.height),n.fillStyle=`#111b2a`,n.fillRect(0,0,t.width,t.height),l.bricks.forEach(e=>{e.alive&&(n.fillStyle=e.color,n.fillRect(e.x,e.y,e.width,e.height))}),n.fillStyle=`#eff1f4`,n.beginPath(),n.arc(l.ball.x,l.ball.y,l.ball.radius,0,Math.PI*2),n.fill(),n.fillStyle=`#bde1d9`,n.beginPath(),n.roundRect(l.paddleX,302,100,10,5),n.fill()},g=()=>{l.frame&&cancelAnimationFrame(l.frame),l.frame=0,l.lastTime=0},_=()=>document.hidden||l.pausedByMotion||l.pausedByVisibility,v=e=>{f(),l.running=!1,g(),s.disabled=!0,o.disabled=!1,p(e?`You cleared the field. Nice work.`:`Game over. Restart for another round.`),h()},y=(e=performance.now())=>{if(l.frame=0,!l.running||_()){l.frame=0;return}if(l.lastTime&&e-l.lastTime<1e3/60-.5){l.frame=requestAnimationFrame(y);return}l.lastTime=e;let n=l.ball;if((n.x+n.dx>t.width-n.radius||n.x+n.dx<n.radius)&&(n.dx*=-1),n.y+n.dy<n.radius&&(n.dy*=-1),n.y+n.dy>294&&n.y+n.dy<312&&n.x>l.paddleX-n.radius&&n.x<l.paddleX+100+n.radius&&(n.dy=-Math.abs(n.dy),n.dx+=(n.x-(l.paddleX+50))*.025,n.dx=Math.max(-5,Math.min(5,n.dx))),l.bricks.forEach(e=>{e.alive&&n.x>e.x&&n.x<e.x+e.width&&n.y-n.radius<e.y+e.height&&n.y+n.radius>e.y&&(e.alive=!1,n.dy*=-1,l.score+=10)}),l.bricks.every(e=>!e.alive)){v(!0);return}if(n.y-n.radius>t.height){if(--l.lives,f(),l.lives<=0){v(!1);return}d(),p(`${l.lives} lives left. Keep going.`)}n.x+=n.dx,n.y+=n.dy,f(),h(),l.frame=requestAnimationFrame(y)},b=()=>{!l.frame&&l.running&&!_()&&(l.frame=requestAnimationFrame(y))},x=()=>{l.running||((l.lives<=0||l.bricks.every(e=>!e.alive))&&m(),l.running=!0,l.pausedByMotion=document.documentElement.dataset.motionPaused===`true`&&document.documentElement.dataset.motionSource!==`preference`,l.pausedByVisibility=document.hidden,s.disabled=!1,o.disabled=!0,p(l.pausedByMotion?`Paused by motion controls.`:`In play.`),b(),t.focus({preventScroll:!0}))},S=()=>{l.running&&(l.running=!1,g(),s.disabled=!0,o.disabled=!1,p(`Paused.`))},C=e=>{let n=t.getBoundingClientRect(),r=t.width/n.width;l.paddleX=Math.max(0,Math.min(t.width-100,(e-n.left)*r-50)),h()};return t.addEventListener(`pointermove`,e=>{e.isPrimary&&C(e.clientX)}),t.addEventListener(`pointerdown`,e=>{C(e.clientX),t.setPointerCapture?.(e.pointerId)}),t.addEventListener(`keydown`,e=>{(e.key===`ArrowLeft`||e.key===`ArrowRight`)&&(e.preventDefault(),l.paddleX+=e.key===`ArrowLeft`?-28:28,l.paddleX=Math.max(0,Math.min(t.width-100,l.paddleX)),h())}),o.addEventListener(`click`,x),s.addEventListener(`click`,S),c.addEventListener(`click`,m),window.addEventListener(`sam-motion`,e=>{let t=!!e.detail?.paused&&!e.detail?.decorativeOnly;l.pausedByMotion=t,t&&l.running?(g(),p(`Paused by motion controls.`)):!t&&l.running&&(p(`In play.`),b())}),document.addEventListener(`visibilitychange`,()=>{l.pausedByVisibility=document.hidden,document.hidden?g():l.running&&!l.pausedByMotion&&b()}),(typeof IntersectionObserver==`function`?new IntersectionObserver(([e])=>{l.pausedByVisibility=!e.isIntersecting,e.isIntersecting?l.running&&!l.pausedByMotion&&!document.hidden&&b():g()},{threshold:.05}):null)?.observe(e),m(),e}function n(n){if(!(n instanceof HTMLElement))throw TypeError(`mountShowcase(host) expects an HTMLElement`);n.replaceChildren(),n.classList.add(`showcase`);let r=document.createElement(`div`);r.className=`showcase-heading`,r.innerHTML=`<p class="showcase-kicker">Interactive demos · not client work</p><h2>Small experiments, made tangible.</h2><p>Two low-stakes studies from the same design language: one to play, one to explore.</p>`;let i=document.createElement(`div`);return i.className=`showcase-grid`,i.append(t(),e()),n.append(r,i),n}export{n as mountShowcase};