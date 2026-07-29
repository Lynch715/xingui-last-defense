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

console.log("structure and core-loop tests passed");
