export const STORAGE_KEY = 'routineBeacon.v1';
export const SCHEMA_VERSION = 1;
export const dateKey = (d = new Date()) => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
export const runtimeKeyFor = (routineId, date = dateKey()) => `${date}:${routineId}`;
export function applyDefaultKeyMappings(config) {
  config.keys ||= {};
  if (!config.keyDefaultsVersion) {
    if (config.keys.next === 'KeyN') config.keys.next = 'Enter';
    if (config.keys.delay === 'KeyS') config.keys.delay = 'Space';
    config.keyDefaultsVersion = 2;
  }
  config.keys.previous ||= 'KeyP';
  config.keys.next ||= 'Enter';
  config.keys.delay ||= 'Space';
  return config;
}
export function timestampFor(time, now = new Date()) {
  const [h,m] = time.split(':').map(Number); const d = new Date(now);
  d.setHours(h,m,0,0); return d.getTime();
}
export function timestampForPhase(phases, phaseIndex, routineDate = dateKey()) {
  const [year,month,day] = routineDate.split('-').map(Number);
  const date = new Date(year,month-1,day);
  let dayOffset = 0, previousMinutes = null;
  for (let index = 0; index <= phaseIndex; index++) {
    const [hour,minute] = phases[index].time.split(':').map(Number);
    const minutes = hour * 60 + minute;
    if (previousMinutes !== null && minutes < previousMinutes) dayOffset++;
    previousMinutes = minutes;
  }
  date.setDate(date.getDate() + dayOffset);
  return timestampFor(phases[phaseIndex].time, date);
}
export function defaultRoutineFinishTime(phases = []) {
  const time = phases.at(-1)?.time || '08:00';
  const [hour, minute] = time.split(':').map(Number);
  const total = (hour * 60 + minute + 15) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
}
export function validateRoutineSchedule(routine) {
  if (routine.mode === 'duration') {
    const invalid = (routine.phases || []).find(phase => !Number.isFinite(Number(phase.durationMinutes)) || Number(phase.durationMinutes) < 1);
    return invalid ? `Choose a duration of at least one minute for “${invalid.name || 'a phase'}”.` : '';
  }
  if (!routine.finishTime) return 'Choose a routine complete time.';
  for (let index = 1; index < (routine.phases || []).length; index++) {
    if (routine.phases[index].time < routine.phases[index - 1].time) {
      return `“${routine.phases[index].name || `Phase ${index + 1}`}” cannot start before the previous phase.`;
    }
  }
  const laterPhase = (routine.phases || []).find(phase => phase.time > routine.finishTime);
  if (laterPhase) return `Routine complete time cannot be earlier than “${laterPhase.name || 'a phase'}”.`;
  return '';
}
export function timestampForRoutineFinish(routine, routineDate = dateKey()) {
  const phases = (routine.phases || []).filter(phase => phase.enabled !== false);
  return timestampForPhase([...phases, {time:routine.finishTime || defaultRoutineFinishTime(phases)}], phases.length, routineDate);
}
export function nextScheduledOccurrence(routines, after = new Date(), maxDays = 14) {
  let best = null;
  for (let offset = 0; offset <= maxDays; offset++) {
    const day = new Date(after);
    day.setDate(after.getDate() + offset);
    for (const routine of routines) {
      const first = routine.phases?.find(phase => phase.enabled);
      if (!first || !routine.days?.includes(day.getDay())) continue;
      const scheduledAt = timestampFor(first.time, day);
      if (scheduledAt <= after.getTime() || (best && scheduledAt >= best.scheduledAt)) continue;
      best = {routineId: routine.id, date: dateKey(day), scheduledAt};
    }
  }
  return best;
}
export function activeRoutineOccurrence(routine, now = new Date(), completedToday = false, maxDays = 14) {
  const first = routine?.phases?.find(phase => phase.enabled);
  if (!first || !routine.days?.length) return null;
  for (let offset = 0; offset <= maxDays; offset++) {
    if (offset === 0 && completedToday) continue;
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    if (!routine.days.includes(day.getDay())) continue;
    return {routineId: routine.id, date: dateKey(day), scheduledAt: timestampFor(first.time, day)};
  }
  return null;
}
export function formatDuration(ms) {
  const seconds = Math.max(0, Math.floor(Math.abs(ms)/1000));
  const h = Math.floor(seconds/3600), m = Math.floor((seconds%3600)/60), s = seconds%60;
  return `${h ? `${h}:` : ''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
export function delayAlarm(effective, now, isDue) {
  return (isDue || effective <= now ? now : effective) + 60000;
}
export function beginDurationPhase(runtime, phase, now = Date.now(), carryMs = 0) {
  runtime.durationStates ||= {};
  const saved = runtime.durationStates[phase.id];
  const remainingMs = saved ? saved.remainingMs + carryMs : Number(phase.durationMinutes) * 60000 + carryMs;
  runtime.durationStates[phase.id] = {remainingMs, startedAt: now};
  runtime.effectiveAlarm = now + remainingMs;
  return runtime.effectiveAlarm;
}
export function pauseDurationPhase(runtime, phase, now = Date.now()) {
  runtime.durationStates ||= {};
  const state = runtime.durationStates[phase.id];
  const remainingMs = Math.max(0, state ? state.remainingMs - (now - state.startedAt) : 0);
  runtime.durationStates[phase.id] = {remainingMs, startedAt: null};
  return remainingMs;
}
export function phaseContext(phases, phaseIndex) {
  return {
    current: phaseIndex >= 0 ? phases[phaseIndex] || null : null,
    next: phases[phaseIndex + 1] || null,
  };
}
export function rememberAlarmState(runtime, phase, effectiveAlarm, silenced) {
  if (phase) runtime.alarmStates[phase.id] = {effectiveAlarm, silenced};
}
export function alarmStateFor(runtime, phase) {
  return phase ? runtime.alarmStates[phase.id] || null : null;
}
export function checklistComplete(phase, checked = []) {
  return !(phase?.checklist?.length) || phase.checklist.every((_, index) => checked[index] === true);
}
export function encodeSharePayload(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export function decodeSharePayload(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(base64);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0))));
}
const routineShape = routine => ({
  name: routine.name,
  mode: routine.mode || 'schedule',
  days: routine.days || [],
  finishTime: routine.finishTime || defaultRoutineFinishTime(routine.phases),
  phases: (routine.phases || []).map(phase => ({
    time: phase.time || null, durationMinutes: Number(phase.durationMinutes) || 0, name: phase.name, description: phase.description || '', checklist: phase.checklist || [],
    alarm: phase.alarm !== false, enabled: phase.enabled !== false, sound: phase.sound || 'sunrise',
  })),
});
export function routineFingerprint(routine) {
  return JSON.stringify(routineShape(routine));
}
export function addSharedRoutine(config, sharedRoutine) {
  const duplicate = config.routines.find(routine => routineFingerprint(routine) === routineFingerprint(sharedRoutine));
  if (duplicate) {
    config.activeRoutineId = duplicate.id;
    return {routine: duplicate, imported: false};
  }
  const routine = structuredClone(sharedRoutine);
  routine.id = uid();
  routine.phases.forEach(phase => {
    phase.id = uid();
    phase.checklist ||= [];
  });
  config.routines.push(routine);
  config.activeRoutineId = routine.id;
  return {routine, imported: true};
}
export function encodeRoutineShare(routine) {
  const compact = routineShape(routine);
  return encodeSharePayload({v:4,r:[compact.name,compact.days,compact.finishTime,compact.mode,compact.phases.map(p=>[
    p.time,p.name,p.description,p.checklist,p.alarm?1:0,p.enabled?1:0,p.sound,p.durationMinutes,
  ])]});
}
export function decodeRoutineShare(value) {
  const payload = decodeSharePayload(value);
  if (![2,3,4].includes(payload.v) || !Array.isArray(payload.r)) return payload;
  const [name,days,finishOrPhases,modeOrPhases,v4Phases] = payload.r;
  const phases = payload.v === 4 ? v4Phases : payload.v === 3 ? modeOrPhases : finishOrPhases;
  const finishTime = payload.v >= 3 ? finishOrPhases : defaultRoutineFinishTime(phases.map(p=>({time:p[0]})));
  const mode = payload.v === 4 ? modeOrPhases : 'schedule';
  return {schemaVersion:1,routine:{id:uid(),name,days,finishTime,mode,phases:phases.map(p=>({
    id:uid(),time:p[0],name:p[1],description:p[2]||'',checklist:p[3]||[],alarm:p[4]!==0,enabled:p[5]!==0,sound:p[6]||'sunrise',durationMinutes:Number(p[7])||(mode === 'duration' ? 15 : 0),
  }))}};
}
export function freshRuntime(routineId, date = dateKey()) {
  return {
    date,
    routineId,
    phaseIndex: -1,
    effectiveAlarm: null,
    silenced: false,
    started: false,
    alarmStates: {},
    checklistStates: {},
    durationStates: {},
    modelVersion: 4,
  };
}
export function startExclusiveRuntime(runtimes, routineId, date = dateKey()) {
  const targetKey = `${date}:${routineId}`;
  for (const key of Object.keys(runtimes)) {
    if (key.startsWith(`${date}:`) && key !== targetKey) delete runtimes[key];
  }
  const runtime = runtimes[targetKey] || (runtimes[targetKey] = freshRuntime(routineId, date));
  runtime.started = true;
  if (runtime.phaseIndex < 0) runtime.phaseIndex = 0;
  return runtime;
}
export function validConfig(value) {
  return value && value.schemaVersion === 1 && Array.isArray(value.routines) &&
    value.routines.every(r => typeof r.id==='string' && typeof r.name==='string' &&
      (r.finishTime === undefined || /^\d\d:\d\d$/.test(r.finishTime)) && Array.isArray(r.phases) &&
      r.phases.every(p => typeof p.id==='string' && typeof p.name==='string' && ((r.mode==='duration' && Number(p.durationMinutes)>=1) || /^\d\d:\d\d$/.test(p.time)) &&
        (p.checklist === undefined || (Array.isArray(p.checklist) && p.checklist.every(item => typeof item === 'string')))));
}
export function initialData() {
  const phase=(time,name,description='',checklist=[])=>({id:uid(),time,name,description,checklist,alarm:true,enabled:true,sound:'sunrise'});
  const r={id:uid(),name:'School Morning',mode:'schedule',days:[1,2,3,4,5],finishTime:'08:00',phases:[
    phase('06:15','Meds / Get Ready','Take medicine\nGet dressed\nBrush teeth',['Take medicine','Get dressed','Brush teeth']), phase('06:30','Start Breakfast'),
    phase('06:50','Homework / School Organization'), phase('07:30','Pack Up / Final Prep'), phase('07:50','Leave for School') ]};
  return {appVersion:'1.1.0',schemaVersion:1,routines:[r],activeRoutineId:r.id,preferences:{sound:'sunrise',volume:.7,idleMinutes:2,keepAwakeDuringAlarm:true},keys:{next:'Enter',previous:'KeyP',delay:'Space',silence:'KeyD'},keyDefaultsVersion:2,runtimes:{}};
}
