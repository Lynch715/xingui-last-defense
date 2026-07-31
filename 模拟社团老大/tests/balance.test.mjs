// 平衡回归测试：用固定种子的策略机器人跑完整局，锁住难度曲线。
// 这里断言的是"通关有多难"，不是"代码对不对"——数值一旦被改松，这个文件会先叫。
import assert from "node:assert/strict";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const game=require("../app.js");

function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}

// 莽夫：行动点优先招人合练，剩下的全砸进强攻，只要评估到"优势"就打。
// 它代表玩家能采取的最激进的推进速度——通关月份的下界由它给出。
function runRush(seed,difficulty){
  const rng=seeded(seed),s=game.createInitialState("莽夫","wei",difficulty);
  let idleMonths=0;                                                  // 有行动点却打不了的月份：兵力闸门是否真的咬住了
  for(let guard=0;guard<600&&!s.ended&&game.ownTerritories(s).length<8;guard++){
    // 留 1 点给开战，其余换成人手和训练
    while(s.ap>1&&(game.applyAction(s,"recruit_crew")||game.applyAction(s,"train")||game.applyAction(s,"business")));
    let fought=false;
    if(s.ap>=1&&s.crew>=10){
      const leaders=s.officers.filter(o=>o.side==="player"&&!o.injured)
        .sort((a,b)=>(b.stats.force+b.stats.command)-(a.stats.force+a.stats.command)).slice(0,3).map(o=>o.id);
      const troops=Math.max(10,Math.round(s.crew*.9));
      let best=null;
      for(const id of game.attackableTerritories(s)){
        const est=game.estimateBattle(s,id,leaders,troops,"assault");
        if(est.ratio>=1.28&&(!best||est.ratio>best.ratio))best={id,ratio:est.ratio};
      }
      if(best){
        game.startBattle(s,{targetId:best.id,leaderIds:leaders,troops,tactic:"assault"},rng);
        while(s.battleSession)game.applyStageChoice(s,"press",rng);
        fought=true;
      }
    }
    if(!fought&&s.ap>=1)idleMonths++;
    if(game.ownTerritories(s).length>=8)break;
    if(!game.advanceMonth(s,true))break;
  }
  return{months:s.month,owned:game.ownTerritories(s).length,unified:game.ownTerritories(s).length===8,
    ended:s.ended,reason:s.endingReason,idleMonths,poolsOk:s.crew>=0&&s.regroup>=0&&s.wounded>=0};
}

const RUNS=20;
const rush=[];
for(let i=0;i<RUNS;i++)rush.push(runRush(20260731+i*7919,"standard"));
const unified=rush.filter(r=>r.unified);
const fastest=Math.min(...rush.map(r=>r.unified?r.months:Infinity));
const median=a=>a.length?a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]:null;
const avgIdle=Math.round(rush.reduce((n,r)=>n+r.idleMonths,0)/RUNS*10)/10;

console.log(`莽夫·标准：${unified.length}/${RUNS} 局一统，最快 ${Number.isFinite(fastest)?fastest:"—"} 月，中位数 ${median(unified.map(r=>r.months))??"—"} 月，平均 ${avgIdle} 个月因兵力不足打不了`);

// Part 1 的护栏，只断言本 Part 真正保证的东西：
// 地图 8 块地，玩家开局已有老街，因此一统需要 7 场仗（6 块敌方地盘 + 中央港区）。
// 血拼每场 1 行动点、每月 3 点，且出战会掏空能战人手 ⇒ 每月至多一场 ⇒ 最快第 6 月。
// 这条断言精确锁死"血拼不消耗行动点"这个根因：一旦成本被去掉，机器人会退回第 0～2 月通关。
// 更严的阈值（中位数≥30、通关率<60%）要等 Part 2 的敌方数值与 AI 落地后，在 Part 3 补齐。
assert.ok(!Number.isFinite(fastest)||fastest>=6,`最快通关 ${fastest} 月，行动点闸门没有生效（7场仗×每月至多1场 ⇒ 至少 6 月）`);

// 已知的 Part 1 局限，记录在案而不是假装不存在：
// 上面打印的"因兵力不足打不了"当前是 0 —— 兵力状态机装好了，但敌方驻防还是旧数值（24~82），
// 机器人用半支队伍也能打出"优势"，所以闸门一次都没咬住。让它真正咬住是 Part 2 的事
// （驻防上调约 50% + 敌方随地盘成长）。Part 3 校准时应把这个数字断言成 > 0。
assert.ok(rush.every(r=>r.months<=200),"机器人不得死循环");

// 人手守恒：三个池子都不得为负。
for(const r of rush)assert.ok(r.poolsOk,`第 ${r.months} 月出现负数人手池`);

console.log("balance tests passed");
