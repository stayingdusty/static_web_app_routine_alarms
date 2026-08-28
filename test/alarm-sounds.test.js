import test from 'node:test';
import assert from 'node:assert/strict';
import {ALARM_REPEAT_DELAY_SECONDS,ALARM_SOUNDS,alarmSound,alarmSoundOptions,playAlarmSound,repeatAlarmSound,stopAlarmSound} from '../alarm-sounds.js';

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

test('alarm playback can be stopped immediately when changing phases',()=>{
  let stopped=0,disconnected=0;
  const parameter={setValueAtTime(){},exponentialRampToValueAtTime(){}},context={currentTime:0,destination:{},createOscillator:()=>({frequency:parameter,connect(){return this},start(){},stop(){stopped++},disconnect(){disconnected++}}),createGain:()=>({gain:parameter,connect(){return this}})};
  playAlarmSound(context,'attention');
  const scheduledStops=stopped;
  stopAlarmSound(context);
  assert.equal(stopped-scheduledStops,alarmSound('attention').notes.length);
  assert.equal(disconnected,alarmSound('attention').notes.length);
});

test('alarm repeats after a consistent pause until it is stopped',t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  let started=0;
  const parameter={setValueAtTime(){},exponentialRampToValueAtTime(){}},context={currentTime:0,destination:{},createOscillator:()=>({frequency:parameter,connect(){return this},start(){started++},stop(){},disconnect(){}}),createGain:()=>({gain:parameter,connect(){return this}})};
  const notesPerPlay=alarmSound('sunrise').notes.length;
  repeatAlarmSound(context,'sunrise');
  assert.equal(started,notesPerPlay);
  t.mock.timers.tick((.62+ALARM_REPEAT_DELAY_SECONDS)*1000);
  assert.equal(started,notesPerPlay*2);
  stopAlarmSound(context);
  t.mock.timers.tick(10000);
  assert.equal(started,notesPerPlay*2);
});
