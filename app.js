'use strict';
const C=window.EchoCore, $=id=>document.getElementById(id), KEY='echoglow_studio_v2';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let state=C.defaults(), storageWorks=true, currentView='echo', recipient='friend', toastTimer, saveTimer, variation=0, clearArmed=false;
try{const saved=localStorage.getItem(KEY);state=saved?C.normalize(JSON.parse(saved)):C.migrate(JSON.parse(localStorage.getItem('echoglow_state')||'null'));}catch{storageWorks=false;}
function save(){clearTimeout(saveTimer);try{localStorage.setItem(KEY,JSON.stringify(state));storageWorks=true;$('save-status').textContent='已保存在此设备';}catch{storageWorks=false;$('save-status').textContent='暂未保存';}}
function saveSoon(){clearTimeout(saveTimer);$('save-status').textContent='正在保存…';saveTimer=setTimeout(save,250);}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function makeButton(label,classes,handler){const b=document.createElement('button');b.type='button';b.className=classes;b.textContent=label;b.addEventListener('click',handler);return b;}
function toggle(list,key){return list.includes(key)?list.filter(v=>v!==key):[...list,key];}
function setFill(input){input.style.setProperty('--fill',input.value+'%');}
function updateStateViews(){
  document.querySelectorAll('[data-texture]').forEach(b=>b.setAttribute('aria-pressed',String(state.texture===b.dataset.texture)));
  document.querySelectorAll('[data-feeling]').forEach(b=>b.setAttribute('aria-pressed',String(state.feelings.includes(b.dataset.feeling))));
  document.querySelectorAll('[data-support]').forEach(b=>b.setAttribute('aria-pressed',String(state.supports.includes(b.dataset.support))));
  $('energy').value=state.energy;setFill($('energy'));$('energy-number').textContent=state.energy;$('energy-label').textContent=C.energyLabel(state.energy);
  for(const k of Object.keys(C.bodyNames)){$('pressure-'+k).value=state.pressure[k];setFill($('pressure-'+k));$('pressure-value-'+k).textContent=state.pressure[k]+' / 100';}
  const total=Object.values(state.pressure).reduce((a,b)=>a+b,0);$('pressure-summary').textContent=total?'已填写 · 可以调整':'调节压迫感 ＋';
  $('weather-label').textContent=state.texture?state.texture+' · 此刻的天气':'未命名的天气';$('stage-word').textContent=state.texture||'在这里';
  $('stage-caption').textContent=C.poetry[state.texture]?.material||'漫散的微光，等待一个名字'; $('poem-title').textContent=C.poetry[state.texture]?.title||'还没有名字的此刻';
  const count=Number(!!state.texture)+state.feelings.length;$('selection-summary').textContent=count?`已选择 ${count} 个情绪碎片`:'不用选完，随时都可以开始';
  $('include-body').checked=state.includeBody;$('personal-note').value=state.note;$('note-count').textContent=state.note.length+' / 500';$('duration').value=state.duration;
}
function changed(){variation=0;state.poem=C.poem(state,variation++);$('poem').textContent=state.poem;$('poem-status').textContent='随感受写下 · 也可以换一种说法';updateStateViews();save();drawWeather(performance.now());}
C.textures.forEach(([name,symbol])=>{const b=makeButton('','texture-button',()=>{state.texture=state.texture===name?'':name;changed();});b.dataset.texture=name;b.setAttribute('aria-label',name);const mark=document.createElement('span');mark.className='texture-symbol';mark.setAttribute('aria-hidden','true');mark.textContent=symbol;const label=document.createElement('span');label.textContent=name;b.append(mark,label);$('texture-options').append(b);});
C.feelings.forEach(name=>{const b=makeButton(name,'chip-button',()=>{state.feelings=toggle(state.feelings,name);changed();});b.dataset.feeling=name;$('feeling-options').append(b);});
Object.entries(C.supports).forEach(([key,[label]])=>{const b=makeButton(label,'support-button',()=>{state.supports=toggle(state.supports,key);updateStateViews();updateCardFromInputs();save();});b.dataset.support=key;$('support-options').append(b);});
Object.entries(C.bodyNames).forEach(([key,label])=>{const row=document.createElement('div');row.className='pressure-row';row.innerHTML=`<div><label for="pressure-${key}">${label}</label><output id="pressure-value-${key}"></output></div><input type="range" id="pressure-${key}" min="0" max="100" value="0" aria-label="${label}压迫感">`;$('pressure-fields').append(row);$('pressure-'+key).addEventListener('input',e=>{state.pressure[key]=Number(e.target.value);changed();});});
$('energy').addEventListener('input',e=>{state.energy=Number(e.target.value);changed();});
$('generate').addEventListener('click',()=>{state.poem=C.poem(state,variation++);$('poem').textContent=state.poem;$('poem-status').textContent='已显影 · 你也可以换一种说法';$('generate').innerHTML='再换一种说法 <span>↻</span>';save();drawWeather(performance.now());});
async function copyText(text){if(!text.trim()){toast('还没有可复制的文字');return;}try{await navigator.clipboard.writeText(text);toast('文字已复制');}catch{toast('复制未完成，请选中文字手动复制');}}
$('copy-poem').addEventListener('click',()=>{if(!state.poem){toast('先让此刻显影，再复制诗译');return;}copyText(state.poem);});
function showView(view){if(currentView==='breathe'&&view!=='breathe')pauseBreath();currentView=view;document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!=='view-'+view);document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===view;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});$('view-kicker').textContent={echo:'YOUR INNER WEATHER / 内心天气',translate:'WORDS BETWEEN US / 把感受传递',breathe:'A LITTLE SPACE / 一点留白'}[view];if(view==='translate')renderCard();syncWeather();}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();showView('echo');});
$('to-translate').addEventListener('click',()=>{showView('translate');$('translate-title').setAttribute('tabindex','-1');$('translate-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'});});
function draftKey(){return recipient==='friend'?'friendDraft':'doctorDraft';}
function generatedCard(){return recipient==='friend'?C.friendCard(state):C.doctorCard(state);}
function fitEditor(){const editor=$('card-editor');editor.style.height='auto';editor.style.height=Math.max(310,editor.scrollHeight)+'px';}
function renderCard(){document.querySelectorAll('[data-recipient]').forEach(b=>{b.classList.toggle('active',b.dataset.recipient===recipient);b.setAttribute('aria-pressed',String(b.dataset.recipient===recipient));});$('friend-controls').hidden=recipient!=='friend';$('doctor-controls').hidden=recipient!=='doctor';$('card-caption').textContent=recipient==='friend'?'一张留给亲友的便笺':'一份就诊沟通记录';$('letter-title').textContent=recipient==='friend'?'今天，借一张纸开口。':'把感受，慢慢说清楚。';$('letter-category').textContent=recipient==='friend'?'A LITTLE NOTE FOR YOU':'A NOTE FOR MY APPOINTMENT';document.querySelector('.message-paper').classList.toggle('doctor-paper',recipient==='doctor');$('card-editor').value=state[draftKey()]??generatedCard();fitEditor();}
function updateCardFromInputs(){if(state[draftKey()]===null)renderCard();else toast('已保留你编辑的文字；点击「重新整理卡片」可应用新选择');}
document.querySelectorAll('[data-recipient]').forEach(b=>b.addEventListener('click',()=>{recipient=b.dataset.recipient;renderCard();}));
$('include-body').addEventListener('change',e=>{state.includeBody=e.target.checked;updateCardFromInputs();save();});
$('duration').addEventListener('change',e=>{state.duration=e.target.value;updateCardFromInputs();save();});
$('personal-note').addEventListener('input',e=>{state.note=e.target.value;$('note-count').textContent=state.note.length+' / 500';if(state[draftKey()]===null)renderCard();saveSoon();});
$('card-editor').addEventListener('input',e=>{state[draftKey()]=e.target.value;fitEditor();saveSoon();});
$('refresh-card').addEventListener('click',()=>{if(state[draftKey()]!==null&&!confirm('重新整理会替换这张卡片中手动修改的文字。继续吗？'))return;state[draftKey()]=null;renderCard();save();toast('已按你的选择重新整理');});
$('copy-card').addEventListener('click',()=>copyText($('card-editor').value));
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function wrapText(ctx,text,maxWidth){const lines=[];for(const paragraph of text.split('\n')){if(!paragraph){lines.push('');continue;}let line='';for(const char of paragraph){if(ctx.measureText(line+char).width>maxWidth&&line){lines.push(line);line=char;}else line+=char;}lines.push(line);}return lines;}
$('download-card').addEventListener('click',async()=>{
  const button=$('download-card'),text=$('card-editor').value.trim();
  if(!text){toast('先写一点想分享的话');return;}
  button.disabled=true;
  try{
    await document.fonts.ready;
    const out=document.createElement('canvas'),ctx=out.getContext('2d');out.width=1080;
    ctx.font='28px "Microsoft YaHei", sans-serif';
    const lines=wrapText(ctx,text,828);out.height=610+lines.length*52;
    const doctor=recipient==='doctor';
    ctx.fillStyle=doctor?'#dfe4e6':'#e7e0ed';ctx.fillRect(0,0,out.width,out.height);
    const g=ctx.createLinearGradient(0,0,out.width,340);g.addColorStop(0,doctor?'#d5dce1':'#d2c3e3');g.addColorStop(1,doctor?'#e7e9e6':'#f0e9ed');ctx.fillStyle=g;ctx.fillRect(0,0,out.width,320);
    ctx.strokeStyle=doctor?'#697e881c':'#8e779d22';
    for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(1020,40,90+i*38,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#655971';ctx.font='600 28px "Segoe UI",sans-serif';ctx.fillText('EchoGlow',88,80);ctx.font='18px sans-serif';ctx.fillText('回声微光',250,80);ctx.textAlign='right';ctx.fillText($('card-date').textContent,992,80);ctx.textAlign='left';
    ctx.font='18px "Segoe UI",sans-serif';ctx.fillStyle='#83718f';ctx.fillText($('letter-category').textContent,88,155);
    ctx.font='40px "Microsoft YaHei",sans-serif';ctx.fillStyle='#463c50';ctx.fillText($('letter-title').textContent,88,220);
    ctx.fillStyle='#ffffff35';ctx.fillRect(64,284,952,out.height-432);
    ctx.fillStyle='#403848';ctx.font='28px "Microsoft YaHei",sans-serif';lines.forEach((line,i)=>ctx.fillText(line,126,348+i*52));
    const footer=out.height-180;ctx.setLineDash([3,7]);ctx.strokeStyle='#897b924d';ctx.beginPath();ctx.moveTo(88,footer);ctx.lineTo(992,footer);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#71627d';ctx.font='24px "Microsoft YaHei",sans-serif';ctx.fillText('不必一次说清楚。',88,footer+47);ctx.font='19px sans-serif';ctx.fillText('谢谢你，愿意听见此刻的我。',88,footer+82);ctx.font='46px serif';ctx.fillText('✳',930,footer+61);
    ctx.font='14px "Segoe UI",sans-serif';ctx.fillStyle='#9b8ea3';ctx.fillText('MY FEELINGS, IN MY OWN WORDS.',88,out.height-34);ctx.textAlign='right';ctx.fillText('一 点 微 光',992,out.height-34);
    const blob=await new Promise(resolve=>out.toBlob(resolve,'image/png'));if(!blob)throw Error('empty image');downloadBlob(blob,'EchoGlow-'+(doctor?'就诊记录':'亲友便笺')+'.png');toast('卡片图片已生成');
  }catch{toast('图片未能生成，可以先复制文字');}finally{button.disabled=false;}
});

// A single, capped render loop. Shape, color and movement follow the selected inputs.
const canvas=$('echo-canvas'),ctx=canvas.getContext('2d');let width=0,height=0,weatherFrame=0,lastFrame=0,motionPaused=false,visualTime=0;
function drawWeather(now){
  if(!width||!height||currentView!=='echo'||document.hidden)return;
  const animated=!motionPaused&&!reducedMotion.matches;
  if(animated&&now-lastFrame>0&&now-lastFrame<200)visualTime+=(now-lastFrame)*.001;
  lastFrame=now;
  const pressure=Object.values(state.pressure).reduce((a,b)=>a+b,0)/300;
  window.EchoVisual.draw(ctx,width,height,visualTime,state.texture,pressure);
}
function weatherLoop(now){weatherFrame=0;if(now-lastFrame>=32)drawWeather(now);if(currentView==='echo'&&!document.hidden&&!motionPaused&&!reducedMotion.matches)weatherFrame=requestAnimationFrame(weatherLoop);}
function syncWeather(){cancelAnimationFrame(weatherFrame);weatherFrame=0;if(currentView!=='echo'||document.hidden)return;const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);lastFrame=0;drawWeather(performance.now());if(!motionPaused&&!reducedMotion.matches)weatherFrame=requestAnimationFrame(weatherLoop);}
$('motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;$('motion-toggle').setAttribute('aria-pressed',String(motionPaused));$('motion-toggle').textContent=motionPaused?'继续画面 ▷':'暂停画面 Ⅱ';syncWeather();});
new ResizeObserver(()=>{syncWeather();if(currentView==='translate')fitEditor();}).observe($('main'));
reducedMotion.addEventListener('change',()=>{syncWeather();renderBreath();});

// One elapsed-time clock keeps labels and scale aligned through pause/resume.
let breathRunning=false,breathElapsed=0,breathStarted=0,breathFrame=0,pattern='soft',lastBreathLabel='',soundOn=false,audioCtx=null,ocean=null;
function elapsed(){return breathElapsed+(breathRunning?performance.now()-breathStarted:0);}
function renderBreath(){const ms=elapsed(),phase=C.breathAt(ms,pattern);$('breath-session').textContent=ms===0&&!breathRunning?'还没有开始':`${breathRunning?'正在呼吸':'已暂停'} · ${Math.floor(ms/60000).toString().padStart(2,'0')}:${Math.floor(ms/1000%60).toString().padStart(2,'0')}`;$('breath-cycles').textContent=phase.cycles+' 次完整呼吸';$('breath-phase').textContent=ms===0&&!breathRunning?'准备好了，再开始':phase.label;$('breath-count').textContent=ms===0&&!breathRunning?'✳':phase.remaining;$('breath-next').textContent=ms===0&&!breathRunning?'跟随你的节奏':'接下来 · '+phase.next;$('breath-glow').style.transform=`scale(${reducedMotion.matches?1:phase.scale})`;$('breath-start').textContent=breathRunning?'暂停呼吸 Ⅱ':ms>0?'继续呼吸 →':'开始呼吸 →';if(breathRunning&&phase.label!==lastBreathLabel){if(lastBreathLabel)playChime();lastBreathLabel=phase.label;}}
function breathLoop(){breathFrame=0;renderBreath();if(breathRunning)breathFrame=requestAnimationFrame(breathLoop);}
function pauseBreath(){if(!breathRunning)return;breathElapsed=elapsed();breathRunning=false;cancelAnimationFrame(breathFrame);breathFrame=0;renderBreath();syncAudio();}
function resetBreath(){pauseBreath();breathElapsed=0;lastBreathLabel='';renderBreath();}
$('breath-start').addEventListener('click',()=>{if(breathRunning)pauseBreath();else{breathStarted=performance.now();breathRunning=true;renderBreath();breathFrame=requestAnimationFrame(breathLoop);syncAudio();}});
$('breath-reset').addEventListener('click',resetBreath);
document.querySelectorAll('[data-pattern]').forEach(b=>b.addEventListener('click',()=>{resetBreath();pattern=b.dataset.pattern;document.querySelectorAll('[data-pattern]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});renderBreath();}));
async function initAudio(){if(audioCtx)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');audioCtx=new Audio();const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*4,audioCtx.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*3.5;}const source=audioCtx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=260;ocean=audioCtx.createGain();ocean.gain.value=0;source.connect(filter);filter.connect(ocean);ocean.connect(audioCtx.destination);source.start();const tide=audioCtx.createOscillator(),tideDepth=audioCtx.createGain();tide.frequency.value=1/12;tideDepth.gain.value=.08;tide.connect(tideDepth);tideDepth.connect(ocean.gain);tide.start();await audioCtx.resume();}
async function syncAudio(){if(!audioCtx)return;try{if(soundOn&&breathRunning&&currentView==='breathe'&&!document.hidden){await audioCtx.resume();ocean.gain.setTargetAtTime(.15,audioCtx.currentTime,.4);}else await audioCtx.suspend();}catch{soundOn=false;$('sound-toggle').setAttribute('aria-pressed','false');$('sound-toggle').textContent='开启海浪声 ♫';toast('声音暂时不可用，仍可跟随画面呼吸');}}
function playChime(){if(!audioCtx||!soundOn||audioCtx.state!=='running')return;const oscillator=audioCtx.createOscillator(),gain=audioCtx.createGain(),now=audioCtx.currentTime;oscillator.frequency.value=528;gain.gain.setValueAtTime(.018,now);gain.gain.exponentialRampToValueAtTime(.001,now+1);oscillator.connect(gain);gain.connect(audioCtx.destination);oscillator.start();oscillator.stop(now+1);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
$('sound-toggle').addEventListener('click',async()=>{try{if(!soundOn)await initAudio();soundOn=!soundOn;$('sound-toggle').setAttribute('aria-pressed',String(soundOn));$('sound-toggle').textContent=soundOn?'关闭海浪声 ♫':'开启海浪声 ♫';await syncAudio();if(soundOn&&!breathRunning)toast('开始呼吸时，会播放海浪声');}catch{toast('这台设备暂时无法播放声音');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseBreath();save();}syncWeather();});
window.addEventListener('pagehide',()=>{pauseBreath();save();});
$('open-data').addEventListener('click',()=>{clearArmed=false;$('clear-data').textContent='清除本地记录';$('data-dialog').showModal();});
// A mobile entry remains available when the side rail is collapsed.
const mobileData=makeButton('本地记录','text-button',()=>$('open-data').click());mobileData.style.fontSize='inherit';document.querySelector('.main-footer').append(mobileData);
$('export-data').addEventListener('click',()=>{save();downloadBlob(new Blob([JSON.stringify({exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),'EchoGlow-record.json');toast('记录副本已生成');});
$('clear-data').addEventListener('click',()=>{if(!clearArmed){clearArmed=true;$('clear-data').textContent='确认清除情绪选择和卡片草稿';return;}clearTimeout(saveTimer);try{localStorage.removeItem(KEY);localStorage.removeItem('echoglow_state');}catch{toast('无法清除，请在浏览器设置中管理此网站数据');return;}state=C.defaults();updateStateViews();$('poem').textContent='有些感受，还没有名字。\n你可以慢慢找到它的形状。';$('poem-status').textContent='选择右侧碎片，生成你的通感诗译';$('generate').innerHTML='让此刻显影 <span>↗</span>';renderCard();resetBreath();syncWeather();$('data-dialog').close();$('save-status').textContent='本地记录已清除';toast('本地记录已清除');});
$('data-dialog').addEventListener('click',e=>{if(e.target===$('data-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
const date=new Date();$('today').textContent=date.toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}).replace('/',' / ');$('card-date').textContent=date.toLocaleDateString('zh-CN');
updateStateViews();if(state.poem){$('poem').textContent=state.poem;$('poem-status').textContent='上次留给自己的文字';}if(!storageWorks)$('save-status').textContent='暂未保存';else $('save-status').textContent='仅保存在此设备';renderBreath();syncWeather();
