import assert from "node:assert/strict";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const game=require("../app.js");

const s=game.createInitialState("沈测试","yi","standard");
assert.equal(s.name,"沈测试");
assert.equal(game.ownTerritories(s).length,1);
assert.equal(Object.keys(s.territories).length,8);
assert.deepEqual(new Set(game.attackableTerritories(s)),new Set(["south_dock","golden_bay","west_market"]));
assert.equal(s.ap,3);
assert.equal(s.crew,42);
assert.equal(s.regroup,0,"开局没有整补中的人");
assert.equal(s.wounded,0,"开局没有伤员");
assert.equal(game.totalCrew(s),42,"总人手=能战+整补+养伤");
assert.equal(game.crewCap(s),60,"开局只有老街一块地：40+1*20+0");
assert.ok(game.monthlyGross(s)>game.monthlyUpkeep(s),"开局不应当立即入不敷出");
assert.equal(game.officerCapacity(s),7);

const poor=game.createInitialState("沈没钱","yi","standard");
poor.cash=0;
const poorCrew=poor.crew;
assert.equal(game.applyAction(poor,"recruit_crew"),false,"现金不足时不能无限招人");
assert.equal(poor.cash,0);
assert.equal(poor.crew,poorCrew);

function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
const seededBase=game.createInitialState("沈种子","yi","standard");
seededBase.recruitMarket=[];
const seededTwin=structuredClone(seededBase);
assert.deepEqual(
  game.makeCommonCandidate(seededBase,0,seeded(20260729)),
  game.makeCommonCandidate(seededTwin,0,seeded(20260729)),
  "传入相同rng时普通头目必须完全可复现"
);

const debt=game.createInitialState("沈负债","li","standard");
debt.cash=-31;
debt.insolvencyMonths=1;
assert.equal(game.checkInsolvency(debt),true);
assert.equal(debt.flags.debtCrisisQueued,true);
assert.equal(game.checkInsolvency(debt),false,"同一场资金危机不能重复入队");

const overtime=game.createInitialState("沈加时","wei","standard");
overtime.month=59;
assert.equal(game.monthDisplay(overtime),"60 / 60");
overtime.month=60;
assert.equal(game.monthDisplay(overtime),"加时 1月");

const yeState=game.createInitialState("沈商路","li","standard");
yeState.flags.yeUnlocked=true;
yeState.cash=19;
assert.equal(game.namedCandidateStatus(yeState,"yerong").state,"unaffordable");
yeState.cash=20;
assert.equal(game.namedCandidateStatus(yeState,"yerong").state,"ready");

const oldSave=game.createInitialState("沈旧档","yi","standard");
delete oldSave.insolvencyMonths;
delete oldSave.flags.debtCrisisQueued;
assert.equal(game.normalizeState(oldSave).insolvencyMonths,0);
assert.equal(oldSave.flags.debtCrisisQueued,false);
assert.equal(game.normalizeState({version:1,name:"坏档"}),null);

const shortCrew=game.createInitialState("沈缺人","wei","standard");
shortCrew.crew=9;
assert.throws(()=>game.resolveBattle(shortCrew,{
  targetId:"south_dock",
  leaderIds:["player"],
  troops:9,
  tactic:"steady"
},()=>.5),/not enough crew/);

const bs=game.createInitialState("沈开战","yi","standard");
bs.crew=120;
const sess=game.startBattle(bs,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:60,tactic:"steady"});
assert.equal(sess.stage,1,"开战后停在第1段");
assert.equal(sess.momentum,0);
assert.equal(sess.losses,0);
assert.ok(sess.ratio>0,"ratio 必须在开战时冻结");
assert.equal(bs.crew,60,"出战即扣人：120-60");
assert.equal(sess.mods.moraleFloor,45,"沈川在阵→士气下限45");
assert.equal(bs.battleSession,sess);
assert.deepEqual(sess.leaderIds,["player","zhaokui"],"leaderIds 应按入参顺序保留");
const dedup=game.createInitialState("沈重复","yi","standard");
dedup.crew=120;
const dsess=game.startBattle(dedup,{targetId:"south_dock",leaderIds:["player","player","player"],troops:60,tactic:"steady"});
assert.deepEqual(dsess.leaderIds,["player"],"重复头目必须去重，否则战力和奖励都会翻倍");
const picky=game.createInitialState("沈筛选","yi","standard");
picky.crew=120;
picky.officers.find(o=>o.id==="zhaokui").injured=2;
const psess=game.startBattle(picky,{targetId:"south_dock",leaderIds:["zhaokui","hewanshan","sumanqing","chengye","player"],troops:60,tactic:"steady"});
assert.deepEqual(psess.leaderIds,["sumanqing","chengye","player"],"受伤与敌方头目要剔除，且最多取3人");
const busy=game.createInitialState("沈重入","yi","standard");
busy.crew=120;
game.startBattle(busy,{targetId:"south_dock",leaderIds:["player"],troops:60,tactic:"steady"});
assert.throws(()=>game.startBattle(busy,{targetId:"golden_bay",leaderIds:["player"],troops:60,tactic:"steady"}),/battle in progress/,"已有战斗进行中时不得再开一场");
const nolead=game.createInitialState("沈无将","yi","standard");
nolead.crew=120;
assert.throws(()=>game.startBattle(nolead,{targetId:"south_dock",leaderIds:["hewanshan"],troops:60,tactic:"steady"}),/no leaders/);
assert.throws(()=>game.startBattle(nolead,{targetId:"south_dock",leaderIds:["player"],troops:undefined,tactic:"steady"}),/invalid troops/);

const stateBefore=JSON.stringify(bs);
const opt1=game.stageOptions(bs,sess);
assert.equal(JSON.stringify(bs),stateBefore,"stageOptions 必须无副作用");
assert.deepEqual(opt1,game.stageOptions(bs,sess),"stageOptions 必须幂等");
// 幂等的真正用途是刷新后重建界面，所以要按 JSON 往返验证
const revived=JSON.parse(JSON.stringify(bs));
assert.deepEqual(game.stageOptions(revived,revived.battleSession),opt1,"存档往返后选项必须一致");
assert.ok(opt1.every(o=>Number.isFinite(o.mult)&&Number.isFinite(o.casualtyMult)),"每个选项都要有可用的 mult 和 casualtyMult");
const press1=opt1.find(o=>o.id==="press");
assert.equal(press1.speaker,"赵魁","赵魁在阵时由他喊话");
assert.ok(press1.mult>1.15,"赵魁在阵时压上威力更高");
assert.ok(opt1.some(o=>o.id==="hold"));
assert.ok(!opt1.some(o=>o.id==="withdraw"),"第1段不给鸣金");
// 赵魁受伤后应退回通用文案与基础威力
bs.officers.find(o=>o.id==="zhaokui").injured=2;
const hurt=game.stageOptions(bs,sess).find(o=>o.id==="press");
assert.equal(hurt.speaker,"","赵魁受伤后不再喊话");
assert.equal(hurt.mult,1.15);
// 已出走的头目不得继续提议
bs.officers.find(o=>o.id==="zhaokui").injured=0;
bs.officers.find(o=>o.id==="zhaokui").side="defected";
assert.equal(game.stageOptions(bs,sess).find(o=>o.id==="press").speaker,"","出走的头目不得继续参战提议");
bs.officers.find(o=>o.id==="zhaokui").side="player";
sess.stage=2;
assert.ok(game.stageOptions(bs,sess).some(o=>o.id==="withdraw"),"第2段起必须有鸣金");
assert.ok(game.stageOptions(bs,sess).length<=5);
assert.ok(game.stageOptions(bs,sess).some(o=>o.id==="hold"),"稳住必须恒在，自动战斗依赖它");
sess.stage=1;
// 月度推进不得在血拼进行中发生
const midFight=game.createInitialState("沈月中","yi","standard");
midFight.crew=120;
game.startBattle(midFight,{targetId:"south_dock",leaderIds:["player"],troops:60,tactic:"steady"});
assert.equal(game.advanceMonth(midFight,true),false,"血拼进行中不得推进月份");
assert.equal(midFight.month,0);

const adv=game.createInitialState("沈推进","yi","standard");
adv.crew=120;
const advSess=game.startBattle(adv,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:60,tactic:"steady"});
const advRatio=advSess.ratio,crewBefore=adv.crew;
const r1=game.applyStageChoice(adv,"hold",()=>.5);      // rng=.5 -> u=1.0
assert.equal(r1.ended,false);
assert.equal(adv.battleSession.stage,2,"打完一段进入第2段");
assert.equal(adv.battleSession.momentum,Math.round((advRatio-1)*33.3*10)/10,"势必须等于闭式解，不能只断言变了");
assert.equal(adv.crew,crewBefore,"段内不再动人手池：人在开战时就离开了，伤亡只记在 session 上");
assert.equal(adv.casualties,adv.battleSession.losses,"累计伤亡同步");
assert.ok(adv.battleSession.enemyLoss>0,"敌方也要掉人");
assert.equal(adv.battleSession.log.length,1,"每段留一条战报");
assert.equal(adv.battleSession.log[0].name,"开局");
// 第1段不能鸣金：stageOptions 不提供该选项，因此必须被拒。
// 必须另起一场没打过的战斗来验——adv 此刻已经被上面那次 hold 推进到第2段了。
const fresh=game.createInitialState("沈开局撤","yi","standard");
fresh.crew=120;
game.startBattle(fresh,{targetId:"south_dock",leaderIds:["player"],troops:60,tactic:"steady"});
assert.equal(fresh.battleSession.stage,1);
assert.throws(()=>game.applyStageChoice(fresh,"withdraw",()=>.5),/invalid option/,"第1段不得撤退");
assert.equal(fresh.crew,60,"被拒的撤退不得再额外扣人");
// 非法选项不得留下任何副作用
const stageOneStage=adv.battleSession.stage;
const crewAfterThrow=adv.crew;
assert.throws(()=>game.applyStageChoice(adv,"不存在的选项",()=>.5),/invalid option/);
assert.equal(adv.crew,crewAfterThrow,"抛错不得扣人");
assert.equal(adv.battleSession.stage,stageOneStage,"抛错不得推进段数");
// 伤亡累计封顶在出战人数：否则 finishBattle 算幸存者会得到负数，人手池会凭空膨胀。
// 自然战斗打不满这个上限（每段约扣 4% 出战人数），所以直接把 losses 顶到临界值来验。
const capLoss=game.createInitialState("沈封顶","wei","standard");
capLoss.crew=200;
game.startBattle(capLoss,{targetId:"south_dock",leaderIds:["player"],troops:60,tactic:"steady"});
capLoss.battleSession.losses=59;
game.applyStageChoice(capLoss,"hold",()=>.5);
assert.ok(capLoss.battleSession.losses<=60,`伤亡 ${capLoss.battleSession.losses} 不得超过出战的 60 人`);
// rng=0 -> u=0.705，走劣势分支，覆盖 .25 档与"对面顶住了"文案。
// 兵力必须真的处于劣势：200人打驻防46是碾压，ratio≈2.5，再差的骰子也翻不出负势。
const bad=game.createInitialState("沈劣势","yi","standard");
bad.crew=300;
const badSess=game.startBattle(bad,{targetId:"south_dock",leaderIds:["player"],troops:30,tactic:"steady"});
assert.ok(badSess.ratio<1,"这一局必须真的是劣势，否则下面的断言没有意义");
game.applyStageChoice(bad,"hold",()=>0);
assert.ok(bad.battleSession.momentum<0,"u=0.705 且 ratio<1 应打出负势");
assert.ok(bad.battleSession.log[0].text.includes("对面顶住了"),"劣势段要走另一套文案");
// 会话结束后不得再推进
const done=game.createInitialState("沈越界","yi","standard");
done.crew=120;
game.startBattle(done,{targetId:"south_dock",leaderIds:["player"],troops:60,tactic:"steady"});
done.battleSession.stage=4;
assert.throws(()=>game.applyStageChoice(done,"hold",()=>.5),/battle already finished/,"越界段不得再打");
const noFight=game.createInitialState("沈无战","yi","standard");
assert.throws(()=>game.applyStageChoice(noFight,"hold",()=>.5),/no battle in progress/);

const fin=game.createInitialState("沈结算","yi","standard");
fin.crew=200;fin.morale=95;fin.territories.south_dock.guard=8;
const fr=game.resolveBattle(fin,{targetId:"south_dock",leaderIds:["player","zhaokui","chengye"],troops:150,tactic:"assault"},()=>.99);
assert.equal(fr.won,true);
assert.equal(fr.outcome,"win");
assert.equal(fin.territories.south_dock.owner,"player");
assert.equal(fin.battleSession,null,"结算后必须清空会话");
assert.equal(fin.winStreak,1,"胜场连胜计数");
assert.equal(fr.stages.length,3,"三段战报来自真实判定");
assert.equal(fin.lastBattle,fr);

// 平衡回归：势必须真的响应兵力差。
// 注意必须用「一条连续的随机流」，不能每局 seeded(seed+k) 重开：LCG 相邻种子的首个输出只差
// 1664525/2^32≈0.0004，那样 150 局的开局骰子几乎完全相同，是格点取样而非蒙特卡洛，尾部永远取不到。
function winRate(troops,seed,n){
  let w=0;const rng=seeded(seed);
  for(let k=0;k<n;k++){
    const t=game.createInitialState("沈平衡","yi","standard");
    t.crew=400;t.morale=62;t.territories.south_dock.guard=46;
    if(game.resolveBattle(t,{targetId:"south_dock",leaderIds:["player","zhaokui","chengye"],troops,tactic:"steady"},rng).won)w++;
  }
  return w/n;
}
// 兵力只能在 ratio∈(0.772,1.418) 这段窗口里取样：战力对兵力是仿射的（头目那份常数很大），
// 34人→ratio≈0.89，56人→ratio≈1.13，倍差 1.29 才塞得进窗口。取 45/160 会直接冲出窗口两端变成必胜必败。
const WEAK_TROOPS=34,STRONG_TROOPS=56;
const weakRate=winRate(WEAK_TROOPS,11000,150),strongRate=winRate(STRONG_TROOPS,11000,150);
assert.ok(strongRate>weakRate+.3,`兵力差必须显著改变胜率：${WEAK_TROOPS}人 ${weakRate} vs ${STRONG_TROOPS}人 ${strongRate}`);
assert.ok(weakRate>0,"弱势方不应是必败死区（旧版 ratio<0.848 必败）");
assert.ok(strongRate<1,"优势方不应是必胜死区（旧版 ratio>1.191 必胜）");

s.cash=200;
const candidate=s.recruitMarket[0];
assert.ok(candidate);
assert.equal(game.hireCommon(s,candidate.id),true);
assert.equal(s.ap,2);
assert.equal(s.officers.some(o=>o.id===candidate.id&&o.side==="player"),true);

s.crew=120;
s.morale=95;
s.territories.south_dock.guard=12;
const report=game.resolveBattle(s,{
  targetId:"south_dock",
  leaderIds:["player","zhaokui","chengye"],
  troops:90,
  tactic:"assault"
},()=>.99);
assert.equal(report.won,true);
assert.equal(s.territories.south_dock.owner,"player");
assert.equal(game.ownTerritories(s).length,2);
assert.ok(s.crew<120,"battle must consume real crew");

const finalState=game.createInitialState("沈终局","wei","standard");
for(const [id,t] of Object.entries(finalState.territories)){
  if(id!=="central_harbor")t.owner="player";
}
finalState.crew=240;
finalState.morale=100;
finalState.territories.central_harbor.guard=10;
assert.deepEqual(game.attackableTerritories(finalState),["central_harbor"]);
const finalReport=game.resolveBattle(finalState,{
  targetId:"central_harbor",
  leaderIds:["player","zhaokui","sumanqing"],
  troops:180,
  tactic:"steady"
},()=>.99);
assert.equal(finalReport.won,true);
assert.equal(finalState.ended,true);
assert.equal(finalState.endingReason,"unified");

const advancing=game.createInitialState("沈经营","li","standard");
const beforeCash=advancing.cash;
game.advanceMonth(advancing,true);
assert.equal(advancing.month,1);
assert.equal(advancing.ap,3);
assert.ok(advancing.cash>beforeCash);
assert.equal(advancing.recruitMarket.length,3);

// 把一名命名头目以我方身份塞进队伍（后续任务复用）
function joinNamed(state,id){
  const d=game.CHARACTER_DEFS[id];
  state.officers=state.officers.filter(o=>o.id!==id);
  state.officers.push({id,name:d.name,side:"player",role:d.role,type:d.type,portrait:d.portrait,
    stats:{...d.stats},trait:d.trait,traitText:d.traitText,loyalty:70,resentment:0,merit:0,
    injured:0,exp:0,battles:0,wins:0,named:true});
  return state;
}
// quitAt=2 表示第2段鸣金；quitAt=0 表示打满三段
function runBattle(quitAt,extraLeader){
  const g=game.createInitialState("沈撤退","yi","standard");
  g.crew=200;g.morale=70;
  if(extraLeader)joinNamed(g,extraLeader);
  const ids=["player","zhaokui"];if(extraLeader)ids[1]=extraLeader;
  const rng=()=>.5;
  game.startBattle(g,{targetId:"south_dock",leaderIds:ids,troops:120,tactic:"steady"},rng);
  for(let stage=1;stage<=3&&g.battleSession;stage++){
    game.applyStageChoice(g,quitAt===stage?"withdraw":"hold",rng);
  }
  return g;
}
const quit=runBattle(2),full=runBattle(0);
assert.equal(quit.lastBattle.outcome,"retreat");
assert.ok(full.lastBattle,"打满三段必须结算出战报");
assert.ok(quit.lastBattle.losses<full.lastBattle.losses,"第2段鸣金的伤亡必须严格小于打满三段");
assert.notEqual(quit.territories.south_dock.owner,"player","撤退不夺地");
assert.equal(quit.morale,64,"撤退士气 70-6=64");
assert.equal(quit.battleSession,null,"撤退后必须清空会话");
assert.equal(quit.losses,0,"撤退不计入败场");
assert.equal(quit.winStreak,0,"撤退中断连胜");

// 叶蓉在阵：撤退不掉士气（经营属性首次在战场上生效）
const shielded=runBattle(2,"yerong");
assert.equal(shielded.lastBattle.outcome,"retreat");
assert.equal(shielded.morale,70,"叶蓉在阵撤退不掉士气");

// 听了赵魁「压上去」之后又收手，他会记仇
const pressedQuit=game.createInitialState("沈食言","yi","standard");
pressedQuit.crew=200;
const pq=()=>.5;
game.startBattle(pressedQuit,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:120,tactic:"steady"},pq);
game.applyStageChoice(pressedQuit,"press",pq);
const zkResentBefore=pressedQuit.officers.find(o=>o.id==="zhaokui").resentment;
game.applyStageChoice(pressedQuit,"withdraw",pq);
assert.equal(pressedQuit.officers.find(o=>o.id==="zhaokui").resentment,zkResentBefore+8,"听了赵魁又临阵收手，怨气+8");

// 全程稳住再撤退则不该记仇
const calmQuit=game.createInitialState("沈稳撤","yi","standard");
calmQuit.crew=200;
const cq=()=>.5;
game.startBattle(calmQuit,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:120,tactic:"steady"},cq);
game.applyStageChoice(calmQuit,"hold",cq);
const calmBefore=calmQuit.officers.find(o=>o.id==="zhaokui").resentment;
game.applyStageChoice(calmQuit,"withdraw",cq);
assert.equal(calmQuit.officers.find(o=>o.id==="zhaokui").resentment,calmBefore,"没喊过压上就不该记仇");

const prop=game.createInitialState("沈提议","yi","standard");
prop.crew=200;
game.startBattle(prop,{targetId:"south_dock",leaderIds:["player","sumanqing","chengye"],troops:100,tactic:"steady"});
const ps=prop.battleSession;
assert.ok(game.stageOptions(prop,ps).some(o=>o.id==="flank"),"苏曼青谋略88应给出侧翼提议");
assert.ok(!game.stageOptions(prop,ps).some(o=>o.id==="parley"),"势≤20 时不给劝降");
ps.momentum=25;
assert.ok(game.stageOptions(prop,ps).some(o=>o.id==="parley"),"势>20 才解锁劝降");
assert.ok(game.stageOptions(prop,ps).length<=5,"选项上限5");
assert.ok(game.stageOptions(prop,ps).some(o=>o.id==="hold"),"稳住必须恒在");
// 提议效果必须按属性缩放，不是固定值
const flank=game.stageOptions(prop,ps).find(o=>o.id==="flank");
assert.equal(flank.mult,1+prop.officers.find(o=>o.id==="sumanqing").stats.scheme/900,"侧翼威力按谋略缩放");
const parley=game.stageOptions(prop,ps).find(o=>o.id==="parley");
assert.equal(parley.convert,prop.officers.find(o=>o.id==="chengye").stats.charm/260,"劝降转化率按魅力缩放");
assert.equal(parley.mult,.88,"劝降要付出实打实的势，否则解锁后就是必选项");
// 魏小楼：情报未查明时提议后门，并当场写入 intel
const spy=joinNamed(game.createInitialState("沈探路","yi","standard"),"weixiaolou");
spy.crew=200;
game.startBattle(spy,{targetId:"south_dock",leaderIds:["player","weixiaolou"],troops:100,tactic:"steady"});
assert.ok(!spy.intel.south_dock,"开打前该地情报未知");
assert.ok(game.stageOptions(spy,spy.battleSession).some(o=>o.id==="backdoor"));
game.applyStageChoice(spy,"backdoor",()=>.5);
assert.equal(spy.intel.south_dock,true,"后门提议必须当场揭穿驻防");
assert.ok(spy.battleSession.log[0].text.includes("魏小楼"),"揭穿要写进战报");
assert.ok(!game.stageOptions(spy,spy.battleSession).some(o=>o.id==="backdoor"),"情报已知后不再重复提议");
// 劝降真的会把敌兵变成自己人。用 guard=70 让 enemyLoss 足够大，转化量才可观。
const talk=game.createInitialState("沈劝降","yi","standard");
talk.crew=300;talk.morale=95;talk.territories.south_dock.guard=70;
const tr=()=>.99;
game.startBattle(talk,{targetId:"south_dock",leaderIds:["player","chengye"],troops:200,tactic:"steady"},tr);
game.applyStageChoice(talk,"hold",tr);
game.applyStageChoice(talk,"hold",tr);
assert.ok(talk.battleSession.momentum>20,"这局必须打出优势，否则劝降不会出现");
assert.ok(game.stageOptions(talk,talk.battleSession).some(o=>o.id==="parley"));
const parleyRate=game.stageOptions(talk,talk.battleSession).find(o=>o.id==="parley").convert;
const crewBeforeStage3=talk.crew;
game.applyStageChoice(talk,"parley",tr);
assert.equal(talk.lastBattle.outcome,"win");
const gain=Math.round(talk.lastBattle.enemyLoss*parleyRate);
assert.ok(gain>0,"转化人数必须大于0，否则这条断言没有意义");
assert.equal(talk.crew,crewBeforeStage3+gain,"劝降转化的人直接进能战池；段内伤亡不再从池子扣");
assert.ok(talk.log.some(l=>l.text.includes("程野把")),"转化要留下江湖记事");
// 对照组：同样局势下选 hold 则不该有任何转化
const noTalk=game.createInitialState("沈不劝","yi","standard");
noTalk.crew=300;noTalk.morale=95;noTalk.territories.south_dock.guard=70;
const nr=()=>.99;
game.startBattle(noTalk,{targetId:"south_dock",leaderIds:["player","chengye"],troops:200,tactic:"steady"},nr);
game.applyStageChoice(noTalk,"hold",nr);
game.applyStageChoice(noTalk,"hold",nr);
const noCrewBefore=noTalk.crew;
game.applyStageChoice(noTalk,"hold",nr);
assert.equal(noTalk.crew,noCrewBefore,"没劝降就不该有人加入，且段内伤亡不动人手池");
// 阿七断后：成长更快
const rear=joinNamed(game.createInitialState("沈断后","yi","standard"),"aqi");
rear.crew=200;
game.startBattle(rear,{targetId:"south_dock",leaderIds:["player","aqi"],troops:100,tactic:"steady"});
game.applyStageChoice(rear,"hold",()=>.5);
const aqiExpBefore=rear.officers.find(o=>o.id==="aqi").exp;
assert.ok(game.stageOptions(rear,rear.battleSession).some(o=>o.id==="rearguard"),"第2段起阿七可断后");
game.applyStageChoice(rear,"rearguard",()=>.5);
assert.equal(rear.officers.find(o=>o.id==="aqi").exp,aqiExpBefore+3,"断后让阿七多长3点经验");

// joinNamed 在 Task 5 已定义并会先剔除同 id 的既有条目（韩彪等本来是敌方头目）
const duel=joinNamed(game.createInitialState("沈单挑","wei","standard"),"hanbiao");
duel.crew=200;
game.startBattle(duel,{targetId:"south_dock",leaderIds:["player","hanbiao"],troops:100,tactic:"assault"});
assert.ok(game.stageOptions(duel,duel.battleSession).some(o=>o.id==="duel"),"敌方有高武力头目时应给出单挑");
game.applyStageChoice(duel,"duel",()=>.01);   // rng 极小 -> 单挑必胜
assert.ok(duel.battleSession.mods.multRest>1,"单挑胜利提高后续段的势");
assert.ok(duel.battleSession.log[0].text.includes("韩彪"),"单挑要写进战报");
assert.ok(duel.officers.some(o=>o.side==="east"&&o.injured>0),"败方头目应受伤");
assert.ok(duel.officers.find(o=>o.id==="hanbiao").merit>=8,"单挑胜者记功");

// 单挑落败：自己人受伤、后续段变差、士气下降
const lost=joinNamed(game.createInitialState("沈落败","wei","standard"),"hanbiao");
lost.crew=200;lost.morale=70;
game.startBattle(lost,{targetId:"south_dock",leaderIds:["player","hanbiao"],troops:100,tactic:"assault"});
game.applyStageChoice(lost,"duel",()=>.999);  // rng 极大 -> 单挑必败
assert.ok(lost.battleSession.mods.multRest<1,"单挑落败拖累后续段");
assert.ok(lost.officers.find(o=>o.id==="hanbiao").injured>0,"落败者受伤");
assert.equal(lost.morale,65,"单挑落败士气 -5（70-5=65），再无其他士气变动");

// 韩彪不在阵时赵魁也能单挑，但没有 +0.15 加成
const noHan=game.createInitialState("沈无韩","wei","standard");
noHan.crew=200;
game.startBattle(noHan,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:100,tactic:"assault"});
assert.ok(game.stageOptions(noHan,noHan.battleSession).some(o=>o.id==="duel"),"赵魁也能发起单挑");

// 敌方全员受伤后不再提供单挑
const noFoe=joinNamed(game.createInitialState("沈无敵","wei","standard"),"hanbiao");
noFoe.crew=200;
game.startBattle(noFoe,{targetId:"south_dock",leaderIds:["player","hanbiao"],troops:100,tactic:"assault"});
noFoe.officers.filter(o=>o.side==="east").forEach(o=>{o.injured=2});
assert.ok(!game.stageOptions(noFoe,noFoe.battleSession).some(o=>o.id==="duel"),"敌方无可战头目时不给单挑");

// 单挑打伤的敌将必须会痊愈，否则战后收编那条线会被永久掐断
const healFoe=joinNamed(game.createInitialState("沈愈合","wei","standard"),"hanbiao");
healFoe.crew=400;
game.startBattle(healFoe,{targetId:"south_dock",leaderIds:["player","hanbiao"],troops:200,tactic:"assault"});
game.applyStageChoice(healFoe,"duel",()=>.01);
const hurtFoe=healFoe.officers.find(o=>o.side==="east"&&o.injured>0);
assert.ok(hurtFoe,"单挑胜利应打伤一名敌将");
healFoe.battleSession=null;
for(let i=0;i<4;i++)game.advanceMonth(healFoe,true);
assert.equal(healFoe.officers.find(o=>o.id===hurtFoe.id).injured,0,"敌将伤病必须随月份愈合");
// 单挑一场只能打一次，否则 multRest 会叠到 1.56
const once=joinNamed(game.createInitialState("沈一次","wei","standard"),"hanbiao");
once.crew=400;
game.startBattle(once,{targetId:"south_dock",leaderIds:["player","hanbiao"],troops:200,tactic:"assault"});
game.applyStageChoice(once,"duel",()=>.01);
assert.equal(once.battleSession.mods.dueled,true);
assert.equal(once.battleSession.mods.multRest,1.25);
assert.ok(!game.stageOptions(once,once.battleSession).some(o=>o.id==="duel"),"一场血拼只能单挑一次");
// 单挑发生在第1段时，multRest 只作用于后续段，不该抬高本段
const timing=joinNamed(game.createInitialState("沈时序","wei","standard"),"hanbiao");
timing.crew=400;
const tSess=game.startBattle(timing,{targetId:"south_dock",leaderIds:["player","hanbiao"],troops:200,tactic:"assault"});
const tRatio=tSess.ratio;
game.applyStageChoice(timing,"duel",()=>.01);
assert.equal(timing.battleSession.momentum,Math.round((tRatio*(1-.295+.01*.59)*1*1-1)*33.3*10)/10,"本段的势必须按 multRest=1 结算");
// 阿七断后会提高他自己的受伤概率
const risky=joinNamed(game.createInitialState("沈断后险","yi","standard"),"aqi");
risky.crew=200;
game.startBattle(risky,{targetId:"south_dock",leaderIds:["player","aqi"],troops:100,tactic:"steady"});
game.applyStageChoice(risky,"hold",()=>.5);
game.applyStageChoice(risky,"rearguard",()=>.5);
assert.equal(risky.battleSession.mods.aqiRisk,true,"断后要记下加成风险");

// 单挑当场打伤的自己人必须出现在战报的伤员名单里，且不重复。
// startBattle 会把已受伤的头目剔出阵容，所以结算时 injured>0 的必然是本场负伤的。
const rep=joinNamed(game.createInitialState("沈伤报","wei","standard"),"hanbiao");
rep.crew=400;
game.startBattle(rep,{targetId:"south_dock",leaderIds:["player","hanbiao"],troops:200,tactic:"assault"});
game.applyStageChoice(rep,"duel",()=>.999);   // 必败 -> 韩彪当场受伤
assert.ok(rep.officers.find(o=>o.id==="hanbiao").injured>0,"落败者应当场受伤");
game.applyStageChoice(rep,"hold",()=>.5);
game.applyStageChoice(rep,"hold",()=>.5);
assert.deepEqual(rep.lastBattle.injured,["韩彪"],"单挑负伤的头目要进战报，且只出现一次");

// 沈川「沈家之后」：士气下限45，低士气时伤亡不再随士气恶化。
// 用同一套阵容与同一 rng，只切 mods.moraleFloor，才能把变量隔离干净。
function floorLoss(floorOn){
  const a=game.createInitialState("沈低迷","yi","standard");
  a.crew=900;a.morale=10;
  game.startBattle(a,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:800,tactic:"steady"});
  if(!floorOn)a.battleSession.mods.moraleFloor=0;
  game.applyStageChoice(a,"hold",()=>.5);
  return a.battleSession.losses;
}
assert.equal(floorLoss(true),24,"士气10但有沈川：按士气45计伤亡");
assert.equal(floorLoss(false),29,"同局无下限：按士气10计伤亡，明显更惨");
// 士气高于下限时该被动不应有任何影响
function floorAt(morale){
  const a=game.createInitialState("沈高昂","yi","standard");
  a.crew=900;a.morale=morale;
  game.startBattle(a,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:800,tactic:"steady"});
  const withFloor=a.battleSession.mods.moraleFloor;
  a.battleSession.mods.moraleFloor=0;
  game.applyStageChoice(a,"hold",()=>.5);
  const off=a.battleSession.losses;
  const b=game.createInitialState("沈高昂2","yi","standard");
  b.crew=900;b.morale=morale;
  game.startBattle(b,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:800,tactic:"steady"});
  game.applyStageChoice(b,"hold",()=>.5);
  return[b.battleSession.losses,off,withFloor];
}
const[onHi,offHi]=floorAt(62);
assert.equal(onHi,offHi,"士气62高于下限45，沈川被动不该改变任何结果");

// 唐霁「唯能者居」：胜利时全员功劳 ×1.5
const merit=joinNamed(game.createInitialState("沈唯能","yi","standard"),"tangji");
merit.crew=250;merit.morale=95;merit.territories.south_dock.guard=6;
game.resolveBattle(merit,{targetId:"south_dock",leaderIds:["player","tangji"],troops:200,tactic:"assault"},()=>.99);
assert.equal(merit.lastBattle.won,true);
assert.equal(merit.officers.find(o=>o.id==="player").merit,8,"唐霁在阵：胜利功劳 round(5×1.5)=8");
// 对照组：没有唐霁则是基础 5
const noMerit=game.createInitialState("沈无唐","yi","standard");
noMerit.crew=250;noMerit.morale=95;noMerit.territories.south_dock.guard=6;
game.resolveBattle(noMerit,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:200,tactic:"assault"},()=>.99);
assert.equal(noMerit.lastBattle.won,true);
assert.equal(noMerit.officers.find(o=>o.id==="player").merit,5,"没有唐霁就是基础功劳5");

// 谢九「只服胜者」：败北忠诚共 -8（通用 -2 再叠 -6）
const xie=joinNamed(game.createInitialState("沈只服","yi","standard"),"xiejiu");
xie.crew=60;xie.morale=20;xie.territories.south_dock.guard=78;
game.resolveBattle(xie,{targetId:"south_dock",leaderIds:["xiejiu"],troops:20,tactic:"steady"},()=>.01);
assert.equal(xie.lastBattle.won,false,"这局必须打输，否则断言没有意义");
assert.equal(xie.officers.find(o=>o.id==="xiejiu").loyalty,62,"70 -2(通用) -6(谢九) = 62");
assert.equal(xie.winStreak,0);
// 对照组：赵魁同样打输只掉 2
const zk=game.createInitialState("沈赵败","yi","standard");
zk.crew=60;zk.morale=20;zk.territories.south_dock.guard=78;
const zkBefore=zk.officers.find(o=>o.id==="zhaokui").loyalty;
game.resolveBattle(zk,{targetId:"south_dock",leaderIds:["zhaokui"],troops:20,tactic:"steady"},()=>.01);
assert.equal(zk.lastBattle.won,false);
assert.equal(zk.officers.find(o=>o.id==="zhaokui").loyalty,zkBefore-2,"普通头目败北只掉2");
// 谢九连胜加成：winStreak>=2 时 multRest 起步就是 1.05
const streak=joinNamed(game.createInitialState("沈连胜","yi","standard"),"xiejiu");
streak.crew=200;streak.winStreak=2;
const streakSess=game.startBattle(streak,{targetId:"south_dock",leaderIds:["player","xiejiu"],troops:100,tactic:"steady"});
assert.equal(streakSess.mods.multRest,1.05,"连胜2场后谢九给全程 ×1.05");
const noStreak=joinNamed(game.createInitialState("沈无连胜","yi","standard"),"xiejiu");
noStreak.crew=200;noStreak.winStreak=1;
assert.equal(game.startBattle(noStreak,{targetId:"south_dock",leaderIds:["player","xiejiu"],troops:100,tactic:"steady"}).mods.multRest,1,"连胜不足2场则无加成");

// 旧档缺字段应补默认值，且不得因此被判废
const mig=game.createInitialState("沈迁移","yi","standard");
delete mig.battleSession;delete mig.winStreak;
assert.equal(game.normalizeState(mig).battleSession,null,"旧档缺 battleSession 应补 null");
assert.equal(mig.winStreak,0,"旧档缺 winStreak 应补 0");
// 损坏的会话必须丢弃
function corrupt(mutate){
  const c=game.createInitialState("沈坏档","yi","standard");
  c.crew=120;
  game.startBattle(c,{targetId:"south_dock",leaderIds:["player"],troops:60,tactic:"steady"});
  mutate(c);
  return game.normalizeState(c);
}
assert.equal(corrupt(c=>{c.battleSession.stage=9}).battleSession,null,"stage 越界要丢弃");
assert.equal(corrupt(c=>{c.battleSession.stage=0}).battleSession,null,"stage 为0要丢弃");
assert.equal(corrupt(c=>{c.battleSession.targetId="不存在的地盘"}).battleSession,null,"目标地盘不存在要丢弃");
assert.equal(corrupt(c=>{c.battleSession.leaderIds=[]}).battleSession,null,"没有可用头目要丢弃");
assert.equal(corrupt(c=>{c.battleSession.leaderIds=["hewanshan"]}).battleSession,null,"阵容全是敌方头目要丢弃");
assert.equal(corrupt(c=>{c.battleSession.momentum="很多"}).battleSession,null,"势不是数字要丢弃");
assert.equal(corrupt(c=>{c.battleSession.troops=NaN}).battleSession,null,"兵力是NaN要丢弃");
assert.equal(corrupt(c=>{delete c.battleSession.mods}).battleSession,null,"缺 mods 要丢弃");
assert.equal(corrupt(c=>{delete c.battleSession.log}).battleSession,null,"缺 log 要丢弃");
// 丢弃时要给玩家留一条记事
const dropped=corrupt(c=>{c.battleSession.stage=9});
assert.ok(dropped.log.some(l=>l.text.includes("中断")),"丢弃会话要写进江湖录");
// 完好会话经 JSON 往返后必须保留并可继续
const ok=game.createInitialState("沈好档","yi","standard");
ok.crew=120;
game.startBattle(ok,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:60,tactic:"steady"});
const roundTrip=game.normalizeState(JSON.parse(JSON.stringify(ok)));
assert.ok(roundTrip.battleSession,"完好会话必须保留");
assert.equal(roundTrip.battleSession.stage,1);
assert.deepEqual(game.stageOptions(roundTrip,roundTrip.battleSession),game.stageOptions(ok,ok.battleSession),"往返后重建的选项必须一致");
assert.equal(game.applyStageChoice(roundTrip,"hold",()=>.5).ended,false,"往返后必须能继续推进");

// 终局之战也要有单挑：中央港区挂在港城同盟名下而同盟没有头目，
// 需由已被打散的三家龙头压最后一阵，否则最该有单挑的一战反而没有。
const lastStand=game.createInitialState("沈终战","wei","standard");
for(const id of Object.keys(lastStand.territories))if(id!=="central_harbor")lastStand.territories[id].owner="player";
lastStand.crew=500;
["hewanshan","fangjingyao","guchangfeng"].forEach(id=>{lastStand.officers.find(o=>o.id===id).side="defeated"});
assert.equal(lastStand.territories.central_harbor.owner,"coalition");
assert.equal(lastStand.officers.filter(o=>o.side==="coalition").length,0,"同盟名下确实没有头目");
game.startBattle(lastStand,{targetId:"central_harbor",leaderIds:["player","zhaokui"],troops:300,tactic:"assault"});
assert.ok(game.stageOptions(lastStand,lastStand.battleSession).some(o=>o.id==="duel"),"终局之战必须能单挑");
game.applyStageChoice(lastStand,"duel",()=>.01);
assert.ok(lastStand.officers.some(o=>o.side==="defeated"&&o.injured>0),"被打散的龙头出来压阵并被打伤");
// 普通地盘不该借用已被打散的龙头当守将
const normal=game.createInitialState("沈常规","wei","standard");
normal.crew=300;
normal.officers.filter(o=>o.side==="east").forEach(o=>{o.injured=2});
["hewanshan","fangjingyao","guchangfeng"].forEach(id=>{const o=normal.officers.find(x=>x.id===id);if(o&&o.side!=="east")o.side="defeated"});
game.startBattle(normal,{targetId:"south_dock",leaderIds:["player","zhaokui"],troops:200,tactic:"assault"});
assert.ok(!game.stageOptions(normal,normal.battleSession).some(o=>o.id==="duel"),"非同盟地盘守将全伤时不得借调他人");

// 劝降拿下的地盘不服管：稳定度比强攻拿下低 10
function parleyStability(useParley){
  const s=game.createInitialState("沈收编","yi","standard");
  s.crew=400;s.morale=95;s.territories.south_dock.guard=70;
  const rng=()=>.99;
  game.startBattle(s,{targetId:"south_dock",leaderIds:["player","chengye"],troops:200,tactic:"steady"},rng);
  game.applyStageChoice(s,"hold",rng);game.applyStageChoice(s,"hold",rng);
  game.applyStageChoice(s,useParley?"parley":"hold",rng);
  assert.equal(s.lastBattle.won,true);
  return s.territories.south_dock.stability;
}
assert.equal(parleyStability(false),62,"强攻拿下：义字当头的基础稳定度 62");
assert.equal(parleyStability(true),52,"劝降拿下：收编来的人压不住街面，稳定度 -10");

// ---- 战后人手分流 ----
// 出战的人在 startBattle 离池，finishBattle 必须把他们分成幸存(整补)/重伤(养伤)/阵亡(消失)三份。
const settle=game.createInitialState("沈结算","yi","standard");
settle.crew=120;
game.resolveBattle(settle,{targetId:"south_dock",leaderIds:["player"],troops:60,tactic:"steady"},seeded(7));
const settleRep=settle.lastBattle;
const settleWounded=Math.round(settleRep.losses*.55);
assert.ok(settleRep.losses>0,"这场仗必须真的死人，否则断言无意义");
assert.equal(settle.crew,60,"出战的60人不得直接回到能战池");
assert.equal(settle.regroup,60-settleRep.losses,"幸存者全部进整补");
assert.equal(settle.wounded,settleWounded,"伤亡的55%进养伤");
assert.equal(game.totalCrew(settle),120-(settleRep.losses-settleWounded),"总人手只少了阵亡的那部分");

// 撤退与战败走同一条分流路径，不能只在胜利分支里结算。
const settleRetreat=game.createInitialState("沈撤退结算","yi","standard");
settleRetreat.crew=120;
game.startBattle(settleRetreat,{targetId:"south_dock",leaderIds:["player","sumanqing"],troops:60,tactic:"steady"});
game.applyStageChoice(settleRetreat,"hold",seeded(11));
game.applyStageChoice(settleRetreat,"withdraw",seeded(11));
assert.equal(settleRetreat.battleSession,null,"撤退后会话必须结束");
assert.equal(settleRetreat.regroup+settleRetreat.wounded>0,true,"撤退回来的人也要进整补/养伤，不能凭空消失");
assert.equal(settleRetreat.crew,60,"撤退不把人直接还回能战池");

// ---- 每月回流 ----
const rec=game.createInitialState("沈回流","yi","standard");
rec.crew=0;rec.regroup=48;rec.wounded=10;rec.cash=100;
const recOut=game.recoverCrew(rec);
assert.equal(recOut.back,24,"整补每月回一半：ceil(48*0.5)");
assert.equal(rec.regroup,24);
assert.equal(recOut.healed,3,"养伤每月回 ceil(10*0.22)=3");
assert.equal(recOut.cost,4,"医药费 = 伤员数 * 0.4");
assert.equal(rec.cash,96,"医药费从现金里扣");
assert.equal(rec.wounded,7);
assert.equal(rec.crew,27,"24 整补归队 + 3 伤愈");

// 付不出药钱：回归减半、掉士气、且不扣钱（钱本来就不够）
const broke=game.createInitialState("沈没钱养伤","yi","standard");
broke.crew=0;broke.regroup=0;broke.wounded=10;broke.cash=1;
const brokeMorale=broke.morale;
const brokeOut=game.recoverCrew(broke);
assert.equal(brokeOut.broke,true);
assert.equal(brokeOut.healed,1,"付不起时回归减半：floor(3/2)");
assert.equal(brokeOut.cost,0,"付不起就不扣钱");
assert.equal(broke.cash,1);
assert.equal(broke.morale,brokeMorale-4);

// 尾数：整补只剩 3 人时，不能因为"至少回 5 人"而回出负数
const tail=game.createInitialState("沈收尾","yi","standard");
tail.crew=0;tail.regroup=3;tail.wounded=0;
assert.equal(game.recoverCrew(tail).back,3,"整补余数不足5人时一次归队完毕");
assert.equal(tail.regroup,0);
assert.equal(tail.crew,3);

// 空池不得产生任何副作用
const idle=game.createInitialState("沈无伤","yi","standard");
const idleCash=idle.cash,idleCrew=idle.crew;
const idleOut=game.recoverCrew(idle);
assert.deepEqual([idleOut.back,idleOut.healed,idleOut.cost],[0,0,0]);
assert.equal(idle.cash,idleCash);
assert.equal(idle.crew,idleCrew);

// 推进月份必须触发回流
const flow=game.createInitialState("沈过月","yi","standard");
flow.regroup=20;flow.ap=0;
game.advanceMonth(flow,true);
assert.ok(flow.regroup<20,"advanceMonth 必须调用 recoverCrew");

// ---- 人手上限与维护费 ----
const capped=game.createInitialState("沈满员","yi","standard");
capped.cash=100;capped.crew=60;
assert.equal(game.crewCap(capped),60);
assert.equal(game.applyAction(capped,"recruit_crew"),false,"到上限就招不动了");
assert.equal(capped.crew,60,"被拒的招募不得改变人手");
assert.equal(capped.ap,3,"被拒的行动不得扣行动点");

const nearCap=game.createInitialState("沈快满","yi","standard");
nearCap.cash=100;nearCap.crew=55;
game.applyAction(nearCap,"recruit_crew");
assert.equal(game.totalCrew(nearCap),60,"招人不得越过上限");

// 整补和养伤的人也占上限：否则打完仗立刻能招满，池子形同虚设
const capCounts=game.createInitialState("沈占额","yi","standard");
capCounts.cash=100;capCounts.crew=10;capCounts.regroup=30;capCounts.wounded=20;
assert.equal(game.applyAction(capCounts,"recruit_crew"),false,"整补/养伤的人同样占用人手上限");

// 养伤的人也要吃饭
const up=game.createInitialState("沈养伤开销","yi","standard");
const upBase=game.monthlyUpkeep(up);
up.crew=22;up.regroup=10;up.wounded=10;
assert.equal(game.monthlyUpkeep(up),upBase,"维护费按总人手算，养伤的人不免费");

// ---- 血拼消耗行动点 ----
// 这是"5分钟通关"的根因之一：过去发起进攻零成本，一个月可以打无限场。
const apCost=game.createInitialState("沈行动点","yi","standard");
apCost.crew=200;
game.startBattle(apCost,{targetId:"south_dock",leaderIds:["player"],troops:60,tactic:"steady"});
assert.equal(apCost.ap,2,"开战消耗1个行动点");
while(apCost.battleSession)game.applyStageChoice(apCost,"hold",seeded(3));

const apBroke=game.createInitialState("沈没点数","yi","standard");
apBroke.crew=200;apBroke.ap=0;
assert.throws(()=>game.startBattle(apBroke,{targetId:"south_dock",leaderIds:["player"],troops:60,tactic:"steady"}),/no action point/);
assert.equal(apBroke.crew,200,"被拒的开战不得扣人手");

// 错误优先级：人手不足要先于行动点不足报出来，界面提示才对得上
const apOrder=game.createInitialState("沈两缺","yi","standard");
apOrder.crew=9;apOrder.ap=0;
assert.throws(()=>game.startBattle(apOrder,{targetId:"south_dock",leaderIds:["player"],troops:9,tactic:"steady"}),/not enough crew/);

console.log("structure and core-loop tests passed");
