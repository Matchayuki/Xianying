(function(root) {
  'use strict';
  const textures = [
    ['迷雾','◌', '雾在眼前慢慢聚拢。\n许多事，看不清轮廓。'],
    ['胶水','≈', '时间变得黏稠。\n每往前一点，都需要力气。'],
    ['褪色','◐', '世界的颜色淡了一些。\n光仍然落在窗边。'],
    ['噪点','⁙', '细碎的声音挤在一起。\n我还没找到自己的频率。'],
    ['沉重','▱', '此刻的重力，比平常多一些。\n我的步子，也比平常慢。'],
    ['失重','⤴', '像一片悬在空中的叶子。\n我在寻找可以落脚的地方。'],
    ['石化','◇', '想说的话，暂时停在喉咙里。\n我需要一点开口的时间。'],
    ['空洞','○', '心里空出了一小块地方。\n有风经过，留下回声。'],
    ['溺水','≋', '像隔着很深的水，看向岸边。\n我希望有人知道，我在这里。'],
    ['碎玻璃','⋄', '感受散成了许多碎片。\n我还不能把它们拼成一句话。']
  ];
  const feelings = ['时间凝滞','声音遥远','世界褪色','身体不是自己的','被监视','想消失','想蜷缩','无法开口'];
  const supports = {
    quiet:['给我一点安静','我想先安静一会儿，等我缓过来再聊。'],
    company:['陪我待一会儿','你有空的话，能陪我待一会儿吗？不用找话题。'],
    message:['先用文字联系','可以先用文字和我联系吗？现在说话有点费力。'],
    practical:['帮我处理一件小事','有件小事想请你搭把手，我再跟你说具体是什么。']
  };
  const defaults = () => ({version:2,texture:'',feelings:[],energy:35,pressure:{chest:0,head:0,limbs:0},supports:[],note:'',duration:'',includeBody:false,poem:'',friendDraft:null,doctorDraft:null});
  const clamp = (v,fallback=0) => typeof v==='number' && Number.isFinite(v) ? Math.max(0,Math.min(100,Math.round(v))) : fallback;
  const durations = ['','今天开始','几天','一到两周','两周以上'];
  const bodyNames = {chest:'胸口',head:'头部',limbs:'四肢'};
  function normalize(raw) {
    const s=defaults();
    if (!raw || typeof raw!=='object' || Array.isArray(raw)) return s;
    if (textures.some(t=>t[0]===raw.texture)) s.texture=raw.texture;
    s.feelings=Array.isArray(raw.feelings)?[...new Set(raw.feelings.filter(f=>feelings.includes(f)))]:[];
    s.supports=Array.isArray(raw.supports)?[...new Set(raw.supports.filter(f=>Object.hasOwn(supports,f)))]:[];
    s.energy=clamp(raw.energy,35);
    for(const k of Object.keys(bodyNames)) s.pressure[k]=clamp(raw.pressure?.[k]);
    s.note=typeof raw.note==='string'?raw.note.slice(0,500):'';
    s.duration=durations.includes(raw.duration)?raw.duration:'';
    s.includeBody=raw.includeBody===true;
    s.poem=typeof raw.poem==='string'?raw.poem.slice(0,2000):'';
    for(const key of ['friendDraft','doctorDraft']) s[key]=typeof raw[key]==='string'?raw[key].slice(0,5000):null;
    return s;
  }
  function migrate(raw) {
    const tags=Array.isArray(raw?.tags)?raw.tags:[];
    const pct=[35,55,72,88,20];
    return normalize({texture:tags.find(t=>textures.some(a=>a[0]===t)),feelings:tags.filter(t=>feelings.includes(t)),pressure:raw?.pressure,energy:Number.isInteger(raw?.batteryIdx)?pct[raw.batteryIdx]:35});
  }
  function energyLabel(n) { return n<=20?'很需要休息':n<=40?'低能量':n<=60?'慢慢来':n<=80?'有一点余力':'电量充足'; }
  const poetry = {
    '迷雾':{title:'雾里的轮廓',material:'漫散 · 半透明 · 缓慢漂移',lines:['雾没有落在窗外，\n它停在我和世界之间。','一切都像隔着一层毛玻璃，\n我看得见光，却辨不清方向。','声音抵达之前，\n先在这片灰蓝里绕了一小段路。'],end:['我想先找到离自己最近的那一点光。','此刻的模糊，也是一种可以被描述的感受。','你可以靠近一点，慢一点问我。']},
    '胶水':{title:'被拉长的一秒',material:'黏连 · 拉伸 · 迟滞回弹',lines:['时间像没有干透的胶，\n把每一步都拉得很长。','我不是没有向前，\n只是空气里多了一层看不见的阻力。','一个念头牵着另一个念头，\n迟迟没有松开。'],end:['如果我回答得慢，请给我一点间隙。','我需要的，也许是比平常更宽的一段时间。','今天的节奏，暂时是这个样子。']},
    '褪色':{title:'颜色低下了声音',material:'低饱和 · 残影 · 渐隐',lines:['熟悉的风景还在原处，\n只是颜色比昨天更轻。','像一张反复冲洗的相片，\n细节还在，鲜明感却退远了。','我知道窗外有光，\n但它暂时没有照亮我的感受。'],end:['这份平淡里，有我还说不清的疲惫。','我想记录的，是颜色退下去之后的这一刻。','不必替我把它涂得鲜艳，先听见就好。']},
    '噪点':{title:'尚未对准的频率',material:'颗粒 · 干扰 · 错位',lines:['许多细碎的声响，\n在同一时间挤进来。','像一台还没调准的收音机，\n每个念头都带着沙沙声。','我想听清一句话，\n却被更多声音打断。'],end:['我需要少一点讯息，多一点空白。','如果可以，我们一次只说一件事。','我想先把最靠近自己的声音找回来。']},
    '沉重':{title:'重力多了一点',material:'密实 · 下坠 · 低重心',lines:['今天的重力，好像多了一点，\n连很小的事，也有了重量。','不是石头落在身上，\n是身体本身变得像石头。','每一个动作都很慢，\n仿佛要先搬开压在上面的夜色。'],end:['我想让你知道，这份缓慢不是敷衍。','如果可以，先陪我把事情放小一点。','此刻我能拿起的，可能只有一件小事。']},
    '失重':{title:'没有落脚的风',material:'悬浮 · 轻盈 · 失去锚点',lines:['脚下像少了一块地面，\n我悬在熟悉的生活上方。','像一片还没有落下的叶子，\n我不知道该停在哪里。','身体在这里，\n但一部分感受还飘在很远的地方。'],end:['我想先找到一件摸得到、说得清的小事。','如果你在，可以告诉我一些身边的事。','这一刻，我需要一点具体的陪伴。']},
    '石化':{title:'静止也有纹理',material:'硬边 · 层理 · 静止',lines:['想说的话停在喉咙里，\n像被一层石头包住。','表面没有变化，\n里面却有很多挤在一起的纹理。','我似乎停在原地，\n连一个简单的回应，也要很久。'],end:['我还在听，只是暂时难以回应。','可以先不用等我说出完整的一句话。','我想从最小的一个字开始。']},
    '空洞':{title:'回声经过的地方',material:'负空间 · 环绕 · 深度',lines:['心里空出了一块地方，\n声音经过，会停留得很久。','有些事情仍在发生，\n却像落进一个没有回响的房间。','我说不清少了什么，\n只感觉中间留着一个空白。'],end:['我不急着给它一个答案，只想把它说出来。','也许你可以先和我一起待在这里。','这是我的感受，暂时还没有更准确的名字。']},
    '溺水':{title:'水面之下的声音',material:'折射 · 水压 · 向上寻光',lines:['我像隔着很深的水，\n望向还在继续的日常。','话到了嘴边，又被水声盖住，\n我想让岸上的人知道我在这里。','光在头顶慢慢晃动，\n每一句话都像要游很远。'],end:['如果可以，请先陪我一会儿。','我想用这几行字，替自己发出一个信号。','现在我需要的，是你能听见这份吃力。']},
    '碎玻璃':{title:'还没拼成句子的光',material:'断面 · 锐边 · 多向折射',lines:['感受散成很多碎片，\n每一片都映着不同的事情。','我很难把它们拼成顺畅的一句话，\n一开口，就碰到一些锋利的边。','光线被分成了很多方向，\n我不知道该先指向哪一片。'],end:['我可以一小片、一小片地说。','请不用替我整理好，先听这些零散的话。','这张不完整的描述，也能表达一部分的我。']}
  };
  const feelingLines={'时间凝滞':'钟还在走，我的这一刻却被拉得很长。','声音遥远':'你的声音，像从很远的走廊传来。','世界褪色':'那些熟悉的颜色，也退到了背景里。','身体不是自己的':'我和自己的身体之间，似乎隔了一小段距离。','被监视':'我有一种被注视的不安，很难松弛下来。','想消失':'我有想从一切里退开的念头，不太知道怎么说。','想蜷缩':'我想把自己缩小一点，先少承受一些。','无法开口':'这些字，正在替暂时开不了口的我说话。'};
  function poem(s,variation=0) {
    const n=Math.max(0,Math.floor(Number(variation)||0));
    const p=poetry[s.texture];
    const opening=p?p.lines[n%p.lines.length]:'此刻，我还没有找到合适的词。\n但我已经为自己，留了一点空间。';
    const chosen=s.feelings.length?s.feelings[n%s.feelings.length]:null;
    const middle=chosen?feelingLines[chosen]:s.energy<=20?'今天可以使用的力气，比平常少很多。':null;
    const closing=p?p.end[Math.floor(n/3+n)%p.end.length]:'我想先把这些留在这里，等合适的时候再说。';
    return [opening,middle,closing].filter(Boolean).join('\n\n');
  }
  function bodyLines(s) {return Object.entries(bodyNames).map(([k,n])=>`${n}压迫感：${s.pressure[k]} / 100`);}
  const spokenTextures={
    '迷雾':'脑子里像隔着一层雾，很多事情理不清。',
    '胶水':'感觉整个人被黏住了，想动起来，但做什么都很费劲。',
    '褪色':'熟悉的事情好像都淡了，心里没什么起伏。',
    '噪点':'脑子里乱糟糟的，很多东西挤在一起，很难静下来。',
    '沉重':'整个人沉沉的，连平时很小的事情都觉得费力。',
    '失重':'有点飘，像是落不到实处。',
    '石化':'有点僵住了，想回应，却很难动起来。',
    '空洞':'心里空空的，说不清具体是怎么了。',
    '溺水':'感觉被什么淹住了，想说话也有点吃力。',
    '碎玻璃':'心里很乱，一碰到有些事情就难受，不知道从哪说起。'
  };
  const spokenFeelings={'时间凝滞':'时间过得特别慢。','声音遥远':'周围的声音听起来很远。','世界褪色':'身边的东西好像都没什么颜色了。','身体不是自己的':'有时感觉身体不像自己的。','被监视':'总有一种被人盯着的不安。','想消失':'有想消失的念头。','想蜷缩':'只想找个地方蜷着。','无法开口':'有话想说，可就是开不了口。'};
  function describeFeelings(s){const lines=[];if(s.texture)lines.push(spokenTextures[s.texture]);for(const f of s.feelings){if((s.texture==='褪色'&&f==='世界褪色')||(s.texture==='石化'&&f==='无法开口'))continue;lines.push(spokenFeelings[f]);}return lines.join('');}
  function friendCard(s) {
    const description=describeFeelings(s),lines=[];
    if(description)lines.push('我现在'+description);
    else lines.push('想跟你说说我现在的状态，不过还没找到合适的词。');
    if(s.energy<=20)lines.push('今天实在没剩多少力气，可能会回得慢一点。');
    if(s.includeBody){const parts=Object.entries(bodyNames).filter(([k])=>s.pressure[k]>0).map(([k,n])=>n+(s.pressure[k]>=65?'压得很难受':s.pressure[k]>=30?'有些压迫感':'有一点压迫感'));if(parts.length)lines.push(parts.join('，')+'。');}
    if(s.supports.length)lines.push(s.supports.map(k=>supports[k][1]).join('\n'));
    if(s.note.trim())lines.push(s.note.trim());
    if(!s.supports.length&&!s.note.trim())lines.push('还没想好要怎么聊，先告诉你一声。');
    return lines.join('\n\n');
  }
  function doctorCard(s) {
    const lines=['医生，有些感受我当面可能说不清，所以先写下来。',describeFeelings(s)||'现在还不太能描述清楚自己的感受。'];
    if(s.duration)lines.push('持续时间：'+s.duration+'。');
    lines.push('如果用电量来形容，我觉得自己大约还有 '+s.energy+' / 100。');
    const body=Object.keys(bodyNames).filter(k=>s.pressure[k]>0);if(body.length)lines.push('身体方面，我记录到的压迫感：\n'+bodyLines(s).filter((_,i)=>s.pressure[Object.keys(bodyNames)[i]]>0).join('\n')+'\n这是我自己的感受强度，不是量表评分。');
    if(s.note.trim())lines.push(s.note.trim());
    return lines.join('\n\n');
  }
  function breathAt(ms,pattern='soft') {
    const phases=pattern==='classic'?[['吸气',4],['停留',4],['呼气',4]]:[['吸气',4],['呼气',6]];
    const total=phases.reduce((n,p)=>n+p[1],0)*1000;
    let offset=Math.max(0,ms)%total,index=0;
    while(offset>=phases[index][1]*1000){offset-=phases[index][1]*1000;index++;}
    const [label,seconds]=phases[index],fraction=offset/(seconds*1000);
    return {label,remaining:Math.max(1,Math.ceil(seconds-offset/1000)),next:phases[(index+1)%phases.length][0],cycles:Math.floor(Math.max(0,ms)/total),scale:label==='吸气'?.85+.25*fraction:label==='呼气'?1.1-.25*fraction:1.1};
  }
  const api={textures,feelings,supports,bodyNames,poetry,defaults,normalize,migrate,energyLabel,poem,friendCard,doctorCard,breathAt};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EchoCore=api;
})(typeof window==='undefined'?this:window);
