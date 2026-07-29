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
assert.equal(bs.crew,120,"startBattle 本身不扣人");
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
assert.equal(crewBefore-adv.crew,adv.battleSession.losses,"扣的人必须与记录的伤亡完全相等");
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
assert.equal(fresh.crew,120,"被拒的撤退不得扣人");
// 非法选项不得留下任何副作用
const stageOneStage=adv.battleSession.stage;
const crewAfterThrow=adv.crew;
assert.throws(()=>game.applyStageChoice(adv,"不存在的选项",()=>.5),/invalid option/);
assert.equal(adv.crew,crewAfterThrow,"抛错不得扣人");
assert.equal(adv.battleSession.stage,stageOneStage,"抛错不得推进段数");
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
assert.equal(parley.convert,prop.officers.find(o=>o.id==="chengye").stats.charm/200,"劝降转化率按魅力缩放");
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
// 劝降真的会把敌兵变成自己人
const talk=game.createInitialState("沈劝降","yi","standard");
talk.crew=300;talk.morale=95;talk.territories.south_dock.guard=8;
const tr=()=>.99;
game.startBattle(talk,{targetId:"south_dock",leaderIds:["player","chengye"],troops:200,tactic:"steady"},tr);
game.applyStageChoice(talk,"hold",tr);
game.applyStageChoice(talk,"hold",tr);
assert.ok(talk.battleSession.momentum>20,"这局必须打出优势，否则劝降不会出现");
assert.ok(game.stageOptions(talk,talk.battleSession).some(o=>o.id==="parley"));
const crewBeforeParley=talk.crew;
game.applyStageChoice(talk,"parley",tr);
assert.equal(talk.lastBattle.outcome,"win");
assert.ok(talk.crew>crewBeforeParley-talk.lastBattle.losses,"劝降胜利后应有敌兵加入，抵消部分伤亡");
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

console.log("structure and core-loop tests passed");
