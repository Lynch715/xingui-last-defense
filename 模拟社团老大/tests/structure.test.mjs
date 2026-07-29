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
