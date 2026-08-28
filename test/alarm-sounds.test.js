import test from 'node:test';
import assert from 'node:assert/strict';
import {ALARM_SOUNDS,alarmSound,alarmSoundOptions,playAlarmSound} from '../alarm-sounds.js';

test('alarm library provides a sizeable unique offline selection',()=>{
  assert.ok(ALARM_SOUNDS.length>=10);
  assert.equal(new Set(ALARM_SOUNDS.map(sound=>sound.id)).size,ALARM_SOUNDS.length);
  assert.ok(ALARM_SOUNDS.every(sound=>sound.name&&sound.description&&sound.notes.length>=2));
  assert.equal(alarmSound('not-real'),ALARM_SOUNDS[0]);
  assert.equal((alarmSoundOptions('calm').match(/ selected/g)||[]).length,1);
});

test('alarm player schedules and fades every synthesized note',()=>{
  const events=[],parameter=()=>({setValueAtTime:(...args)=>events.push(['set',...args]),exponentialRampToValueAtTime:(...args)=>events.push(['ramp',...args])});
  const context={currentTime:5,destination:{},createOscillator:()=>({frequency:parameter(),connect(){return this},start:t=>events.push(['start',t]),stop:t=>events.push(['stop',t])}),createGain:()=>({gain:parameter(),connect(){return this}})};
  const duration=playAlarmSound(context,'sunrise',.7);
  assert.ok(duration>0);assert.equal(events.filter(([kind])=>kind==='start').length,alarmSound('sunrise').notes.length);
  assert.equal(events.filter(([kind])=>kind==='stop').length,alarmSound('sunrise').notes.length);
});
