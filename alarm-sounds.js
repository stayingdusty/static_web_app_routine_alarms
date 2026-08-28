// Declarative Web Audio melodies keep every alarm available offline without files.
export const ALARM_SOUNDS=[
  {id:'sunrise',name:'Sunrise',description:'Warm rising bells',notes:[[523,0,.18],[659,.16,.18],[784,.32,.3]]},
  {id:'marimba',name:'Marimba Hop',description:'Playful wooden bounce',wave:'triangle',notes:[[659,0,.12],[523,.14,.12],[784,.28,.12],[1047,.42,.24]]},
  {id:'starlight',name:'Starlight',description:'Soft sparkling arpeggio',notes:[[880,0,.16],[1109,.2,.16],[1319,.4,.16],[1760,.6,.3]]},
  {id:'garden',name:'Garden Bells',description:'Gentle descending bells',notes:[[1047,0,.22],[880,.24,.22],[698,.48,.22],[784,.72,.32]]},
  {id:'bubbles',name:'Bubbles',description:'Quick cheerful pops',notes:[[784,0,.09],[988,.11,.09],[1175,.22,.09],[1568,.33,.18]]},
  {id:'morning',name:'Good Morning',description:'Friendly four-note greeting',wave:'triangle',notes:[[392,0,.18],[523,.2,.18],[659,.4,.18],[523,.62,.32]]},
  {id:'victory',name:'Tiny Victory',description:'Bright celebration fanfare',wave:'square',gain:.55,notes:[[523,0,.13],[659,.15,.13],[784,.3,.13],[1047,.45,.32]]},
  {id:'calm',name:'Calm Waves',description:'Slow and low, with no sharp tones',notes:[[330,0,.38],[392,.42,.38],[440,.84,.52]]},
  {id:'attention',name:'Kind Reminder',description:'Clear repeating two-tone cue',wave:'triangle',notes:[[659,0,.2],[880,.26,.3],[659,.68,.2],[880,.94,.3]]},
  {id:'classic',name:'Classic Chime',description:'Simple familiar chime',notes:[[784,0,.25],[1047,.3,.4]]},
];
export const DEFAULT_ALARM_SOUND='sunrise';
const activeVoices=new WeakMap();
const activeRepeats=new WeakMap();
export const ALARM_REPEAT_DELAY_SECONDS=1;
export function alarmSound(id){return ALARM_SOUNDS.find(sound=>sound.id===id)||ALARM_SOUNDS[0]}
export function alarmSoundOptions(selected){return ALARM_SOUNDS.map(sound=>`<option value="${sound.id}" ${sound.id===selected?'selected':''}>${sound.name} — ${sound.description}</option>`).join('')}
export function stopAlarmSound(context){
  if(!context)return;
  const repeat=activeRepeats.get(context);if(repeat)clearTimeout(repeat.timer);
  activeRepeats.delete(context);
  for(const oscillator of activeVoices.get(context)||[]){try{oscillator.stop()}catch{}try{oscillator.disconnect()}catch{}}
  activeVoices.delete(context);
}
export function playAlarmSound(context,id,volume=.7){
  for(const oscillator of activeVoices.get(context)||[]){try{oscillator.stop()}catch{}try{oscillator.disconnect()}catch{}}
  const sound=alarmSound(id),start=context.currentTime,voices=[];
  for(const [frequency,offset,duration] of sound.notes){
    const oscillator=context.createOscillator(),gain=context.createGain(),peak=Math.max(0,Math.min(1,volume))*.22*(sound.gain??1);
    oscillator.type=sound.wave||'sine';oscillator.frequency.setValueAtTime(frequency,start+offset);
    gain.gain.setValueAtTime(.0001,start+offset);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,peak),start+offset+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+offset+duration);
    oscillator.connect(gain).connect(context.destination);oscillator.start(start+offset);oscillator.stop(start+offset+duration+.02);voices.push(oscillator);
  }
  activeVoices.set(context,voices);
  return Math.max(...sound.notes.map(([,offset,duration])=>offset+duration));
}
export function repeatAlarmSound(context,id,volume=.7,repeatDelay=ALARM_REPEAT_DELAY_SECONDS){
  stopAlarmSound(context);
  const repeat={timer:null};activeRepeats.set(context,repeat);
  const play=()=>{
    if(activeRepeats.get(context)!==repeat)return;
    const duration=playAlarmSound(context,id,volume);
    repeat.timer=setTimeout(play,(duration+repeatDelay)*1000);
  };
  play();
}
