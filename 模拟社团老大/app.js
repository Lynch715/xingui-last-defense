"use strict";

const SAVE_KEY="fog_harbor_boss_save_v1";
const VERSION=1;
const MAX_MONTHS=60;
const BANKRUPT_CASH=-30;

const DIFFICULTIES={
  standard:{name:"标准",enemyGrowth:1,enemyAttack:.26,battle:1,income:1},
  hard:{name:"艰难",enemyGrowth:1.16,enemyAttack:.36,battle:1.08,income:.9},
  brutal:{name:"死战",enemyGrowth:1.34,enemyAttack:.47,battle:1.16,income:.78}
};

const CREEDS={
  yi:{name:"义字当头",desc:"旧部更忠，收编敌将更容易"},
  wei:{name:"人必须怕你",desc:"血拼威力更强，对手更容易崩溃"},
  li:{name:"钱要永远先到",desc:"收入更高，招募成本更低"}
};

const FACTIONS={
  player:{name:"和联胜",color:"#6bb48f"},
  east:{name:"东潮会",color:"#5a8ec9"},
  wan:{name:"万盛堂",color:"#c49649"},
  long:{name:"长风社",color:"#9a6fc4"},
  coalition:{name:"港城同盟",color:"#b54a4a"}
};

const CHARACTER_DEFS={
  player:{name:"沈川",faction:"player",role:"话事人",type:"龙头",portrait:"assets/player.webp",stats:{force:64,command:63,scheme:58,business:52,charm:64},trait:"沈家之后",traitText:"亲自出战时士气不会低于45。"},
  father:{name:"沈振海",faction:"player",role:"前任话事人",type:"前辈",portrait:"assets/father.webp",stats:{force:71,command:88,scheme:82,business:65,charm:84},trait:"父亲的旧账",traitText:"他留下的每笔人情都会回来找你。"},
  zhaokui:{name:"赵魁",faction:"player",role:"战堂负责人",type:"猛将",portrait:"assets/zhao-kui.webp",stats:{force:86,command:76,scheme:38,business:31,charm:49},trait:"战堂铁腕",traitText:"强攻时进攻威力+12%，但连续避战会积累怨气。"},
  sumanqing:{name:"苏曼青",faction:"player",role:"账房军师",type:"军师",portrait:"assets/su-manqing.webp",stats:{force:28,command:57,scheme:88,business:92,charm:68},trait:"精算旧账",traitText:"地盘净收入+12%，可得到更精确的战前评估。"},
  chengye:{name:"程野",faction:"player",role:"青年堂口头目",type:"说客",portrait:"assets/cheng-ye.webp",stats:{force:68,command:67,scheme:62,business:51,charm:84},trait:"一声兄弟",traitText:"招募人手增加25%，劝降战术更强。"},
  hewanshan:{name:"何万山",faction:"east",role:"东潮会话事人",type:"龙头",portrait:"assets/he-wanshan.webp",stats:{force:73,command:84,scheme:69,business:61,charm:70},trait:"码头老将",traitText:"防守南港码头和船厂时格外强硬。"},
  tangji:{name:"唐霁",faction:"east",role:"东潮会主将",type:"统将",portrait:"assets/tang-ji.webp",stats:{force:78,command:87,scheme:70,business:43,charm:67},trait:"唯能者居",traitText:"胜利时显著提高所有参战头目的功劳。"},
  fangjingyao:{name:"方景曜",faction:"wan",role:"万盛堂话事人",type:"商枭",portrait:"assets/fang-jingyao.webp",stats:{force:45,command:66,scheme:81,business:94,charm:78},trait:"价码优先",traitText:"手下地盘收入与敌将挖角能力极强。"},
  hanbiao:{name:"韩彪",faction:"wan",role:"万盛堂头号猛将",type:"猛将",portrait:"assets/han-biao.webp",stats:{force:94,command:67,scheme:31,business:24,charm:45},trait:"顶门硬骨",traitText:"个人武力最高，强攻时可压住对方一名猛将。"},
  guchangfeng:{name:"顾长风",faction:"long",role:"长风社话事人",type:"策士",portrait:"assets/gu-changfeng.webp",stats:{force:61,command:72,scheme:91,business:72,charm:86},trait:"合纵连横",traitText:"反攻前更容易与其他势力共同施压。"},
  weixiaolou:{name:"魏小楼",faction:"long",role:"长风社情报头目",type:"探子",portrait:"assets/wei-xiaolou.webp",stats:{force:48,command:59,scheme:95,business:65,charm:73},trait:"留一扇门",traitText:"可查明相邻敌方地盘的真实驻防。"},
  xiejiu:{name:"谢九",faction:"neutral",role:"独立头目",type:"猛将",portrait:"assets/xie-jiu.webp",stats:{force:91,command:72,scheme:46,business:35,charm:57},trait:"只服胜者",traitText:"连胜时战力上升，战败后忠诚下降更快。"},
  yerong:{name:"叶蓉",faction:"neutral",role:"港口商路经营者",type:"管事",portrait:"assets/ye-rong.webp",stats:{force:33,command:55,scheme:76,business:96,charm:79},trait:"货通雾港",traitText:"所有已占地盘收入+15%。"},
  aqi:{name:"阿七",faction:"neutral",role:"老街新人",type:"新人",portrait:"assets/ah-qi.webp",stats:{force:52,command:43,scheme:46,business:38,charm:61},trait:"照着你长",traitText:"每次参战都会成长，结局会反映玩家的行事方式。"}
};

const TERRITORY_DEFS={
  old_street:{name:"旧城老街",owner:"player",income:8,guard:24,bonus:"每次招募额外+2人",neighbors:["south_dock","golden_bay","west_market"]},
  south_dock:{name:"南港码头",owner:"east",income:13,guard:46,bonus:"每月人手维护成本-10%",neighbors:["old_street","shipyard","central_harbor"]},
  shipyard:{name:"红星船厂",owner:"east",income:11,guard:53,bonus:"血拼伤亡-8%",neighbors:["south_dock","central_harbor"]},
  golden_bay:{name:"金湾娱乐区",owner:"wan",income:19,guard:43,bonus:"收入高，每月外部压力+2",neighbors:["old_street","new_city","central_harbor"]},
  new_city:{name:"东部新城",owner:"wan",income:16,guard:56,bonus:"高级人才出现率提升",neighbors:["golden_bay","central_harbor"]},
  west_market:{name:"西关批发市场",owner:"long",income:12,guard:40,bonus:"地盘投资价格-15%",neighbors:["old_street","north_yard","central_harbor"]},
  north_yard:{name:"北站货场",owner:"long",income:14,guard:48,bonus:"战败撤退时伤亡-12%",neighbors:["west_market","central_harbor"]},
  central_harbor:{name:"中央港区",owner:"coalition",income:28,guard:82,bonus:"控制后即可号令雾港",neighbors:["south_dock","shipyard","golden_bay","new_city","west_market","north_yard"],final:true}
};

const PROLOGUE=[
  {kicker:"序章 · 雨夜",title:"父亲把钥匙放在了桌上",portrait:"assets/father.webp",body:["窗外的雨打在旧街祖堂的铁皮棚上。沈振海没穿那件平时见人的西装，只穿了一件灰色背心。","他把一串钥匙、一枚磨花的龙头印和一本蓝色旧账簿摆在桌上。<span class='dialogue'>“南港、新城、西关，都被他们拿走了。”</span>","你问他还剩下什么。他抬眼望向窗外的老街：<span class='dialogue'>“剩下这条街，和几个还肯来看我的人。”</span>"]},
  {kicker:"序章 · 旧部",title:"三双眼睛都在看你",portrait:"assets/zhao-kui.webp",body:["赵魁站在门边，双手抱在胸前；苏曼青翻着账簿，笔尖一直没停；程野坐在桌角，朝你点了一下头。","他们留下来的理由各不相同。赵魁等着看你敢不敢开战，苏曼青想知道你能不能把账算清，程野只说了一句：<span class='dialogue'>“你上，我就上。”</span>","沈振海咳了很久，最后看着你：<span class='dialogue'>“别问他们服不服。打一场该打的仗，他们自己会回答。”</span>"]},
  {kicker:"第一章 · 接印",title:"和联胜只剩一条街",portrait:"assets/player.webp",body:["第二天早上，祖堂门口的招牌被雨冲得发白。你把龙头印放进外套内袋，开门时，外面只站了四十来个人。","更远的地方，东潮会占着码头，万盛堂占着新城，长风社把手伸进了北站。所有人都在等和联胜自己熄灭。","你看了一眼门外的人，然后把钥匙收进掌心。从今天起，这座城市里的每一块地、每一个人，都得重新回答一个问题——谁说了算。"]}
];

const ACTIONS=[
  {id:"recruit_crew",icon:"众",name:"去老街招人",desc:"让程野在球场、码头和老街间找肯跟你的人。",effects:["人手↑↑","现金-5万"],max:2,canRun:s=>s.cash>=recruitCost(s,5),lockedText:"现金不足",run:s=>{const bonus=owns(s,"old_street")?2:0,mult=hasOfficer(s,"chengye")?1.25:1,gain=Math.round((rand(7,12)+bonus)*mult);s.crew+=gain;addCash(s,-recruitCost(s,5));change(s,"morale",2);log(s,"good",`程野带回了 ${gain} 名新人。`)}},
  {id:"train",icon:"练",name:"整队合练",desc:"把新老人手混在一起，练到听得懂同一句指令。",effects:["士气↑↑","下场血拼↑"],max:2,run:s=>{change(s,"morale",9);s.training=clamp((s.training||0)+8,0,30);s.officers.filter(o=>o.side==="player"&&!o.injured).forEach(o=>{o.loyalty=clamp(o.loyalty+1);o.exp=(o.exp||0)+1});log(s,"good","赵魁把队伍从老街头拉到了尾。")}},
  {id:"business",icon:"账",name:"盘活地盘生意",desc:"让苏曼青提前收回一部分现金，但动静大了会引人注意。",effects:["现金↑↑","压力↑"],max:1,run:s=>{const gain=Math.max(8,Math.round(monthlyGross(s)*.55));addCash(s,gain);change(s,"heat",5);log(s,"good",`账面提前回了 ${gain} 万。`)}},
  {id:"intel",icon:"眼",name:"打听敌情",desc:"查清一块相邻地盘的真实驻防，为奇袭和劝降做准备。",effects:["情报↑","谋略人物受益"],max:1,run:s=>{const targets=attackableTerritories(s).filter(id=>!s.intel[id]);if(targets.length){const id=pick(targets);s.intel[id]=true;log(s,"good",`已摸清${TERRITORY_DEFS[id].name}的驻防和主将。`)}else{change(s,"heat",-4);log(s,"story","魏小楼的路子暂时没有新消息。")}}},
  {id:"visit",icon:"茶",name:"找头目谈话",desc:"功劳、位置和没兑现的话，很多时候得关起门来说。",effects:["最低忠诚↑","怨气↓"],max:1,run:s=>{const o=ownedOfficers(s).filter(x=>x.id!=="player").sort((a,b)=>a.loyalty-b.loyalty)[0];if(o){o.loyalty=clamp(o.loyalty+9);o.resentment=clamp(o.resentment-7);log(s,"story",`你和${o.name}在祖堂里谈了很久。`)}else change(s,"morale",3)}},
  {id:"laylow",icon:"静",name:"低调一个月",desc:"收起外面的动静，帮街坊解决几件实际的事。",effects:["压力↓↓","人心↑"],max:1,run:s=>{change(s,"heat",-13);change(s,"support",5);change(s,"morale",2);log(s,"story","这个月没有人在老街听见太大的动静。")}}
];

const COMMON_NAMES=["高子鹏","罗小武","杜庆","张海生","黄东","陈三","林家豪","周平","许朝阳","杨金生","何文辉","魏达","杨子麟","胡南","徐涛","马永昌"];
const COMMON_TYPES=["猛将","统将","军师","管事","说客","探子"];
const COMMON_TRAITS=["敢拼","稳手","快脚","会算账","善交际","记路","护短","老成"];

const RANDOM_EVENTS=[
  {id:"street_protection",title:"老街商户把门关早了",portrait:"assets/su-manqing.webp",body:"<p>连续几场血拼之后，老街上的卷帘门天还没黑就降了下来。苏曼青把一叠账单放在你面前：<span class='dialogue'>“地盘拿回来了，人不敢出门，这算谁的？”</span></p>",condition:s=>s.heat>=35,options:s=>[
    option("拿钱补贴商户","现金-12万；人心+10",()=>{addCash(s,-12);change(s,"support",10);change(s,"heat",-5);markStyle(s,"yi",2)}),
    option("先把地盘稳住","现金不变；人心-8",()=>{change(s,"support",-8);change(s,"morale",4);markStyle(s,"wei",1)},"danger")
  ]},
  {id:"old_debt",title:"旧账簿里有一页被撕过",portrait:"assets/father.webp",body:"<p>苏曼青在蓝色账簿里找到一道撕痕。纸下面只剩一句话：<span class='dialogue'>“谢家九郎，这条命是我欠的。”</span></p><p>两天后，谢九在老街口等你。</p>",condition:s=>s.wins>=2&&!s.flags.xieUnlocked&&!hasOfficer(s,"xiejiu"),options:s=>[
    option("把原话告诉他","谢九进入招募名单；义+2",()=>{s.flags.xieUnlocked=true;markStyle(s,"yi",2);log(s,"story","谢九看完那页旧账，只说了句“知道了”。")},"gold"),
    option("说父债子偿","谢九进入招募名单；威+2",()=>{s.flags.xieUnlocked=true;change(s,"rep",5);markStyle(s,"wei",2)})
  ]},
  {id:"cash_offer",title:"方景曜送来一张空白支票",portrait:"assets/fang-jingyao.webp",body:"<p>支票上没写数字。方景曜的人说，只要和联胜一年内不进新城，数字可以由你填。<span class='dialogue'>“方先生说，地盘是面子，现金才是里子。”</span></p>",condition:s=>!s.flags.cashOffer&&s.month>=8&&TERRITORY_DEFS.new_city&&s.territories.new_city.owner==="wan",options:s=>[
    option("把支票送回去","声望+8；万盛堂驻防上升",()=>{s.flags.cashOffer=true;change(s,"rep",8);s.territories.new_city.guard+=8;markStyle(s,"wei",2)}),
    option("填下30万","现金+30万；12个月内攻击新城会掉忠诚",()=>{s.flags.cashOffer=true;s.flags.cashDealUntil=s.month+12;addCash(s,30);markStyle(s,"li",3)},"gold")
  ]},
  {id:"captain_seat",title:"程野问了一句“我坐哪儿”",portrait:"assets/cheng-ye.webp",body:"<p>祖堂里添了两把椅子，都是新收编的头目坐的。程野拍了拍其中一把，笑着问：<span class='dialogue'>“这儿越来越热闹了。那我以后坐哪儿？”</span></p>",condition:s=>officer(s,"chengye")&&officer(s,"chengye").merit>=18&&!s.flags.chengSeat,options:s=>[
    option("让他管所有新人","程野忠诚+12；普通人才成本-10%",()=>{s.flags.chengSeat=true;s.flags.chengRecruitChief=true;loyalty(s,"chengye",12);markStyle(s,"yi",2)}),
    option("“椅子靠自己拿”","声望+5；程野怨气+15",()=>{s.flags.chengSeat=true;change(s,"rep",5);resent(s,"chengye",15);markStyle(s,"wei",2)},"danger")
  ]},
  {id:"zhao_no_war",title:"赵魁把出战名单撕了",portrait:"assets/zhao-kui.webp",body:"<p>你连续几个月没动。赵魁把出战名单放在桌上，然后当着你的面撕成了四片：<span class='dialogue'>“人都招回来了，是留着吃饭的？”</span></p>",condition:s=>s.month>=6&&s.month-(s.lastBattleMonth||0)>=5&&!s.flags.zhaoNoWar,options:s=>[
    option("答应下月之前开战","士气+8；若3个月不开战则反噬",()=>{s.flags.zhaoNoWar=true;s.flags.warPromise=s.month+3;change(s,"morale",8);loyalty(s,"zhaokui",4)}),
    option("让他学会等","赵魁忠诚-10；现金+8万",()=>{s.flags.zhaoNoWar=true;loyalty(s,"zhaokui",-10);resent(s,"zhaokui",10);addCash(s,8);markStyle(s,"li",2)},"danger")
  ]},
  {id:"wounded_families",title:"伤者家属在祖堂外等你",portrait:"assets/player.webp",body:"<p>那场仗打完后，祖堂外多了三把伞。没有人闹，他们只想知道，那些躺在诊所里的人以后怎么办。</p>",condition:s=>s.casualties>=18&&!s.flags.familyPaid,options:s=>[
    option("按最好的标准安顿","现金-18万；士气+12；义+3",()=>{s.flags.familyPaid=true;addCash(s,-18);change(s,"morale",12);change(s,"support",8);markStyle(s,"yi",3)}),
    option("按老规矩给钱","现金-7万；士气-3",()=>{s.flags.familyPaid=true;addCash(s,-7);change(s,"morale",-3);markStyle(s,"li",1)})
  ]}
];

function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,n))}
function rand(min,max,rng=Math.random){return Math.floor(rng()*(max-min+1))+min}
function pick(arr,rng=Math.random){return arr[Math.floor(rng()*arr.length)]}
function chance(p,rng=Math.random){return rng()<p}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
// 立绘一律以 assets/ 下的短路径在状态和存档里流转，只在真正写进 src 时才解析。
// 单文件版由 build_single.py 注入 ASSETS 查找表；模块化版本没有它，原样返回路径即可。
// 别把解析结果存回 officer.portrait —— cloneOfficer 会把它复制进存档，单条存档会涨到 1MB 以上。
function assetUrl(p){return typeof ASSETS!=="undefined"&&ASSETS[p]||p}
function change(obj,key,n){obj[key]=clamp((obj[key]??0)+n);return obj[key]}
function addCash(s,n){s.cash=Math.round((s.cash+n)*10)/10;return s.cash}
function option(text,effect,apply,tone=""){return{text,effect,apply,tone}}
function diff(s){return DIFFICULTIES[s.difficulty]||DIFFICULTIES.standard}
function markStyle(s,key,n=1){s.style[key]=(s.style[key]||0)+n}
function owns(s,id){return s.territories[id]&&s.territories[id].owner==="player"}
function ownTerritories(s){return Object.keys(s.territories).filter(id=>owns(s,id))}
function territoryCount(s,owner="player"){return Object.values(s.territories).filter(t=>t.owner===owner).length}
function officer(s,id){return s.officers.find(o=>o.id===id)}
function hasOfficer(s,id){const o=officer(s,id);return !!(o&&o.side==="player")}
function ownedOfficers(s){return s.officers.filter(o=>o.side==="player")}
function loyalty(s,id,n){const o=officer(s,id);if(o)o.loyalty=clamp(o.loyalty+n)}
function resent(s,id,n){const o=officer(s,id);if(o)o.resentment=clamp(o.resentment+n)}
function log(s,kind,text){s.log.unshift({month:s.month,kind,text,id:`log_${Date.now()}_${Math.random()}`});s.log=s.log.slice(0,100)}

function cloneOfficer(id,side,loyal=60){const d=CHARACTER_DEFS[id];return{id,name:d.name,side,role:d.role,type:d.type,portrait:d.portrait,stats:{...d.stats},trait:d.trait,traitText:d.traitText,loyalty:loyal,resentment:0,merit:0,injured:0,exp:0,battles:0,wins:0,named:true}}

function createInitialState(name="沈川",creed="yi",difficulty="standard"){
  const officers=[cloneOfficer("player","player",100),cloneOfficer("zhaokui","player",64),cloneOfficer("sumanqing","player",72),cloneOfficer("chengye","player",78),cloneOfficer("hewanshan","east",100),cloneOfficer("tangji","east",82),cloneOfficer("fangjingyao","wan",100),cloneOfficer("hanbiao","wan",79),cloneOfficer("guchangfeng","long",100),cloneOfficer("weixiaolou","long",76)];
  officers[0].name=(name||"沈川").trim().slice(0,8)||"沈川";
  if(creed==="yi"){officers.slice(1,4).forEach(o=>o.loyalty+=5)}
  const territories={};Object.entries(TERRITORY_DEFS).forEach(([id,t])=>territories[id]={owner:t.owner,guard:t.guard,level:1,stability:t.owner==="player"?72:82});
  const s={version:VERSION,runId:`fog_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,name:officers[0].name,creed:CREEDS[creed]?creed:"yi",difficulty:DIFFICULTIES[difficulty]?difficulty:"standard",month:0,ap:3,tab:"hall",cash:36,crew:42,morale:62,rep:18,support:55,heat:8,training:0,insolvencyMonths:0,style:{yi:creed==="yi"?2:0,wei:creed==="wei"?2:0,li:creed==="li"?2:0},territories,officers,intel:{old_street:true},recruitMarket:[],usedActions:{},log:[],flags:{fatherRetired:false,aqiUnlocked:false,xieUnlocked:false,yeUnlocked:false,coalition:false,debtCrisisQueued:false,emergencyLoanTaken:false},factions:{east:{defeated:false},wan:{defeated:false},long:{defeated:false}},wins:0,losses:0,battles:0,casualties:0,lastBattleMonth:0,lastAction:null,lastBattle:null,winStreak:0,battleSession:null,ended:false,endingReason:""};
  refreshRecruitMarket(s);log(s,"story",`${s.name}接过了和联胜的龙头印。`);return s;
}

function officerCapacity(s){return 5+ownTerritories(s).length*2+(owns(s,"new_city")?2:0)}
function commonOfficerCount(s){return ownedOfficers(s).filter(o=>!o.named).length}
function commonOfficer(id,name,type,trait,stats,cost,rng=Math.random){return{id,name,side:"market",role:`${type}人才`,type,portrait:"",stats,trait,traitText:`${trait}，在${type}岗位上更可靠。`,loyalty:rand(52,72,rng),resentment:0,merit:0,injured:0,exp:0,battles:0,wins:0,named:false,cost}}
function rngToken(rng=Math.random){return Math.floor(rng()*46656).toString(36).padStart(3,"0")}
function makeCommonCandidate(s,index=0,rng=Math.random){const type=pick(COMMON_TYPES,rng),name=pick(COMMON_NAMES.filter(n=>!s.officers.some(o=>o.name===n)&&!s.recruitMarket.some(o=>o.name===n)),rng)||`雾港青年${index+1}`,trait=pick(COMMON_TRAITS,rng);const base={force:rand(40,68,rng),command:rand(38,68,rng),scheme:rand(35,70,rng),business:rand(34,70,rng),charm:rand(38,72,rng)};const key={"猛将":"force","统将":"command","军师":"scheme","管事":"business","说客":"charm","探子":"scheme"}[type];base[key]=rand(67,80+(owns(s,"new_city")?5:0),rng);const cost=Math.round((Object.values(base).reduce((a,b)=>a+b,0)/28)+(type==="猛将"?3:0)),id=`common_${s.month}_${index}_${rngToken(rng)}`;return commonOfficer(id,name,type,trait,base,cost,rng)}
function refreshRecruitMarket(s,rng=Math.random){s.recruitMarket=[];for(let i=0;i<3;i++)s.recruitMarket.push(makeCommonCandidate(s,i,rng))}
function recruitCost(s,cost){let c=cost;if(s.creed==="li")c*=.85;if(s.flags.chengRecruitChief)c*=.9;return Math.max(1,Math.round(c))}
function hireCommon(s,id){if(s.ap<1)return false;if(ownedOfficers(s).length>=officerCapacity(s))return false;const i=s.recruitMarket.findIndex(o=>o.id===id);if(i<0)return false;const c=s.recruitMarket[i],cost=recruitCost(s,c.cost);if(s.cash<cost)return false;s.ap--;addCash(s,-cost);c.side="player";c.loyalty=clamp(c.loyalty+(s.creed==="yi"?6:0));s.officers.push(c);s.recruitMarket.splice(i,1);log(s,"good",`${c.name}带着自己的人加入和联胜。`);s.lastAction={name:"招募人才",text:`${c.name}（${c.type}）正式加入。`};return true}

function namedCandidateStatus(s,id){
  if(hasOfficer(s,id))return{state:"owned",text:"已加入"};
  if(id==="aqi")return s.month>=2||s.flags.aqiUnlocked?{state:"ready",text:"老街口等你"}:{state:"locked",text:"第3个月出现"};
  if(id==="yerong"){const revealed=s.cash>=45||owns(s,"west_market")||s.flags.yeUnlocked;if(!revealed)return{state:"locked",text:"需现金45万或占领西关"};return s.cash>=20?{state:"ready",text:"20万启动商路"}:{state:"unaffordable",text:`还差${Math.ceil(20-s.cash)}万`}}
  if(id==="xiejiu")return s.flags.xieUnlocked||s.wins>=3?{state:"ready",text:"要先证明你能打胜仗"}:{state:"locked",text:"赢下3场血拼后出现"};
  return{state:"locked",text:"剧情未解锁"};
}

function recruitNamed(s,id){
  if(s.ap<1||hasOfficer(s,id))return false;const st=namedCandidateStatus(s,id);if(st.state!=="ready")return false;
  if(id==="aqi"){s.ap--;const o=cloneOfficer(id,"player",68);s.officers.push(o);s.flags.aqiUnlocked=true;change(s,"support",5);log(s,"good","阿七拎着一只旧包走进了祖堂。");return true}
  if(id==="yerong"){if(s.cash<20)return false;s.ap--;addCash(s,-20);s.officers.push(cloneOfficer(id,"player",72));s.flags.yeUnlocked=true;markStyle(s,"li",2);log(s,"good","叶蓉把一张雾港商路图铺在了祖堂桌上。");return true}
  if(id==="xiejiu"){s.ap--;enqueue({title:"谢九要你亲自给个答案",portrait:CHARACTER_DEFS.xiejiu.portrait,body:"<p>谢九坐在老街茶馆的最里面，手边压着父亲旧账簿的那张复印件。<span class='dialogue'>“你爸欠我的，不是一把椅子。我想看看你能不能扛住他的名字。”</span></p>",options:[
      option("把战堂副位给他","谢九加入；赵魁怨气+12",()=>{s.officers.push(cloneOfficer(id,"player",67));resent(s,"zhaokui",12);markStyle(s,"yi",1)}),
      option("“先跟我打一场”","声望决定成功；失败则受伤",()=>{if(chance(.48+s.rep/180)){s.officers.push(cloneOfficer(id,"player",78));change(s,"rep",6);markStyle(s,"wei",2)}else{const p=officer(s,"player");p.injured=2;change(s,"morale",-5);log(s,"bad","谢九没留下，你却在那场较量里伤了肩。")}},"danger")
    ]},"人才招募");return true}
  return false;
}

function monthlyGross(s){let gross=ownTerritories(s).reduce((sum,id)=>sum+TERRITORY_DEFS[id].income*(s.territories[id].level||1),0);if(hasOfficer(s,"sumanqing"))gross*=1.12;if(hasOfficer(s,"yerong"))gross*=1.15;if(s.creed==="li")gross*=1.12;gross*=diff(s).income;return Math.round(gross)}
function monthlyUpkeep(s){let crew=s.crew*.13;if(owns(s,"south_dock"))crew*=.9;const officerCost=Math.max(0,ownedOfficers(s).length-4)*1.2,territoryCost=Math.max(0,ownTerritories(s).length-1)*2;return Math.round((crew+officerCost+territoryCost)*10)/10}
function monthlyNet(s){return Math.round((monthlyGross(s)-monthlyUpkeep(s))*10)/10}
function applyEconomy(s){const gross=monthlyGross(s),upkeep=monthlyUpkeep(s),net=Math.round((gross-upkeep)*10)/10;addCash(s,net);s.insolvencyMonths=s.cash<0?(s.insolvencyMonths||0)+1:0;if(owns(s,"golden_bay"))change(s,"heat",2);if(net<0){change(s,"morale",-7);ownedOfficers(s).filter(o=>o.id!=="player").forEach(o=>{o.loyalty=clamp(o.loyalty-3);o.resentment=clamp(o.resentment+2)});log(s,"bad",`本月收入${gross}万，支出${upkeep}万，账面继续失血。`)}else log(s,"story",`本月地盘净收入 ${net} 万。`);return{gross,upkeep,net}}

function checkInsolvency(s){
  if(s.ended||s.flags.debtCrisisQueued||!(s.cash<=BANKRUPT_CASH||(s.insolvencyMonths||0)>=2))return false;
  s.flags.debtCrisisQueued=true;
  const sellable=ownTerritories(s).filter(id=>id!=="old_street").sort((a,b)=>TERRITORY_DEFS[a].income-TERRITORY_DEFS[b].income),options=[];
  if(sellable.length){const id=sellable[0],price=Math.max(24,TERRITORY_DEFS[id].income*2);options.push(option(`卖掉${TERRITORY_DEFS[id].name}`,`现金+${price}万；失去该地盘`,()=>{s.territories[id].owner="coalition";s.territories[id].guard=24;s.territories[id].stability=56;addCash(s,price);change(s,"rep",-6);change(s,"support",-5);s.insolvencyMonths=0;s.flags.debtCrisisQueued=false;log(s,"bad",`${TERRITORY_DEFS[id].name}被拿去填了账。`)}))}
  if(!s.flags.emergencyLoanTaken)options.push(option("借一次救命钱","现金+35万；忠诚和人心下降",()=>{addCash(s,35);s.flags.emergencyLoanTaken=true;s.flags.debtCrisisQueued=false;s.insolvencyMonths=0;change(s,"support",-8);change(s,"heat",7);ownedOfficers(s).filter(o=>o.id!=="player").forEach(o=>o.loyalty=clamp(o.loyalty-5));markStyle(s,"li",2);log(s,"warn","和联胜借进了一笔只够救一次命的钱。")},"gold"));
  options.push(option("承认资金链断裂","进入破产结局",()=>endGame(s,"bankrupt"),"danger"));
  enqueue({title:"账房已经付不出下个月的钱",portrait:CHARACTER_DEFS.sumanqing.portrait,body:`<p>苏曼青把账簿推到你面前。现金已经跌到 <b>${Math.round(s.cash)} 万</b>，连续赤字 ${s.insolvencyMonths||0} 个月。</p><p><span class='dialogue'>“地盘还能抢回来。账一旦断了，人会先散。”</span></p>`,options},"资金链危机");
  return true;
}

function attackableTerritories(s){const mine=new Set(ownTerritories(s)),out=[];Object.keys(s.territories).forEach(id=>{if(mine.has(id))return;const def=TERRITORY_DEFS[id];if(def.final&&mine.size<7)return;if(def.neighbors.some(n=>mine.has(n)))out.push(id)});return out}
function factionLeaders(s,owner){return s.officers.filter(o=>o.side===owner&&o.injured<=0)}
function leaderScore(o,tactic="steady"){let score=(o.stats.force+o.stats.command)/8;if(tactic==="ambush")score+=o.stats.scheme/6;if(tactic==="persuade")score+=(o.stats.scheme+o.stats.charm)/12;if(tactic==="assault")score+=o.stats.force/10;return score}
function tacticMeta(id){return({assault:{name:"正面强攻",power:1.12,casualty:1.25},steady:{name:"稳扎稳打",power:1,casualty:.83},ambush:{name:"迂回奇袭",power:1.02,casualty:.94},persuade:{name:"攻心劝降",power:.92,casualty:.72}})[id]||{name:"稳扎稳打",power:1,casualty:1}}
function officerTraitPower(s,leaders,tactic){let m=1;if(tactic==="assault"&&leaders.some(o=>o.id==="zhaokui"))m*=1.12;if(tactic==="persuade"&&leaders.some(o=>o.id==="chengye"))m*=1.12;if(tactic==="ambush"&&leaders.some(o=>o.id==="weixiaolou"))m*=1.13;if(s.creed==="wei")m*=1.06;return m}
function defenderPower(s,targetId){const t=s.territories[targetId],owner=t.owner,leaders=factionLeaders(s,owner).slice().sort((a,b)=>leaderScore(b)-leaderScore(a)).slice(0,2);let power=t.guard*1.18+leaders.reduce((sum,o)=>sum+leaderScore(o,"steady"),0);if(targetId==="south_dock"||targetId==="shipyard")if(leaders.some(o=>o.id==="hewanshan"))power*=1.08;if(owner==="coalition")power*=1.08;return{power:power*diff(s).battle,leaders}}
function estimateBattle(s,targetId,leaderIds,troops,tactic){const leaders=leaderIds.map(id=>officer(s,id)).filter(Boolean),meta=tacticMeta(tactic);let power=troops*(.82+s.morale*.0048)+leaders.reduce((sum,o)=>sum+leaderScore(o,tactic),0)+(s.training||0)*.7;power*=meta.power*officerTraitPower(s,leaders,tactic);if(tactic==="ambush"&&!s.intel[targetId])power*=.78;const def=defenderPower(s,targetId).power,ratio=power/def;return{power,def,ratio,label:ratio>=1.28?"优势":ratio>=.88?"胶着":ratio>=.68?"凶险":"九死一生"}}

// ---- 三段式血拼 ----
// STAGE_SWING 校准自旧版单骰：U(0.84,1.18) 的 sd≈0.098；三段取平均会把方差压掉 √3，
// 故每段放宽到 0.295 才能让三段平均后的 sd 对齐。注意只有 sd 对齐——胜率曲线并不完全相同：
// 旧版均值是 1.01 且 1.18 的硬上限让 ratio<0.847 必败，新版该悬崖移到 0.772，
// 中段（ratio≈0.95）胜率约低 7 个百分点。改这个数会直接改难度曲线。
const STAGE_SWING=.295;
const STAGE_NAMES=["开局","僵持","决胜"];

function startBattle(s,{targetId,leaderIds,troops,tactic},rng=Math.random){
  if(s.battleSession)throw new Error("battle in progress");
  if(!attackableTerritories(s).includes(targetId))throw new Error("target not attackable");
  if(s.crew<10)throw new Error("not enough crew");
  const leaders=[...new Set(leaderIds)].map(id=>officer(s,id)).filter(o=>o&&o.side==="player"&&!o.injured).slice(0,3);
  if(!leaders.length)throw new Error("no leaders");
  troops=clamp(Math.round(troops),10,s.crew);
  if(!Number.isFinite(troops))throw new Error("invalid troops");
  const ids=leaders.map(o=>o.id),est=estimateBattle(s,targetId,ids,troops,tactic);
  const mods={multRest:1,moraleFloor:0,convertRate:0,pressed:false,retreatShield:false};
  if(ids.includes("player"))mods.moraleFloor=45;                                  // 沈川「沈家之后」
  if(ids.includes("yerong"))mods.retreatShield=true;                              // 叶蓉在阵：撤退不掉士气（经营首次参战）
  if(ids.includes("xiejiu")&&(s.winStreak||0)>=2)mods.multRest*=1.05;             // 谢九「只服胜者」
  s.battleSession={targetId,leaderIds:ids,troops,tactic,stage:1,momentum:0,ratio:est.ratio,losses:0,enemyLoss:0,outcome:"",mods,log:[]};
  return s.battleSession;
}

// 纯函数：同一 (s,session) 必须永远返回同样的选项，刷新后才能按存档重建界面。
// 压上/稳住/鸣金三项恒定保留（自动战斗依赖 hold 恒在），专属提议按 priority 降序取前 2，总上限 5。
// 选项是开放字段包：{id,mult,casualtyMult} 必填，speaker/text/effect/priority/convert 可选。
function lineupOfficer(s,session,id){const o=session.leaderIds.includes(id)?officer(s,id):null;return o&&o.side==="player"&&!o.injured?o:null}
function stageOptions(s,session){
  const zk=lineupOfficer(s,session,"zhaokui");
  const out=[
    {id:"press",speaker:zk?"赵魁":"",text:zk?"「压上去，别给他们喘气」":"压上去",effect:"势↑↑ 伤亡↑↑",mult:zk?1.15+zk.stats.force/1200:1.15,casualtyMult:1.3},
    {id:"hold",speaker:"",text:"稳住阵型",effect:"势— 伤亡↓",mult:1,casualtyMult:.85}
  ];
  out.push(...officerProposals(s,session).slice().sort((a,b)=>(b.priority||0)-(a.priority||0)).slice(0,2));
  if(session.stage>=2)out.push({id:"withdraw",speaker:lineupOfficer(s,session,"sumanqing")?"苏曼青":"",text:"鸣金收兵",effect:"保住剩下的人，此战作罢",mult:1,casualtyMult:0});
  return out;
}
// 效果按属性缩放，不是固定值——否则杂鱼说客和程野没区别。
// priority 决定被 stageOptions 截断时谁先留下：稀有/一次性的提议排前面。
function officerProposals(s,session){
  const out=[],sm=lineupOfficer(s,session,"sumanqing"),cy=lineupOfficer(s,session,"chengye");
  if(sm&&session.stage<=2&&sm.stats.scheme>=70)
    out.push({id:"flank",speaker:"苏曼青",text:"「他们左翼是空的」",effect:"势↑ 伤亡↓",mult:1+sm.stats.scheme/900,casualtyMult:.9,priority:2});
  if(lineupOfficer(s,session,"weixiaolou")&&!s.intel[session.targetId])
    out.push({id:"backdoor",speaker:"魏小楼",text:"「后门我一直留着」",effect:"势↑ 当场揭穿驻防",mult:1.12,casualtyMult:1,priority:3});
  if(cy&&session.momentum>20)
    out.push({id:"parley",speaker:"程野",text:"「让我去喊一嗓子」",effect:"胜则收编对方的人",mult:.95,casualtyMult:1,convert:cy.stats.charm/200,priority:4});
  if(lineupOfficer(s,session,"yerong")&&session.stage<=2)
    out.push({id:"supply",speaker:"叶蓉",text:"「退路和粮草我安排好了」",effect:"伤亡↓↓",mult:1,casualtyMult:.75,priority:2});
  const dc=duelChallenger(s,session);
  if(dc&&duelTarget(s,session))
    out.push({id:"duel",speaker:dc.name,text:"「那个人交给我」",effect:"单挑：胜则压制，败则受伤",mult:1,casualtyMult:1,priority:4});
  if(lineupOfficer(s,session,"aqi")&&session.stage>=2)
    out.push({id:"rearguard",speaker:"阿七",text:"「我来断后」",effect:"伤亡↓ 阿七成长更快",mult:1,casualtyMult:.85,priority:1});
  return out;
}
// 对手取敌方未受伤头目里武力最高者，并要求 force>=60——否则全局只有韩彪算猛将，单挑几乎不会出现。
function duelTarget(s,session){return factionLeaders(s,s.territories[session.targetId].owner).filter(o=>o.stats.force>=60).sort((a,b)=>b.stats.force-a.stats.force)[0]||null}
function duelChallenger(s,session){return["hanbiao","zhaokui","xiejiu"].map(id=>lineupOfficer(s,session,id)).filter(Boolean).sort((a,b)=>b.stats.force-a.stats.force)[0]||null}
function resolveDuel(s,session,rng){
  const me=duelChallenger(s,session),foe=duelTarget(s,session);
  if(!me||!foe)return"";
  let p=.5+(me.stats.force-foe.stats.force)/200;
  if(lineupOfficer(s,session,"hanbiao"))p+=.15;                    // 韩彪「顶门硬骨」：压住对方猛将
  p=clamp(p,.15,.85);                                              // 加成后再夹取，上限不被突破
  if(chance(p,rng)){foe.injured=rand(1,3,rng);session.mods.multRest*=1.25;me.merit+=8;return`${me.name}把${foe.name}逼到了墙角。`}
  me.injured=rand(1,3,rng);session.mods.multRest*=.85;change(s,"morale",-5);
  return`${me.name}没能压住${foe.name}，被抬了下去。`;
}
function stageLoss(s,session,stageOk,casualtyMult,rng){
  const meta=tacticMeta(session.tactic),morale=Math.max(s.morale,session.mods.moraleFloor);
  let rate=(stageOk?.12:.25)*meta.casualty*(1+(50-morale)/150)*casualtyMult;
  if(owns(s,"shipyard"))rate*=.92;
  if(!stageOk&&owns(s,"north_yard"))rate*=.88;
  return Math.max(1,Math.round(session.troops*rate*(.8+rng()*.45)/3));
}
function stageText(s,session,opt,stageOk,loss){
  const place=TERRITORY_DEFS[session.targetId].name,who=opt.speaker||session.leaderIds.map(id=>lineupOfficer(s,session,id)).find(Boolean)?.name||s.name;
  const head=opt.id==="press"?`${who}让队伍整个压了上去。`:opt.id==="hold"?`队伍一段一段往前挪，没人脱队。`:`${who}的安排开始起作用。`;
  return`${head}${stageOk?`${place}的防线往后缩了一截。`:`对面顶住了，${place}门口反而更密。`}本段折损 ${loss} 人。`;
}
function applyStageChoice(s,optionId,rng=Math.random){
  const session=s.battleSession;if(!session)throw new Error("no battle in progress");
  if(!(session.stage>=1&&session.stage<=3))throw new Error("battle already finished");
  const opt=stageOptions(s,session).find(o=>o.id===optionId);if(!opt)throw new Error("invalid option");
  if(opt.id==="withdraw"){session.outcome="retreat";return{ended:true,report:finishBattle(s,rng)}}
  const name=STAGE_NAMES[session.stage-1];let extra="";
  if(opt.id==="press")session.mods.pressed=true;
  if(opt.id==="backdoor"){s.intel[session.targetId]=true;extra=`魏小楼把${TERRITORY_DEFS[session.targetId].name}的真实驻防摊在了你面前。`}
  if(opt.id==="parley")session.mods.convertRate=opt.convert;
  if(opt.id==="rearguard"){const a=officer(s,"aqi");if(a)a.exp+=3}
  if(opt.id==="duel")extra=resolveDuel(s,session,rng);
  const u=1-STAGE_SWING+rng()*STAGE_SWING*2;
  const delta=(session.ratio*u*(opt.mult??1)*session.mods.multRest-1)*33.3;
  session.momentum=Math.round((session.momentum+delta)*10)/10;
  const stageWon=delta>=0,ahead=session.momentum>=0;                       // stageWon=本段打赢没有；ahead=累计是否领先
  const loss=stageLoss(s,session,ahead,(opt.casualtyMult??1),rng);         // 伤亡按累计局势定档，避免优势方被单段波动多收血
  const told=session.stage===3?ahead:stageWon;                             // 决胜段的叙述必须与最终胜负一致
  session.losses+=loss;s.crew=Math.max(1,s.crew-loss);s.casualties+=loss;
  session.enemyLoss+=Math.max(2,Math.round(s.territories[session.targetId].guard*(ahead?.15:.06)*(.85+rng()*.35)));
  session.log.push({name,text:stageText(s,session,opt,told,loss)+(extra?" "+extra:"")});
  session.stage++;
  if(session.stage>3){session.outcome=session.momentum>=0?"win":"loss";return{ended:true,report:finishBattle(s,rng)}}
  saveGame();return{ended:false,session};
}

function finishBattle(s,rng=Math.random){
  const session=s.battleSession;if(!session)return null;
  const {targetId,tactic,troops}=session,t=s.territories[targetId],oldOwner=t.owner;
  const won=session.outcome==="win",retreated=session.outcome==="retreat";
  const leaders=session.leaderIds.map(id=>officer(s,id)).filter(Boolean);
  const meritMult=won&&session.leaderIds.includes("tangji")?1.5:1;                 // 唐霁「唯能者居」
  s.battles++;s.lastBattleMonth=s.month;s.training=Math.max(0,(s.training||0)-8);
  change(s,"heat",won?8:retreated?3:5);
  leaders.forEach(o=>{o.battles++;o.merit+=Math.round((won?5:2)*meritMult);o.exp+=won?3:1;o.loyalty=clamp(o.loyalty+(won?2:-2));if(o.id==="aqi"){const k=pick(["force","command","scheme","charm"],rng);o.stats[k]=clamp(o.stats[k]+rand(1,2,rng),1,99)}});
  const injured=[];leaders.forEach(o=>{if(o.id!=="player"&&!o.injured&&chance(won?.08:retreated?.05:.18,rng)){o.injured=rand(1,3,rng);injured.push(o.name)}});
  let captured=null;
  if(won){
    s.wins++;s.winStreak=(s.winStreak||0)+1;
    change(s,"morale",9);change(s,"rep",7);change(s,"support",t.stability>=55?2:-2);
    addCash(s,Math.round(TERRITORY_DEFS[targetId].income*.8));
    t.owner="player";t.guard=Math.max(16,Math.round((troops-session.losses)*.45));
    t.stability=s.creed==="yi"?62:s.creed==="wei"?42:52;s.intel[targetId]=true;
    if(session.mods.convertRate>0){const gain=Math.round(session.enemyLoss*session.mods.convertRate);if(gain>0){s.crew+=gain;log(s,"good",`程野把 ${gain} 名对方的人带回了老街。`)}}
    const lts=factionLeaders(s,oldOwner).filter(o=>!["hewanshan","fangjingyao","guchangfeng"].includes(o.id));
    if(lts.length&&territoryCount(s,oldOwner)===0)captured=lts[0];
    log(s,"good",`和联胜拿下了${TERRITORY_DEFS[targetId].name}，伤${session.losses}人。`);
  }else{
    s.winStreak=0;
    if(retreated){
      if(!session.mods.retreatShield)change(s,"morale",-6);                        // 叶蓉在阵则不掉士气
      change(s,"rep",-2);
      if(session.mods.pressed)resent(s,"zhaokui",8);                               // 听了赵魁又收手
      log(s,"warn",`队伍从${TERRITORY_DEFS[targetId].name}撤了回来，折损${session.losses}人。`);
    }else{
      s.losses++;change(s,"morale",-10);change(s,"rep",-3);
      t.guard=Math.max(12,t.guard-session.enemyLoss);
      leaders.forEach(o=>o.resentment=clamp(o.resentment+2));
      log(s,"bad",`进攻${TERRITORY_DEFS[targetId].name}失利，折损${session.losses}人。`);
    }
    if(session.leaderIds.includes("xiejiu"))loyalty(s,"xiejiu",-6);                // 谢九败北忠诚共 -8
  }
  const report={targetId,targetName:TERRITORY_DEFS[targetId].name,oldOwner,leaders:session.leaderIds.slice(),troops,tactic,won,outcome:session.outcome,losses:session.losses,enemyLoss:session.enemyLoss,injured,captured:captured?.id||null,ratio:session.ratio,momentum:session.momentum,stages:session.log.slice()};
  s.lastBattle=report;s.battleSession=null;
  if(won){markStyle(s,s.creed,1);checkFactionDefeat(s,oldOwner,captured);checkVictory(s)}
  saveGame();return report;
}

// 无头/自动战斗：三段全选 hold。既有测试沿用它，也是平衡回归夹具。
function resolveBattle(s,plan,rng=Math.random){
  startBattle(s,plan,rng);
  while(s.battleSession)applyStageChoice(s,"hold",rng);
  return s.lastBattle;
}

function checkFactionDefeat(s,owner,captured){if(!["east","wan","long"].includes(owner)||territoryCount(s,owner)>0||s.factions[owner].defeated)return;s.factions[owner].defeated=true;const boss={east:"hewanshan",wan:"fangjingyao",long:"guchangfeng"}[owner],bossObj=officer(s,boss);if(bossObj)bossObj.side="defeated";addCash(s,20);s.crew+=12;change(s,"rep",12);log(s,"good",`${FACTIONS[owner].name}失去所有地盘，人马开始归附。`);if(captured)queueCaptiveDecision(s,captured,owner);enqueue({title:`${FACTIONS[owner].name}的招牌被摘下`,portrait:bossObj?.portrait,body:`<p>${bossObj?.name||"对方老大"}坐在空掉的堂口里，桌上没有茶。<span class='dialogue'>“地没了，人心也散了。你爸那时候，没有你这么快。”</span></p><p>从今天起，${FACTIONS[owner].name}不再是雾港地图上的一种颜色。</p>`,options:[option("收下他们的人","人手+12；声望+12",()=>{})]},"社团吞并")}

function queueCaptiveDecision(s,captured,owner){enqueue({title:`${captured.name}把自己的位置放在桌上`,portrait:captured.portrait,body:`<p>${captured.name}没走。他看了一眼被摘下来的招牌：<span class='dialogue'>“地盘是你打下来的。我的人还在，你敢不敢用？”</span></p>`,options:[
    option("留原职，整队收编",`${captured.name}加入；忠诚较低；义+2`,()=>{captured.side="player";captured.loyalty=s.creed==="yi"?68:55;captured.resentment=15;markStyle(s,"yi",2);change(s,"morale",4)},"gold"),
    option("只收人，不留头目","人手+8；威+2",()=>{captured.side="exiled";s.crew+=8;markStyle(s,"wei",2);change(s,"rep",3)}),
    option("给一笔钱让他离开雾港","现金-12万；减少后患",()=>{captured.side="exiled";addCash(s,-12);markStyle(s,"li",1)})
  ]},"战后收编")}

function enemyGrowth(s){Object.entries(s.territories).forEach(([id,t])=>{if(t.owner!=="player"){const add=Math.max(1,Math.round((1+TERRITORY_DEFS[id].income/18)*diff(s).enemyGrowth));t.guard=Math.min(TERRITORY_DEFS[id].final?110:78,t.guard+add)}})}
function enemyAttack(s,rng=Math.random){if(s.month<6||s.month%3!==0||!chance(diff(s).enemyAttack,rng))return null;const targets=ownTerritories(s).filter(id=>id!=="old_street"&&TERRITORY_DEFS[id].neighbors.some(n=>s.territories[n].owner!=="player"));const oldStreetAvailable=owns(s,"old_street")&&TERRITORY_DEFS.old_street.neighbors.some(n=>s.territories[n].owner!=="player");if(!targets.length&&oldStreetAvailable)targets.push("old_street");if(!targets.length)return null;const targetId=pick(targets,rng),enemyNeighbor=TERRITORY_DEFS[targetId].neighbors.map(id=>({id,owner:s.territories[id].owner})).find(x=>x.owner!=="player"),attacker=enemyNeighbor?.owner||"coalition",t=s.territories[targetId],defenders=ownedOfficers(s).filter(o=>!o.injured).sort((a,b)=>leaderScore(b)-leaderScore(a)).slice(0,2);const attackPower=(35+territoryCount(s,attacker)*12+s.month*.6)*diff(s).battle*(.85+rng()*.3),defPower=t.guard*1.15+defenders.reduce((a,o)=>a+leaderScore(o),0)+s.morale*.22,held=defPower>=attackPower,losses=Math.max(2,Math.round((held?.06:.13)*s.crew));s.crew=Math.max(1,s.crew-losses);s.casualties+=losses;change(s,"morale",held?4:-8);change(s,"heat",4);if(held){t.guard=Math.max(12,t.guard-rand(2,6,rng));log(s,"good",`${FACTIONS[attacker].name}反扑${TERRITORY_DEFS[targetId].name}，被留守人马挡了回去。`)}else{t.owner=attacker;t.guard=20;t.stability=58;change(s,"rep",-7);log(s,"bad",`${TERRITORY_DEFS[targetId].name}在反扑中失守。`)}const report={targetId,attacker,held,losses};enqueue({title:held?`反扑被挡在${TERRITORY_DEFS[targetId].name}`:`${TERRITORY_DEFS[targetId].name}失守`,portrait:factionLeaders(s,attacker)[0]?.portrait||"assets/player.webp",body:`<p>${FACTIONS[attacker].name}从外线压向${TERRITORY_DEFS[targetId].name}。${held?"留守头目撑到了援手赶到，对方没能迈过最后一道门。":"驻防连续求援，但人手赶到之前，招牌已经被摘下来。"}</p><p>本次折损 ${losses} 人。</p>`,options:[option(held?"守住了":"这笔账会讨回来","",()=>{})]},"敌对反扑");if(!held&&targetId==="old_street")endGame(s,"lost");return report}

function applyAction(s,id){const a=ACTIONS.find(x=>x.id===id);if(!a||s.ap<1||(s.usedActions[id]||0)>=a.max)return false;if(a.canRun&&!a.canRun(s)){toast(a.lockedText||"当前条件不足");return false}s.ap--;s.usedActions[id]=(s.usedActions[id]||0)+1;a.run(s);s.lastAction={name:a.name,text:s.log[0]?.text||"这个月做了一件事。"};saveGame();renderAll();return true}

function maybeUnlockNamed(s){if(s.month>=2&&!s.flags.aqiUnlocked&&!hasOfficer(s,"aqi")){s.flags.aqiUnlocked=true;enqueue({title:"老街口那个年轻人又来了",portrait:CHARACTER_DEFS.aqi.portrait,body:"<p>他叫阿七，连续三天坐在祖堂对面的台阶上。程野问他想要什么，他朝你的方向抬了抬下巴：<span class='dialogue'>“想看看他怎么把丢掉的东西拿回来。”</span></p>",options:[option("让他去招募页等着","解锁成长型人物阿七",()=>{change(s,"support",2)},"gold")]},"人才来投")}
  if((s.cash>=45||owns(s,"west_market"))&&!s.flags.yeUnlocked&&!hasOfficer(s,"yerong"))s.flags.yeUnlocked=true;
  if(s.wins>=3&&!s.flags.xieUnlocked&&!hasOfficer(s,"xiejiu"))s.flags.xieUnlocked=true;
}

function chooseRandomEvent(s,rng=Math.random){const valid=RANDOM_EVENTS.filter(e=>!s.flags[`event_${e.id}`]&&(!e.condition||e.condition(s)));if(!valid.length)return null;const e=pick(valid,rng);s.flags[`event_${e.id}`]=true;return{title:e.title,portrait:e.portrait,body:e.body,options:e.options(s)}}
function checkPromises(s){if(s.flags.warPromise&&s.month>s.flags.warPromise&&s.lastBattleMonth<s.flags.warPromise-2){s.flags.warPromise=0;loyalty(s,"zhaokui",-14);resent(s,"zhaokui",18);change(s,"morale",-8);log(s,"bad","你没有兑现对赵魁的开战承诺。")}}
function officerTension(s){ownedOfficers(s).filter(o=>o.id!=="player").forEach(o=>{if(o.resentment>=70&&o.loyalty<45&&chance(.2)){o.side="defected";s.crew=Math.max(1,s.crew-8);change(s,"morale",-10);log(s,"bad",`${o.name}带着8个人离开了和联胜。`)}else if(o.loyalty<35)change(s,"morale",-1)})}

function advanceMonth(s,force=false){if(s.battleSession){toast("先把这场血拼打完");return false}if(s.ended)return false;if(s.ap>0&&!force){enqueue({title:"本月还有行动点",body:`<p>还剩 <b>${s.ap}</b> 个行动点。它们不会带到下个月。</p>`,options:[option("继续安排","回到议事堂",()=>{}),option("直接进入下月","放弃剩余行动点",()=>setTimeout(()=>advanceMonth(s,true),80),"danger")]},"时间确认");return false}
  s.month++;s.ap=3;s.usedActions={};s.lastAction=null;applyEconomy(s);checkInsolvency(s);ownedOfficers(s).forEach(o=>{if(o.injured>0){o.injured--;if(o.injured===0)log(s,"good",`${o.name}伤愈回到了祖堂。`)}if(o.exp>=10){const k=pick(Object.keys(o.stats));o.stats[k]=clamp(o.stats[k]+1,1,99);o.exp-=10}});change(s,"morale",Math.round((58-s.morale)*.18));change(s,"heat",-2);refreshRecruitMarket(s);enemyGrowth(s);maybeUnlockNamed(s);checkPromises(s);officerTension(s);enemyAttack(s);
  // 老街在反扑里失守会当场结束这一局，别再往队列里塞这个月的剧情弹窗。
  if(s.ended){saveGame();renderAll();pumpModal();return true}
  if(s.month===4&&!s.flags.fatherRetired){s.flags.fatherRetired=true;enqueue({title:"沈振海最后一次走进祖堂",portrait:CHARACTER_DEFS.father.portrait,body:"<p>他比上个月更瘦，却自己走完了从门口到主位的路。他没有坐，只把蓝色旧账簿放在你的位置上。<span class='dialogue'>“以后这扇门，我不进了。”</span></p><p>赵魁低下头，苏曼青合上笔，程野替他拉开了门。父亲没有回头。</p>",options:[option("起身送他到门口","三名旧部忠诚+5；义+2",()=>{["zhaokui","sumanqing","chengye"].forEach(id=>loyalty(s,id,5));markStyle(s,"yi",2)}),option("留在主位上","声望+5；威+2",()=>{change(s,"rep",5);markStyle(s,"wei",2)})]},"父亲退场")}
  if(s.month%2===0){const e=chooseRandomEvent(s);if(e)enqueue(e,"雾港事件")}
  if(ownTerritories(s).length>=4&&!s.flags.coalition){s.flags.coalition=true;enqueue({title:"三家桌上出现了同一张地图",portrait:CHARACTER_DEFS.guchangfeng.portrait,body:"<p>顾长风把东潮会和万盛堂的人约到了一张桌上。地图中间，和联胜的颜色已经占了快一半。<span class='dialogue'>“再让他吃两块，下一个被拆招牌的就在这张桌上。”</span></p>",options:[option("让他们结盟","敌方反攻更快；和联胜声望+10",()=>{change(s,"rep",10);change(s,"morale",6)})]},"港城联盟")}
  if(s.month===60&&!s.flags.sixtyMonths){s.flags.sixtyMonths=true;enqueue({title:"父亲留下的日历翻过了五年",portrait:"assets/player.webp",body:`<p>五年前，你只有一条老街。现在和联胜控制着 <b>${ownTerritories(s).length}</b> 块地盘。</p><p>五年只是一个节点。中央港区还没有升起你的招牌，这场仗就不算打完。</p>`,options:[option("继续打到一统雾港","进入加时战役",()=>{change(s,"morale",8)},"gold")]},"五年之期")}
  checkVictory(s);saveGame();renderAll();pumpModal();return true
}

function checkVictory(s){if(ownTerritories(s).length===Object.keys(s.territories).length)endGame(s,"unified")}
function endingTitle(s){if(s.endingReason==="lost")return"父业尽失";if(s.endingReason==="bankrupt")return"账断人散";const max=Object.entries(s.style).sort((a,b)=>b[1]-a[1])[0]?.[0];if(max==="yi"&&ownedOfficers(s).filter(o=>o.loyalty>=70).length>=6)return"义字盟主";if(max==="wei")return"雾港枭雄";if(max==="li")return"地下皇帝";return"雾港话事人"}
// 结局不能抢在弹窗前面显示：终局之战的战报是在 endGame 之后才入队的，
// 而这个月早先排上的剧情弹窗此刻已经作废（它们还会改写已结束的存档）。
// 所以：清掉旧队列，把结局挂起，等队列彻底排空再由 pumpModal 揭晓。
function endGame(s,reason){if(s.ended)return;s.ended=true;s.endingReason=reason;saveGame();if(typeof document==="undefined")return;modalQueue.length=0;pendingEnding=s;setTimeout(flushEnding,0)}
function flushEnding(){if(!pendingEnding||modalBusy||modalQueue.length)return false;const s=pendingEnding;pendingEnding=null;showEnding(s);return true}

let S=null,creatorCreed="yi",creatorDifficulty="standard",prologueIndex=0,modalQueue=[],modalBusy=false,pendingEnding=null,saveErrorNotified=false,battleDraft={targetId:"",leaderIds:[],troops:20,tactic:"steady"};
const $=id=>typeof document!=="undefined"?document.getElementById(id):null;

function enqueue(decision,kicker="雾港事件"){if(!decision)return;modalQueue.push({...decision,kicker});pumpModal()}
function pumpModal(){if(typeof document==="undefined"||modalBusy)return;if(!modalQueue.length){flushEnding();return}const d=modalQueue.shift();modalBusy=true;$("modalKicker").textContent=d.kicker||"雾港事件";$("modalTitle").textContent=d.title||"";$("modalBody").innerHTML=d.body||"";const wrap=$("modalPortraitWrap");if(d.portrait){$("modalPortrait").src=assetUrl(d.portrait);wrap.classList.remove("hidden")}else wrap.classList.add("hidden");$("modalOptions").innerHTML=(d.options||[option("知道了","",()=>{})]).map((o,i)=>`<button class="option-btn ${o.tone||""}" data-option="${i}"><b>${esc(o.text)}</b><span>${esc(o.effect||"")}</span></button>`).join("");$("modalOptions").querySelectorAll("[data-option]").forEach(btn=>btn.addEventListener("click",()=>{const o=d.options?.[Number(btn.dataset.option)];try{o?.apply?.()}finally{$("modalMask").classList.add("hidden");modalBusy=false;saveGame();renderAll();setTimeout(pumpModal,70)}}));$("modalMask").classList.remove("hidden")}
function toast(text){const el=$("toast");if(!el)return;el.textContent=text;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1700)}

function saveGame(){if(!S||typeof localStorage==="undefined")return false;try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));saveErrorNotified=false;return true}catch(error){if(typeof console!=="undefined")console.error("[雾港] 本地存档失败",error);if(!saveErrorNotified){saveErrorNotified=true;toast("存档失败：本机存储空间可能不足")}return false}}
function normalizeState(s){if(!s||typeof s!=="object"||s.version!==VERSION||typeof s.name!=="string"||!Array.isArray(s.officers)||!s.territories||!Object.keys(TERRITORY_DEFS).every(id=>s.territories[id]))return null;s.flags={fatherRetired:false,aqiUnlocked:false,xieUnlocked:false,yeUnlocked:false,coalition:false,debtCrisisQueued:false,emergencyLoanTaken:false,...(s.flags||{})};s.insolvencyMonths=Number.isFinite(s.insolvencyMonths)?Math.max(0,s.insolvencyMonths):0;
  // 弹窗队列只活在内存里：载入时一定没有待答的危机弹窗，所以这个标志必须归零。
  // 否则在危机弹窗开着时刷新，标志会以 true 落盘，checkInsolvency 从此永远直接返回。
  s.flags.debtCrisisQueued=false;return s}
function loadGame(){if(typeof localStorage==="undefined")return null;try{return normalizeState(JSON.parse(localStorage.getItem(SAVE_KEY)||"null"))}catch{return null}}
function deleteSave(){if(typeof localStorage!=="undefined")localStorage.removeItem(SAVE_KEY)}

function monthDisplay(s,compact=false){const current=(s?.month||0)+1;if(current<=MAX_MONTHS)return compact?`${current}月`:`${current} / ${MAX_MONTHS}`;return`加时${compact?"":" "}${current-MAX_MONTHS}月`}
function showMenu(){["creator","prologue","game","ending"].forEach(id=>$(id)?.classList.add("hidden"));$("menu")?.classList.remove("hidden");const saved=loadGame(),btn=$("continueBtn");if(saved){btn.classList.remove("hidden");btn.innerHTML=`继续 · ${esc(saved.name)} · ${monthDisplay(saved,true)} <span>→</span>`}else btn.classList.add("hidden")}
function showCreator(){$("menu").classList.add("hidden");$("creator").classList.remove("hidden")}
function showGame(){if(!S){showMenu();toast("存档已失效，请重新开局");return false}["menu","creator","prologue","ending"].forEach(id=>$(id)?.classList.add("hidden"));$("game").classList.remove("hidden");if(S.ended){showEnding(S);return true}saveGame();renderAll();return true}
function renderPrologue(){const p=PROLOGUE[prologueIndex];$("prologuePortrait").src=assetUrl(p.portrait);$("prologueKicker").textContent=p.kicker;$("prologueTitle").textContent=p.title;$("prologueBody").innerHTML=p.body.map(x=>`<p>${x}</p>`).join("");$("prologueProgress").style.width=`${(prologueIndex+1)/PROLOGUE.length*100}%`;$("nextPrologueBtn").innerHTML=prologueIndex===PROLOGUE.length-1?"走进祖堂 <span>→</span>":"继续 <span>→</span>"}

function chapterInfo(s){const m=s.month;if(m>=MAX_MONTHS)return["加时战役 · 不统一不收手","加时决战"];if(m<12)return["第一年 · 守住父业","守住父业"];if(m<30)return[`第${Math.floor(m/12)+1}年 · 吞并小势力`,"吞并小势力"];if(m<48)return[`第${Math.floor(m/12)+1}年 · 港城争霸`,"港城争霸"];return[`第${Math.floor(m/12)+1}年 · 一统江湖`,"一统江湖"]}
function renderAll(){if(!S||typeof document==="undefined")return;const [chapter,phase]=chapterInfo(S),net=monthlyNet(S);$("chapterText").textContent=chapter;$("phaseText").textContent=phase;$("monthText").textContent=monthDisplay(S);$("apText").textContent=`${S.ap} / 3`;$("cashText").textContent=`${Math.round(S.cash)}万`;$("crewText").textContent=S.crew;$("playerNameText").textContent=S.name;$("creedBadge").textContent=CREEDS[S.creed].name;$("territoryCount").textContent=`${ownTerritories(S).length} / 8`;[["morale",S.morale],["rep",S.rep],["support",S.support],["heat",S.heat]].forEach(([k,v])=>{$(`${k}Text`).textContent=Math.round(v);$(`${k}Bar`).style.width=`${clamp(v)}%`});$("netIncomeText").textContent=`${net>=0?"+":""}${net}万`;$("netIncomeText").style.color=net>=0?"var(--green)":"var(--red)";$("incomeBreakdown").innerHTML=`<div class="income-item"><span>地盘总收入</span><b>+${monthlyGross(S)}万</b></div><div class="income-item"><span>人手与头目支出</span><b>-${monthlyUpkeep(S)}万</b></div>`;$("turnHint").textContent=`${attackableTerritories(S).length}块地可进攻 · ${ownedOfficers(S).length}/${officerCapacity(S)}名头目`;$("gameNav").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.tab===S.tab));renderTab()}
function metrics(rows){return`<div class="metric-grid">${rows.map(([v,l])=>`<div class="metric"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>`}

function renderTab(){({hall:renderHall,recruit:renderRecruit,map:renderMap,battle:renderBattle,roster:renderRoster,chronicle:renderChronicle}[S.tab]||renderHall)()}
function renderHall(){const panel=$("panel"),available=ACTIONS;panel.innerHTML=`<section class="hero-panel"><span class="eyebrow">MONTHLY COUNCIL</span><h2>${esc(S.name)}，这个月和联胜做什么？</h2><p>你的目标是吞并东潮会、万盛堂和长风社，最后攻入中央港区。行动点可以养人、攢钱、查情报；血拼本身不消耗行动点，但会消耗真实人手。</p>${metrics([[`${S.ap}/3`,"剩余行动"],[ownTerritories(S).length,"地盘"],[S.wins,"血拼胜场"],[ownedOfficers(S).length,"头目"]])}</section>${S.lastAction?`<div class="feedback-banner"><b>${esc(S.lastAction.name)}</b><p>${esc(S.lastAction.text)}</p></div>`:""}<div class="section-head"><h2>本月行动</h2><span>同类行动有次数限制</span></div><div class="action-grid">${available.map(a=>{const used=S.usedActions[a.id]||0,unavailable=!!(a.canRun&&!a.canRun(S)),disabled=S.ap<=0||used>=a.max||unavailable;return`<article class="action-card ${used?"used":""}"><div class="action-icon">${a.icon}</div><h3>${a.name}</h3><p>${a.desc}</p><div class="effect-row">${a.effects.map(x=>`<span>${x}</span>`).join("")}</div><button data-action="${a.id}" ${disabled?"disabled":""}>${used>=a.max?"本月已做":S.ap<=0?"行动点用完":unavailable?a.lockedText||"条件不足":"安排 · 1点"}</button></article>`}).join("")}</div><div class="section-head"><h2>父亲留下的三名旧部</h2><span>他们忠于的还不一定是你</span></div><div class="card-grid">${["zhaokui","sumanqing","chengye"].map(id=>officerMiniCard(officer(S,id))).join("")}</div>`;panel.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>applyAction(S,b.dataset.action)))}

function officerMiniCard(o){if(!o)return"";const face=o.portrait?`<img src="${assetUrl(o.portrait)}" alt="${esc(o.name)}">`:`<div class="common-avatar">${esc(o.name.slice(-1))}</div>`;return`<article class="officer-card ${o.portrait?"portrait-card":""} ${o.injured?"injured":""}">${face}<div class="card-copy"><div class="role-line"><h3>${esc(o.name)}</h3><span>${esc(o.type)}</span></div><p>${esc(o.trait)} · ${esc(o.role)}</p><div class="stat-chips"><span>武${o.stats.force}</span><span>统${o.stats.command}</span><span>谋${o.stats.scheme}</span><span>经${o.stats.business}</span><span>魅${o.stats.charm}</span></div><div class="meter-row"><span>忠诚 ${Math.round(o.loyalty)}</span><b>${o.injured?`伤${o.injured}月`:`功劳 ${o.merit}`}</b></div><div class="loyalty-track"><i style="width:${o.loyalty}%"></i></div></div></article>`}

function renderRecruit(){const panel=$("panel"),named=["aqi","yerong","xiejiu"];panel.innerHTML=`<section class="hero-panel"><span class="eyebrow">RECRUITMENT</span><h2>地盘是死的，肯为你守地的人才是真本钱</h2><p>普通人才每月刷新；核心人物需要胜场、现金、地盘或父亲旧账才会露面。头目上限随地盘增加。</p>${metrics([[`${ownedOfficers(S).length}/${officerCapacity(S)}`,"头目数/上限"],[commonOfficerCount(S),"普通人才"],[Math.round(S.cash)+"万","现金"],[S.rep,"声望"]])}</section><div class="section-head"><h2>雾港里有姓名的人</h2><span>全部拥有独立立绘与剧情</span></div><div class="card-grid">${named.map(id=>namedRecruitCard(id)).join("")}</div><div class="section-head"><h2>本月招募市场</h2><span>下月全部刷新</span></div><div class="card-grid">${S.recruitMarket.map(commonRecruitCard).join("")||'<div class="empty-state">本月没有合适人选。</div>'}</div>`;panel.querySelectorAll("[data-hire-common]").forEach(b=>b.addEventListener("click",()=>{if(hireCommon(S,b.dataset.hireCommon)){saveGame();renderAll()}else toast("行动点、现金或头目上限不足")}));panel.querySelectorAll("[data-hire-named]").forEach(b=>b.addEventListener("click",()=>{if(recruitNamed(S,b.dataset.hireNamed)){saveGame();renderAll()}else toast("条件还不够")}))}
function namedRecruitCard(id){const d=CHARACTER_DEFS[id],st=namedCandidateStatus(S,id),owned=st.state==="owned",disabled=st.state!=="ready"||S.ap<1;return`<article class="recruit-card portrait-card"><img src="${assetUrl(d.portrait)}" alt="${d.name}"><div class="card-copy"><div class="role-line"><h3>${d.name}</h3><span>${d.type}</span></div><p>${d.traitText}</p><div class="stat-chips"><span>武${d.stats.force}</span><span>统${d.stats.command}</span><span>谋${d.stats.scheme}</span><span>经${d.stats.business}</span><span>魅${d.stats.charm}</span></div><button data-hire-named="${id}" ${disabled||owned?"disabled":""}>${owned?"已加入":st.text}</button></div></article>`}
function commonRecruitCard(c){const cost=recruitCost(S,c.cost),disabled=S.ap<1||S.cash<cost||ownedOfficers(S).length>=officerCapacity(S);return`<article class="recruit-card"><div class="common-avatar">${esc(c.name.slice(-1))}</div><span class="eyebrow">${esc(c.type)}</span><h3>${esc(c.name)}</h3><p>${esc(c.trait)}。忠诚预估 ${Math.round(c.loyalty)}。</p><div class="stat-chips"><span>武${c.stats.force}</span><span>统${c.stats.command}</span><span>谋${c.stats.scheme}</span><span>经${c.stats.business}</span><span>魅${c.stats.charm}</span></div><button data-hire-common="${c.id}" ${disabled?"disabled":""}>${ownedOfficers(S).length>=officerCapacity(S)?"头目上限已满":`招募 · ${cost}万 · 1点`}</button></article>`}

function renderMap(){const panel=$("panel");panel.innerHTML=`<section class="hero-panel"><span class="eyebrow">FOG HARBOR MAP</span><h2>雾港没有空白的地，只有还没换招牌的地</h2><p>只能进攻与自家地盘相邻的区域。中央港区会在你拿下其余七块地后开放，那是最后一战。</p>${metrics([[ownTerritories(S).length,"已占地盘"],[monthlyGross(S)+"万","月总收入"],[attackableTerritories(S).length,"可攻目标"],[Object.values(S.factions).filter(x=>x.defeated).length,"已吞并社团"]])}</section><div class="map-legend">${Object.entries(FACTIONS).map(([id,f])=>`<span><i style="background:${f.color}"></i>${f.name}</span>`).join("")}</div><div class="territory-grid">${Object.keys(TERRITORY_DEFS).map(territoryCard).join("")}</div>`;panel.querySelectorAll("[data-attack-territory]").forEach(b=>b.addEventListener("click",()=>{S.tab="battle";battleDraft.targetId=b.dataset.attackTerritory;renderAll()}));panel.querySelectorAll("[data-upgrade-territory]").forEach(b=>b.addEventListener("click",()=>upgradeTerritory(b.dataset.upgradeTerritory)))}
function territoryCard(id){const d=TERRITORY_DEFS[id],t=S.territories[id],f=FACTIONS[t.owner],mine=t.owner==="player",attackable=attackableTerritories(S).includes(id),locked=d.final&&ownTerritories(S).length<7,cost=territoryUpgradeCost(S,id);return`<article class="territory-card ${mine?"mine":""} ${attackable?"attackable":""} ${locked?"locked":""}" style="--owner-color:${f.color}"><span class="territory-owner">${f.name}</span><h3>${d.name}</h3><p class="territory-bonus">${d.bonus}</p><div class="stat-chips"><span>收入 ${d.income*t.level}万</span><span>驻防 ${t.guard}</span><span>稳定 ${t.stability}</span><span>Lv.${t.level}</span></div><div class="territory-actions">${mine?`<button data-upgrade-territory="${id}" ${S.ap<1||S.cash<cost?"disabled":""}>投资 ${cost}万·1点</button>`:attackable?`<button data-attack-territory="${id}">制定进攻计划</button>`:`<button disabled>${locked?"最终区域":"尚不相邻"}</button>`}</div></article>`}
function territoryUpgradeCost(s,id){let cost=18+(s.territories[id].level-1)*16;if(owns(s,"west_market"))cost*=.85;return Math.round(cost)}
function upgradeTerritory(id){const t=S.territories[id];if(!t||t.owner!=="player"||S.ap<1||t.level>=3)return;const cost=territoryUpgradeCost(S,id);if(S.cash<cost){toast("现金不足");return}S.ap--;addCash(S,-cost);t.level++;t.guard+=10;t.stability=clamp(t.stability+8);log(S,"good",`${TERRITORY_DEFS[id].name}完成了一轮投资和加固。`);saveGame();renderAll()}

function renderBattle(){const panel=$("panel"),targets=attackableTerritories(S);if(!targets.length){panel.innerHTML='<div class="empty-state">当前没有可进攻地盘。如果你已占七地，中央港区会成为最后目标。</div>';return}if(S.crew<10){panel.innerHTML=`<section class="hero-panel"><span class="eyebrow">BATTLE PLAN</span><h2>人手不足，今晚不能开战</h2><p>至少需要10名可调人手。当前只有 <b>${S.crew}</b> 人，先去议事堂招人或等待地盘回款。</p></section><button class="launch-btn" disabled>人手不足10人</button>${S.lastBattle?renderLastBattle(S.lastBattle):""}`;return}if(!targets.includes(battleDraft.targetId))battleDraft.targetId=targets[0];const available=ownedOfficers(S).filter(o=>!o.injured);battleDraft.leaderIds=battleDraft.leaderIds.filter(id=>available.some(o=>o.id===id)).slice(0,3);if(!battleDraft.leaderIds.length)battleDraft.leaderIds=available.slice().sort((a,b)=>leaderScore(b)-leaderScore(a)).slice(0,3).map(o=>o.id);battleDraft.troops=clamp(battleDraft.troops,10,S.crew);const est=estimateBattle(S,battleDraft.targetId,battleDraft.leaderIds,battleDraft.troops,battleDraft.tactic);panel.innerHTML=`<section class="hero-panel"><span class="eyebrow">BATTLE PLAN</span><h2>每拿一块地，都要先决定让谁去、带多少人去</h2><p>情报、主将、战术和士气会共同决定胜负。双方实力越接近，临场波动越可能改写结果。</p>${metrics([[S.crew,"可调人手"],[S.morale,"当前士气"],[S.training,"整训加成"],[S.intel[battleDraft.targetId]?"已查清":"未查清","目标情报"]])}</section><div class="section-head"><h2>血拼计划</h2><span>发起进攻不消耗行动点</span></div><div class="battle-layout"><div class="battle-targets">${targets.map(id=>`<button class="target-row ${id===battleDraft.targetId?"active":""}" data-target="${id}"><b>${TERRITORY_DEFS[id].name}</b><span>${FACTIONS[S.territories[id].owner].name} · ${S.intel[id]?`驻防 ${S.territories[id].guard}`:"驻防不明"}</span></button>`).join("")}</div><div class="battle-form"><span class="form-label">选择战术</span><div class="tactic-grid">${[["assault","正面强攻"],["steady","稳扎稳打"],["ambush","迂回奇袭"],["persuade","攻心劝降"]].map(([id,n])=>`<button class="tactic-btn ${battleDraft.tactic===id?"active":""}" data-tactic="${id}">${n}</button>`).join("")}</div><span class="form-label">选择头目（最多3人）</span><div class="leader-checks">${available.map(o=>`<div class="leader-check"><input id="lead_${o.id}" type="checkbox" data-leader="${o.id}" ${battleDraft.leaderIds.includes(o.id)?"checked":""}><label for="lead_${o.id}">${esc(o.name)} · ${esc(o.type)}</label></div>`).join("")}</div><span class="form-label">参战人手：<b id="troopValue">${battleDraft.troops}</b> / ${S.crew}</span><input id="troopRange" class="troop-range" type="range" min="10" max="${S.crew}" value="${battleDraft.troops}"><div id="battleEstimate" class="battle-estimate">战前评估：<b>${est.label}</b>${hasOfficer(S,"sumanqing")?`<br>预估攻守比 ${est.ratio.toFixed(2)}，随机与人物特性仍可能改写结果。`:"<br>苏曼青不在阵中，只能给出粗略判断。"}</div><button id="launchBattle" class="launch-btn" ${battleDraft.leaderIds.length?"":"disabled"}>开战 · ${TERRITORY_DEFS[battleDraft.targetId].name}</button></div></div>${S.lastBattle?renderLastBattle(S.lastBattle):""}`;panel.querySelectorAll("[data-target]").forEach(b=>b.addEventListener("click",()=>{battleDraft.targetId=b.dataset.target;renderBattle()}));panel.querySelectorAll("[data-tactic]").forEach(b=>b.addEventListener("click",()=>{battleDraft.tactic=b.dataset.tactic;renderBattle()}));panel.querySelectorAll("[data-leader]").forEach(c=>c.addEventListener("change",()=>{const id=c.dataset.leader;if(c.checked){if(battleDraft.leaderIds.length>=3){c.checked=false;toast("最多选3名头目");return}battleDraft.leaderIds.push(id)}else battleDraft.leaderIds=battleDraft.leaderIds.filter(x=>x!==id);renderBattle()}));$("troopRange").addEventListener("input",e=>{battleDraft.troops=Number(e.target.value);$("troopValue").textContent=battleDraft.troops;const x=estimateBattle(S,battleDraft.targetId,battleDraft.leaderIds,battleDraft.troops,battleDraft.tactic);$("battleEstimate").innerHTML=`战前评估：<b>${x.label}</b>${hasOfficer(S,"sumanqing")?`<br>预估攻守比 ${x.ratio.toFixed(2)}`:""}`});$("launchBattle").addEventListener("click",launchBattle)}
function renderLastBattle(r){return`<div class="section-head"><h2>上一场战报</h2><span>${r.won?"夺地成功":"进攻失利"}</span></div><div class="battle-report"><div class="result-score"><span>和联胜</span><strong>${r.won?"胜":"败"}</strong><span>${esc(r.targetName)}</span></div>${r.stages.map(x=>`<article class="battle-stage"><time>${x.name}</time><div><h3>${esc(r.targetName)}</h3><p>${esc(x.text)}</p></div></article>`).join("")}</div>`}
function launchBattle(){
  if(!S){toast("当前存档已经失效");return false}
  if(S.crew<10){toast("至少需要10名人手才能开战");return false}
  if(!battleDraft.leaderIds.length){toast("至少选择一名头目");return false}
  const target=battleDraft.targetId;
  try{
    if(S.flags.cashDealUntil&&S.month<=S.flags.cashDealUntil&&target==="new_city"){ownedOfficers(S).filter(o=>o.id!=="player").forEach(o=>o.loyalty=clamp(o.loyalty-5));delete S.flags.cashDealUntil;log(S,"warn","你撕碎了方景曜那张支票上的承诺。")}
    const report=resolveBattle(S,{...battleDraft});battleDraft.leaderIds=[];saveGame();renderAll();enqueue({title:report.won?`${report.targetName}的招牌换了`:`队伍从${report.targetName}撤了回来`,portrait:officer(S,report.leaders[0])?.portrait,body:`<div class="result-score"><span>和联胜</span><strong>${report.won?"胜":"败"}</strong><span>${esc(report.targetName)}</span></div>${report.stages.map(x=>`<div class="battle-stage"><time>${x.name}</time><div><p>${esc(x.text)}</p></div></div>`).join("")}${report.injured.length?`<p style="color:var(--red)">${esc(report.injured.join("、"))}在本场受伤。</p>`:""}`,options:[option(report.won?"把和联胜的招牌挂上去":"整队，这场不算完",`折损 ${report.losses} 人`,()=>{})]},"血拼战报");return true
  }catch(error){if(typeof console!=="undefined")console.error("[雾港] 血拼结算失败",error);toast(error?.message==="target not attackable"?"目标地盘已经无法进攻，请重新选择":error?.message==="no leaders"?"没有可用头目参战":error?.message==="not enough crew"?"至少需要10名人手才能开战":"血拼结算失败，当前进度没有变化");renderAll();return false}
}

function renderRoster(){const panel=$("panel"),own=ownedOfficers(S),others=S.officers.filter(o=>o.side!=="player"&&o.named);panel.innerHTML=`<section class="hero-panel"><span class="eyebrow">ROSTER</span><h2>头目不是一张战力卡，他们会立功、受伤、要位置，也会记仇</h2><p>忠诚低且怨气高的头目可能带人出走。带他出战、安排谈话和兑现承诺，才能把收编的人真正变成自己人。</p>${metrics([[own.length,"我方头目"],[Math.round(own.reduce((a,o)=>a+o.loyalty,0)/own.length),"平均忠诚"],[own.filter(o=>o.injured).length,"负伤"],[own.reduce((a,o)=>a+o.merit,0),"总功劳"]])}</section><div class="section-head"><h2>和联胜名册</h2><span>${own.length}/${officerCapacity(S)}</span></div><div class="officer-grid">${own.map(officerMiniCard).join("")}</div><div class="section-head"><h2>雾港其他人物</h2><span>打败一家社团后，其主将可能被收编</span></div><div class="officer-grid">${others.map(o=>`<article class="officer-card portrait-card enemy"><img src="${assetUrl(o.portrait)}" alt="${o.name}"><div class="card-copy"><div class="role-line"><h3>${o.name}</h3><span>${FACTIONS[o.side]?.name||"已离场"}</span></div><p>${o.traitText}</p><div class="stat-chips"><span>武${o.stats.force}</span><span>统${o.stats.command}</span><span>谋${o.stats.scheme}</span><span>经${o.stats.business}</span><span>魅${o.stats.charm}</span></div></div></article>`).join("")}</div>`}
function renderChronicle(){const panel=$("panel");panel.innerHTML=`<section class="hero-panel"><span class="eyebrow">CHRONICLE</span><h2>最后大家记住的，不是你当时说了什么</h2><p>每次招募、血拼、吞并、失守和承诺都会留在这里。阿七的最终成长，也会根据你在这些事上的做法决定。</p>${metrics([[S.battles,"血拼场次"],[S.wins,"胜场"],[S.casualties,"累计折损"],[CREEDS[Object.entries(S.style).sort((a,b)=>b[1]-a[1])[0][0]].name,"当前作风"]])}</section><div class="section-head"><h2>江湖记事</h2><span>最近100条</span></div><div class="chronicle">${S.log.map(l=>`<article class="log-row"><time>第${l.month+1}月</time><div><b>${l.kind==="good"?"得势":l.kind==="bad"?"代价":l.kind==="warn"?"暗流":"记事"}</b><p>${esc(l.text)}</p></div></article>`).join("")}</div>`}

function showEnding(s){$("game")?.classList.add("hidden");$("ending").classList.remove("hidden");const title=endingTitle(s),victory=s.endingReason==="unified",aqi=officer(s,"aqi"),styleKey=Object.entries(s.style).sort((a,b)=>b[1]-a[1])[0][0],styleName=CREEDS[styleKey].name;let line;if(s.endingReason==="bankrupt")line="账房最后一次合上账簿时，祖堂里还亮着灯，但已经没人等着领下个月的钱。地盘没有一夜丢光，和联胜却先从人心里散了。";else if(!victory)line="老街的招牌被摘下时，祖堂里没有人说话。父亲留下的那本蓝色账簿，终于没有人再往后翻。";else if(styleKey==="yi")line="中央港区的招牌升起时，从敌对社团过来的人也站在人群里。他们服的不是沈振海的姓，是你这些年没赖掉的账。";else if(styleKey==="wei")line="最后一块招牌落地后，雾港安静了很久。没人怀疑你说的话，也没人敢问那些空着的椅子原来属于谁。";else line="雾港的货车、码头和新城账本上，最后都出现了和联胜的名字。父亲留下的社团被你变成了一台不会停的机器。";const aqiLine=aqi?`<p>阿七站在人群最后面。这些年他学会的是“${styleName}”。有一天这枚龙头印再交到下一个人手上时，他大概会用同一种方式坐下。</p>`:"";$("endingBody").innerHTML=`<span class="eyebrow">${victory?"FOG HARBOR UNITED":"GAME OVER"}</span><h1>${title}</h1><div class="story-body"><p>${line}</p>${aqiLine}</div><div class="ending-stats"><div><b>${s.month+1}</b><span>经过月数</span></div><div><b>${ownTerritories(s).length}</b><span>地盘</span></div><div><b>${s.wins}</b><span>胜场</span></div><div><b>${ownedOfficers(s).length}</b><span>最终头目</span></div></div><button id="endingRestart" class="primary-btn">重新接印</button>`;$("endingRestart").addEventListener("click",()=>{if(confirm("删除当前存档并重新开始？")){deleteSave();S=null;showMenu()}})}

// iOS Safari 10+ ignores user-scalable=no, so pinch has to be blocked here too.
// touch-action:manipulation in style.css covers double-tap zoom.
function lockZoom(){["gesturestart","gesturechange","gestureend"].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}))}

function boot(){lockZoom();const saved=loadGame();$("newGameBtn")?.addEventListener("click",showCreator);$("continueBtn")?.addEventListener("click",()=>{S=loadGame();showGame()});$("creedPicker")?.querySelectorAll("[data-creed]").forEach(b=>b.addEventListener("click",()=>{creatorCreed=b.dataset.creed;$("creedPicker").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))}));$("difficultyPicker")?.querySelectorAll("[data-difficulty]").forEach(b=>b.addEventListener("click",()=>{creatorDifficulty=b.dataset.difficulty;$("difficultyPicker").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))}));$("startGameBtn")?.addEventListener("click",()=>{S=createInitialState($("playerName").value,creatorCreed,creatorDifficulty);prologueIndex=0;$("creator").classList.add("hidden");$("prologue").classList.remove("hidden");renderPrologue()});$("nextPrologueBtn")?.addEventListener("click",()=>{if(prologueIndex<PROLOGUE.length-1){prologueIndex++;renderPrologue()}else showGame()});$("gameNav")?.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{if(!S){showMenu();return}S.tab=b.dataset.tab;saveGame();renderAll()}));$("endMonthBtn")?.addEventListener("click",()=>S&&advanceMonth(S));$("saveBtn")?.addEventListener("click",()=>{if(saveGame())toast("进度已保存在本机")});$("restartBtn")?.addEventListener("click",()=>{if(confirm("删除当前存档并重新开始？")){deleteSave();S=null;showMenu()}});showMenu();if(saved&&saved.ended){S=saved}}

if(typeof document!=="undefined")document.addEventListener("DOMContentLoaded",boot);
if(typeof module!=="undefined"&&module.exports)module.exports={CHARACTER_DEFS,TERRITORY_DEFS,createInitialState,makeCommonCandidate,refreshRecruitMarket,hireCommon,monthlyGross,monthlyUpkeep,attackableTerritories,estimateBattle,startBattle,stageOptions,applyStageChoice,finishBattle,resolveBattle,advanceMonth,ownTerritories,officerCapacity,applyAction,applyEconomy,checkInsolvency,monthDisplay,normalizeState,namedCandidateStatus};
