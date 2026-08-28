export const STORAGE_KEY = 'routineBeacon.v1';
export const SCHEMA_VERSION = 1;
export const dateKey = (d = new Date()) => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
export function timestampFor(time, now = new Date()) {
  const [h,m] = time.split(':').map(Number); const d = new Date(now);
  d.setHours(h,m,0,0); return d.getTime();
}
export function formatDuration(ms) {
  const seconds = Math.max(0, Math.floor(Math.abs(ms)/1000));
  const h = Math.floor(seconds/3600), m = Math.floor((seconds%3600)/60), s = seconds%60;
  return `${h ? `${h}:` : ''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
export function delayAlarm(effective, now, isDue) {
  return (isDue || effective <= now ? now : effective) + 60000;
}
export function validConfig(value) {
  return value && value.schemaVersion === 1 && Array.isArray(value.routines) && value.routines.length > 0 &&
    value.routines.every(r => typeof r.id==='string' && typeof r.name==='string' && Array.isArray(r.phases) &&
      r.phases.every(p => typeof p.id==='string' && typeof p.name==='string' && /^\d\d:\d\d$/.test(p.time)));
}
export function initialData() {
  const phase=(time,name,description='')=>({id:uid(),time,name,description,alarm:true,enabled:true,sound:'chime'});
  const r={id:uid(),name:'School Morning',days:[1,2,3,4,5],phases:[
    phase('06:15','Meds / Get Ready','Take medicine\nGet dressed\nBrush teeth'), phase('06:30','Start Breakfast'),
    phase('06:50','Homework / School Organization'), phase('07:30','Pack Up / Final Prep'), phase('07:50','Leave for School') ]};
  return {appVersion:'1.0.0',schemaVersion:1,routines:[r],activeRoutineId:r.id,preferences:{sound:'chime',volume:.7},keys:{next:'KeyN',delay:'KeyS',silence:'KeyD'},runtime:null};
}
