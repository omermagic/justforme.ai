'use strict';

window.PalavraDailyStreak=(()=>{
  const REQUIRED_SECONDS=180;
  const EARLY_MILESTONES=Object.freeze([5,10,20,40,80]);

  function dayKey(date){
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function isComplete(hist,key){
    return Math.max(0,Number(hist?.[key]?.studySeconds)||0)>=REQUIRED_SECONDS;
  }

  function isMilestone(days){
    const count=Math.max(0,Math.floor(Number(days)||0));
    return EARLY_MILESTONES.includes(count)||(count>=100&&count%100===0);
  }

  function nextMilestone(days){
    const count=Math.max(0,Math.floor(Number(days)||0));
    const early=EARLY_MILESTONES.find(milestone=>milestone>count);
    if(early)return early;
    return Math.max(100,(Math.floor(count/100)+1)*100);
  }

  function calculate(hist={},now=Date.now()){
    const today=new Date(now);
    today.setHours(12,0,0,0);
    const completedToday=isComplete(hist,dayKey(today));
    const cursor=new Date(today);
    if(!completedToday)cursor.setDate(cursor.getDate()-1);

    let days=0;
    const maximumDays=Math.max(1,Object.keys(hist||{}).length+1);
    while(days<maximumDays&&isComplete(hist,dayKey(cursor))){
      days++;
      cursor.setDate(cursor.getDate()-1);
    }

    const next=nextMilestone(days);
    return Object.freeze({days,completedToday,nextMilestone:next,daysToNext:Math.max(0,next-days)});
  }

  return Object.freeze({REQUIRED_SECONDS,EARLY_MILESTONES,dayKey,isComplete,isMilestone,nextMilestone,calculate});
})();
