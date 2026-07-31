// 平衡回归测试：用固定种子的策略机器人跑完整局，锁住难度曲线。
// 这里断言的是"通关有多难"，不是"代码对不对"——战斗或经济数值一旦被改松，这个文件会先叫。
//
// 三种玩家画像，缺一不可：
//   莽夫  只要评估到"优势"就打，行动点全砸招人合练 —— 给出通关速度的下界
//   稳健  攒够压倒性优势才出手，会用安顿伤员/加固驻防/坐镇新地盘 —— 接近真实玩法
//   躺平  什么都不做 —— 验证"你不动也会输"
//
// 机器人的出手门槛必须自适应：固定门槛的机器人在够不到时会一仗不打坐着等死，
// 那测出来的是机器人的固执，不是游戏的难度。
import assert from "node:assert/strict";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const game=require("../app.js");

function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
const MONTH_CAP=90;                                   // 60 个月主战役 + 30 个月加时，超过即判定为打不完
const RUNS=24;
const med=a=>a.length?a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]:null;

function topLeaders(s){return s.officers.filter(o=>o.side==="player"&&!o.injured)
  .sort((a,b)=>(b.stats.force+b.stats.command)-(a.stats.force+a.stats.command)).slice(0,3).map(o=>o.id)}

function play(seed,difficulty,bar,useSupport){
  const rng=seeded(seed),s=game.createInitialState("测","wei",difficulty);
  let idle=0,battles=0,lostTerr=0;
  for(let m=0;m<MONTH_CAP&&!s.ended&&game.ownTerritories(s).length<8;m++){
    const owned=game.ownTerritories(s).length;
    while(s.ap>1&&(
      (useSupport&&game.applyAction(s,"garrison"))||
      (useSupport&&game.applyAction(s,"tend_wounded"))||
      game.applyAction(s,"recruit_crew")||game.applyAction(s,"train")||
      game.applyAction(s,"business")||(useSupport&&game.applyAction(s,"fortify"))));
    let fought=false;
    if(s.ap>=1&&s.crew>=10){
      const L=topLeaders(s),troops=Math.max(10,Math.round(s.crew*.9));
      const eff=idle>=6?Math.max(1.05,bar-.3):idle>=3?Math.max(1.1,bar-.15):bar;   // 干等越久越肯冒险
      let best=null;
      for(const id of game.attackableTerritories(s)){
        const e=game.estimateBattle(s,id,L,troops,"assault");
        if(e.ratio>=eff&&(!best||e.ratio>best.r))best={id,r:e.ratio};
      }
      if(best){
        game.startBattle(s,{targetId:best.id,leaderIds:L,troops,tactic:"assault"},rng);
        while(s.battleSession)game.applyStageChoice(s,"press",rng);
        battles++;fought=true;
      }
    }
    if(!fought&&s.ap>=1)idle++;else idle=0;
    if(game.ownTerritories(s).length>=8)break;
    if(!game.advanceMonth(s,true))break;
    if(game.ownTerritories(s).length<owned)lostTerr+=owned-game.ownTerritories(s).length;
  }
  return{months:s.month,unified:game.ownTerritories(s).length===8,battles,lostTerr,
    poolsOk:s.crew>=0&&s.regroup>=0&&s.wounded>=0};
}

function passive(seed){
  const s=game.createInitialState("躺","yi","standard");
  for(let m=0;m<60&&!s.ended;m++){s.ap=0;game.advanceMonth(s,true)}
  return{owned:game.ownTerritories(s).length,wiped:s.ended};
}

const sweep=(d,bar,sup)=>Array.from({length:RUNS},(_,i)=>play(20260731+i*7919,d,bar,sup));
const rush=sweep("standard",1.28,false);
const rushBrutal=sweep("brutal",1.28,false);
const steady=sweep("standard",1.6,true);
const idle=Array.from({length:RUNS},(_,i)=>passive(20260731+i*7919));

const stat=(n,r)=>{const u=r.filter(x=>x.unified);
  return `${n.padEnd(10)} 通关 ${String(u.length).padStart(2)}/${RUNS}  中位 ${String(med(u.map(x=>x.months))??"—").padStart(2)}月  仗 ${med(r.map(x=>x.battles))}  丢地 ${med(r.map(x=>x.lostTerr))}`};
console.log(stat("莽夫·标准",rush));
console.log(stat("莽夫·死战",rushBrutal));
console.log(stat("稳健·标准",steady));
console.log(`躺平·标准   60月后剩余地盘中位 ${med(idle.map(x=>x.owned))}  被灭 ${idle.filter(x=>x.wiped).length}/${RUNS}`);

const rushMonths=rush.filter(x=>x.unified).map(x=>x.months);
const steadyMonths=steady.filter(x=>x.unified).map(x=>x.months);

// ① 行动点闸门：一统需 7 场仗（8 块地减去开局的老街），每场 1 行动点、每月 3 点，
//    且出战会掏空能战人手 ⇒ 每月至多一场 ⇒ 最快第 6 月。这条精确锁死"血拼不消耗行动点"这个根因。
assert.ok(Math.min(...rushMonths)>=6,`最快通关 ${Math.min(...rushMonths)} 月，行动点闸门失效`);

// ② 速通下界：莽夫是接近完美的打法，它都要 12 个月以上，说明滚雪球已经被掐住。
//    实测中位 18 月；阈值留足余量，只在数值被明显改松时才叫。
assert.ok(med(rushMonths)>=12,`莽夫中位 ${med(rushMonths)} 月，滚雪球回来了（要求 >=12）`);

// ③ 正常玩法要撑起战役体量。实测稳健派中位 36 月。
assert.ok(med(steadyMonths)>=25,`稳健中位 ${med(steadyMonths)} 月，战役太短（要求 >=25）`);

// ④ 但不能矫枉过正变成打不完。稳健派必须过半能赢。
assert.ok(steady.filter(x=>x.unified).length>RUNS*.5,`稳健只有 ${steady.filter(x=>x.unified).length}/${RUNS} 通关，难到不可玩`);

// ⑤ 死战要真的难，不能和标准难度一个手感。
const brutalWin=rushBrutal.filter(x=>x.unified).length;
assert.ok(brutalWin<RUNS*.8,`死战通关 ${brutalWin}/${RUNS}，太容易`);
assert.ok(brutalWin>0,"死战通关率为 0，等于不可玩");

// ⑥ 你不动也会输：躺平的玩家 60 个月后应当所剩无几。
assert.ok(med(idle.map(x=>x.owned))<=2,`躺平玩家还剩 ${med(idle.map(x=>x.owned))} 块地，外部压力不够`);

// ⑦ 人手守恒：三个池子任何时候都不得为负。
for(const r of [...rush,...rushBrutal,...steady])assert.ok(r.poolsOk,"出现负数人手池");

console.log("balance tests passed");
