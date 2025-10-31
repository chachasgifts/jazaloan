// ---------- Motivation ----------
const motivations = [
  "🔥 Stay strong, you’ve got this!",
  "💪 Small steps every day lead to big results.",
  "⚡ Push harder than yesterday!",
  "🌟 Progress, not perfection.",
  "🏆 One step closer to your best self.",
  "🔥 Sweat today, shine tomorrow.",
  "💯 Discipline beats motivation."
];

// ---------- Rewards ----------
let rewards = ["Nyama choma 🍖","Swimming 🏊","Hiking 🌳","Cycling 🚴","Music 🎶"];

// ---------- Training Plans ----------
const weeksMuscleGain = { 1:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Standard Push-ups 5x10","Bodyweight Squats 3x12","Plank 20s"]}, // 50 pushups
    {day:"Tue",tasks:["Jog 15 min"]},
    {day:"Wed",tasks:["Incline Push-ups 4x12","Glute Bridges 3x12","Plank 25s"]},
    {day:"Thu",tasks:["Knee Push-ups 4x12","Lunges 3x10 each leg","Side Plank 20s each side"]},
    {day:"Fri",tasks:["Jog 15 min","Mountain Climbers 3x15"]},
    {day:"Sat",tasks:["🎁 Reward Day: Swimming / Music"]}
  ],
  2:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Standard Push-ups 5x12","Jump Squats 3x10","Plank 30s"]}, // 60 pushups
    {day:"Tue",tasks:["Jog 18 min"]},
    {day:"Wed",tasks:["Incline Push-ups 4x12","Glute Bridges 3x15","Plank 30s"]},
    {day:"Thu",tasks:["Diamond Push-ups 4x10","Reverse Lunges 3x12 each leg","Side Plank 25s each side"]},
    {day:"Fri",tasks:["Jog 18 min","Mountain Climbers 3x20"]},
    {day:"Sat",tasks:["🎁 Reward Day: Hiking / Music"]}
  ],
  3:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Wide Push-ups 5x10","Bulgarian Split Squats 3x10 each leg","Plank 35s"]}, // 50 pushups
    {day:"Tue",tasks:["Jog 20 min"]},
    {day:"Wed",tasks:["Incline Push-ups 5x12","Hip Thrusts 3x12","Leg Raises 3x10"]},
    {day:"Thu",tasks:["Diamond Push-ups 4x10","Step-ups 3x12 each leg","Side Plank 30s each side"]},
    {day:"Fri",tasks:["Jog 20 min","Burpees 3x8"]},
    {day:"Sat",tasks:["🎁 Reward Day: Outdoor Activity"]}
  ],
  4:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Decline Push-ups 5x10","Jump Squats 3x12","Plank 40s"]}, // 50 pushups
    {day:"Tue",tasks:["Jog 22 min"]},
    {day:"Wed",tasks:["Archer Push-ups 4x8","Glute Bridges 4x12","Leg Raises 3x12"]},
    {day:"Thu",tasks:["Diamond Push-ups 5x8","Lunges 4x12 each leg","Side Plank 35s each side"]},
    {day:"Fri",tasks:["Jog 22 min","Burpees 3x10"]},
    {day:"Sat",tasks:["🎁 Reward Day: Movie Night"]}
  ],
  5:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Standard Push-ups 6x10","Bulgarian Split Squats 3x12 each leg","Plank 45s"]}, // 60 pushups
    {day:"Tue",tasks:["Jog 25 min"]},
    {day:"Wed",tasks:["Incline Push-ups 5x12","Hip Thrusts 4x12","Leg Raises 3x15"]},
    {day:"Thu",tasks:["Decline Push-ups 4x10","Jump Lunges 3x10 each leg","Side Plank 40s each side"]},
    {day:"Fri",tasks:["Jog 25 min","Burpees 3x12"]},
    {day:"Sat",tasks:["🎁 Reward Day: Nyama Choma"]}
  ],
  6:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Wide Push-ups 6x10","Pistol Squat (assisted) 3x6 each leg","Plank 50s"]}, // 60 pushups
    {day:"Tue",tasks:["Jog 28 min"]},
    {day:"Wed",tasks:["Diamond Push-ups 5x10","Glute Bridges 4x15","Leg Raises 4x10"]},
    {day:"Thu",tasks:["Decline Push-ups 5x10","Step-ups 4x12 each leg","Side Plank 45s each side"]},
    {day:"Fri",tasks:["Jog 28 min","Burpees 3x15"]},
    {day:"Sat",tasks:["🎁 Reward Day: Music / Game Night"]}
  ],
  7:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Archer Push-ups 5x8","Jump Squats 4x12","Plank 55s"]},
    {day:"Tue",tasks:["Jog 30 min"]},
    {day:"Wed",tasks:["Incline Push-ups 6x10","Hip Thrusts 4x15","Leg Raises 4x12"]}, // 60 pushups
    {day:"Thu",tasks:["Diamond Push-ups 5x12","Walking Lunges 3x14 each leg","Side Plank 50s each side"]},
    {day:"Fri",tasks:["Jog 30 min","Burpees 4x10"]},
    {day:"Sat",tasks:["🎁 Reward Day: Outdoor Fun"]}
  ],
  8:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Decline Push-ups 6x10","Bulgarian Split Squats 4x12 each leg","Plank 60s"]},
    {day:"Tue",tasks:["Jog 32 min"]},
    {day:"Wed",tasks:["Archer Push-ups 5x10","Glute Bridges 4x18","Leg Raises 4x15"]},
    {day:"Thu",tasks:["Diamond Push-ups 6x10","Jump Lunges 4x12 each leg","Side Plank 55s each side"]},
    {day:"Fri",tasks:["Jog 32 min","Burpees 4x12"]},
    {day:"Sat",tasks:["🎁 Reward Day: Music / Nyama Choma"]}
  ],
  9:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Standard Push-ups 8x6","Jump Squats 4x15","Plank 65s"]}, // 48 pushups (high intensity sets)
    {day:"Tue",tasks:["Jog 35 min"]},
    {day:"Wed",tasks:["Incline Push-ups 6x12","Hip Thrusts 5x12","Leg Raises 4x18"]},
    {day:"Thu",tasks:["Diamond Push-ups 6x12","Walking Lunges 4x14 each leg","Side Plank 60s each side"]},
    {day:"Fri",tasks:["Jog 35 min","Burpees 4x15"]},
    {day:"Sat",tasks:["🎁 Reward Day: Party"]}
  ],
  10:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Wide Push-ups 6x10","Pistol Squat (assisted) 4x8 each leg","Plank 70s"]},
    {day:"Tue",tasks:["Jog 38 min"]},
    {day:"Wed",tasks:["Decline Push-ups 6x10","Glute Bridges 5x15","Leg Raises 5x12"]},
    {day:"Thu",tasks:["Archer Push-ups 6x8","Jump Squats 4x15","Side Plank 65s each side"]},
    {day:"Fri",tasks:["Jog 38 min","Burpees 5x10"]},
    {day:"Sat",tasks:["🎁 Reward Day: Movie Night"]}
  ],
  11:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Diamond Push-ups 6x12","Bulgarian Split Squats 4x14 each leg","Plank 75s"]},
    {day:"Tue",tasks:["Jog 40 min"]},
    {day:"Wed",tasks:["Decline Push-ups 6x12","Hip Thrusts 5x18","Leg Raises 5x15"]},
    {day:"Thu",tasks:["Archer Push-ups 6x10","Walking Lunges 4x16 each leg","Side Plank 70s each side"]},
    {day:"Fri",tasks:["Jog 40 min","Burpees 5x12"]},
    {day:"Sat",tasks:["🎁 Reward Day: Nyama Choma"]}
  ],
  12:[
    {day:"Sun",tasks:["Rest day"]},
    {day:"Mon",tasks:["Mixed Push-up Circuit (Standard, Wide, Diamond) 5x10 each","Jump Squats 5x15","Plank 80s"]}, // very high volume
    {day:"Tue",tasks:["Jog 45 min"]},
    {day:"Wed",tasks:["Archer Push-ups 5x12","Glute Bridges 5x20","Leg Raises 5x18"]},
    {day:"Thu",tasks:["Decline Push-ups 6x12","Pistol Squat (assisted) 4x10 each leg","Side Plank 75s each side"]},
    {day:"Fri",tasks:["Jog 45 min","Burpees 5x15"]},
    {day:"Sat",tasks:["🎁 Reward Day: Celebration 🎉"]}
  ]
};

const weeksFocusOMAD = {
  1:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Push-ups 5x10","Squats 3x12","Plank 20–30s"]},
     {day:"Tue",tasks:["Walk 15 min","Mobility 10 min"]},
     {day:"Wed",tasks:["Lunges 3x10 each leg","Squats 3x10","Side Plank 2x20s each side"]},
     {day:"Thu",tasks:["Push-ups 5x10","Dips 3x8–10","Plank w/ shoulder taps 2x10 each side"]},
     {day:"Fri",tasks:["Walk / cycle 15 min","Leg raises 3x10","Bird-dogs 3x12"]},
     {day:"Sat",tasks:["🎁 Reward Day: Swimming / Cycling / Music"]}
  ],
  2:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Incline Push-ups 5x10","Goblet Squats 3x12","Plank 30s"]},
     {day:"Tue",tasks:["Jog 20 min","Mobility flow 10 min"]},
     {day:"Wed",tasks:["Reverse Lunges 3x12 each leg","Glute bridges 3x15","Side Plank 3x20s each side"]},
     {day:"Thu",tasks:["Diamond Push-ups 4x10","Chair Dips 3x10","Mountain Climbers 3x20"]},
     {day:"Fri",tasks:["Walk / cycle 20 min","Leg raises 3x12","Supermans 3x12"]},
     {day:"Sat",tasks:["🎁 Reward Day: Swimming / Cycling / Music"]}
  ],
  3:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Decline Push-ups 5x10","Split Squats 3x12 each leg","Plank 40s"]},
     {day:"Tue",tasks:["Jog 25 min","Mobility flow 15 min"]},
     {day:"Wed",tasks:["Step-ups 3x12 each leg","Glute bridges 4x15","Side Plank 3x25s each side"]},
     {day:"Thu",tasks:["Wide Push-ups 5x10","Bench Dips 3x12","Mountain Climbers 4x20"]},
     {day:"Fri",tasks:["Cycle 20 min","Hollow Holds 3x20s","Bird-dogs 4x12"]},
     {day:"Sat",tasks:["🎁 Reward Day: Swimming / Cycling / Music"]}
  ],
  4:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Archer Push-ups 4x8 each side","Bulgarian Split Squats 3x12 each leg","Plank 45s"]},
     {day:"Tue",tasks:["Jog 25 min","Yoga flow 20 min"]},
     {day:"Wed",tasks:["Jump Squats 3x12","Glute bridges 4x20","Side Plank 3x30s each side"]},
     {day:"Thu",tasks:["Decline Push-ups 4x12","Chair Dips 4x10","Mountain Climbers 4x25"]},
     {day:"Fri",tasks:["Walk 20 min","Leg Raises 3x15","Supermans 4x15"]},
     {day:"Sat",tasks:["🎁 Reward Day: Swimming / Cycling / Music"]}
  ],
  5:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Diamond Push-ups 5x10","Jump Squats 3x15","Plank 50s"]},
     {day:"Tue",tasks:["Jog 28 min","Mobility + Stretch 15 min"]},
     {day:"Wed",tasks:["Reverse Lunges 4x12 each leg","Hip Thrusts 3x15","Side Plank 35s each side"]},
     {day:"Thu",tasks:["Wide Push-ups 5x12","Bench Dips 4x12","Mountain Climbers 4x25"]},
     {day:"Fri",tasks:["Cycle 25 min","Leg Raises 4x12","Supermans 4x15"]},
     {day:"Sat",tasks:["🎁 Reward Day: Music / Yoga / Walk"]}
  ],
  6:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Decline Push-ups 5x12","Bulgarian Split Squats 4x12 each leg","Plank 55s"]},
     {day:"Tue",tasks:["Jog 30 min","Mobility Flow 15 min"]},
     {day:"Wed",tasks:["Jump Squats 4x12","Glute Bridges 4x18","Side Plank 40s each side"]},
     {day:"Thu",tasks:["Archer Push-ups 5x8","Chair Dips 4x12","Mountain Climbers 4x30"]},
     {day:"Fri",tasks:["Walk / Cycle 25 min","Hollow Holds 3x25s","Supermans 4x18"]},
     {day:"Sat",tasks:["🎁 Reward Day: Music / Hiking"]}
  ],
  7:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Mixed Push-ups (Standard, Wide, Diamond) 3x12 each","Squats 4x15","Plank 60s"]},
     {day:"Tue",tasks:["Jog 30 min","Yoga 20 min"]},
     {day:"Wed",tasks:["Step-ups 4x12 each leg","Glute Bridges 5x15","Side Plank 45s each side"]},
     {day:"Thu",tasks:["Decline Push-ups 5x12","Bench Dips 4x12","Burpees 3x10"]},
     {day:"Fri",tasks:["Cycle 28 min","Leg Raises 4x15","Bird-dogs 4x15"]},
     {day:"Sat",tasks:["🎁 Reward Day: Music / Swimming"]}
  ],
  8:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Archer Push-ups 5x10","Jump Squats 4x15","Plank 65s"]},
     {day:"Tue",tasks:["Jog 32 min","Mobility + Core Flow 20 min"]},
     {day:"Wed",tasks:["Lunges 4x14 each leg","Glute Bridges 5x18","Side Plank 50s each side"]},
     {day:"Thu",tasks:["Wide Push-ups 5x12","Chair Dips 4x12","Mountain Climbers 4x30"]},
     {day:"Fri",tasks:["Walk 25 min","Leg Raises 4x15","Supermans 5x15"]},
     {day:"Sat",tasks:["🎁 Reward Day: Music / Outdoor Activity"]}
  ],
  9:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Decline Push-ups 6x10","Pistol Squat (assisted) 3x6 each leg","Plank 70s"]},
     {day:"Tue",tasks:["Jog 35 min","Mobility + Stretch 20 min"]},
     {day:"Wed",tasks:["Jump Squats 4x15","Hip Thrusts 4x20","Side Plank 55s each side"]},
     {day:"Thu",tasks:["Diamond Push-ups 5x12","Bench Dips 4x12","Burpees 3x12"]},
     {day:"Fri",tasks:["Cycle 30 min","Hollow Holds 4x25s","Supermans 4x20"]},
     {day:"Sat",tasks:["🎁 Reward Day: Music / Outdoor Walk"]}
  ],
  10:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Mixed Push-ups (Standard, Wide, Diamond) 4x12 each","Jump Squats 4x15","Plank 75s"]},
     {day:"Tue",tasks:["Jog 38 min","Yoga Flow 25 min"]},
     {day:"Wed",tasks:["Step-ups 4x15 each leg","Glute Bridges 5x20","Side Plank 60s each side"]},
     {day:"Thu",tasks:["Archer Push-ups 5x10","Chair Dips 4x12","Mountain Climbers 4x35"]},
     {day:"Fri",tasks:["Walk 30 min","Leg Raises 5x15","Bird-dogs 4x18"]},
     {day:"Sat",tasks:["🎁 Reward Day: Swimming / Relax"]}
  ],
  11:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Decline Push-ups 6x12","Bulgarian Split Squats 4x14 each leg","Plank 80s"]},
     {day:"Tue",tasks:["Jog 40 min","Mobility 25 min"]},
     {day:"Wed",tasks:["Jump Squats 5x12","Hip Thrusts 5x18","Side Plank 65s each side"]},
     {day:"Thu",tasks:["Diamond Push-ups 6x10","Bench Dips 4x15","Burpees 4x10"]},
     {day:"Fri",tasks:["Cycle 32 min","Hollow Holds 4x30s","Supermans 5x18"]},
     {day:"Sat",tasks:["🎁 Reward Day: Music / Movie Night"]}
  ],
  12:[
     {day:"Sun",tasks:["Rest day"]},
     {day:"Mon",tasks:["Mixed Push-up Circuit (Standard, Wide, Diamond, Decline) 4x12 each","Jump Squats 5x15","Plank 90s"]},
     {day:"Tue",tasks:["Jog 45 min","Mobility + Stretch 25 min"]},
     {day:"Wed",tasks:["Step-ups 5x15 each leg","Glute Bridges 5x20","Side Plank 70s each side"]},
     {day:"Thu",tasks:["Archer Push-ups 6x10","Chair Dips 5x12","Mountain Climbers 5x35"]},
     {day:"Fri",tasks:["Cycle 35 min","Leg Raises 5x15","Supermans 5x20"]},
     {day:"Sat",tasks:["🎁 Reward Day: Celebration 🎉"]}
  ]
};

// ---------- App State ----------
let player = JSON.parse(localStorage.getItem("fitness90Day_currentUser")) || null;

// ---------- Navigation ----------
function openNav(){document.getElementById("sidebar").style.width="250px";}
function closeNav(){document.getElementById("sidebar").style.width="0";}
function showSection(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active-section","slide-in"));
  const newSection=document.getElementById(id);
  if(newSection)newSection.classList.add("active-section","slide-in");
  closeNav();
  if(id==="home" && player) loadToday();
  if(id==="profile" && player) updateProfile();
  if(id==="settings" && player) loadJournal();
}

// ---------- Signup / Login ----------
function showSignup(){
  document.getElementById("signupForm").style.display="block";
  document.getElementById("loginForm").style.display="none";
}
function showLogin(){
  document.getElementById("signupForm").style.display="none";
  document.getElementById("loginForm").style.display="block";
}

function saveSetup(){
  const name=document.getElementById("signupUsername").value.trim();
  const goal=document.getElementById("goalInput").value;
  if(!name)return alert("Enter username");

  const key=`fitness90Day_${name}`;
  if(localStorage.getItem(key))return alert("⚠️ User already exists. Please log in.");

  player={name,goal,week:1,day:1,points:0,rewards:[],journal:[],lastDate:"",checklist:{}};
  persist(); showSection("home"); updateSidebarUser(); showRewardReminder();
}

function loginUser(){
  const name=document.getElementById("loginUsername").value.trim();
  const data=localStorage.getItem(`fitness90Day_${name}`);
  if(!data)return alert("⚠️ No account found. Please sign up first.");

  player=JSON.parse(data);
  persist(); showSection("home"); updateSidebarUser(); showRewardReminder();
}

// ---------- Sidebar Username ----------
function updateSidebarUser(){
  const sidebarUserLink=document.querySelector('#sidebar a[onclick*="profile"]');
  if(sidebarUserLink && player) sidebarUserLink.textContent=`👤 ${player.name}`;
}

// ---------- Daily Plan ----------
function loadToday(){
  const today=new Date().toDateString();
  document.getElementById("todayDate").textContent=today;
  document.getElementById("motivation").textContent=motivations[Math.floor(Math.random()*motivations.length)];
  if(player.lastDate!==today){player.lastDate=today;player.checklist={};}
  const weekPlan=(player.goal==="Muscle Gain"?weeksMuscleGain:weeksFocusOMAD)[player.week]||[{day:"Any",tasks:["Rest day"]}];
  const todayPlan=weekPlan[new Date().getDay()]||weekPlan[0];
  const ul=document.getElementById("dailyChecklist");ul.innerHTML="";
  todayPlan.tasks.forEach(task=>{
    const li=document.createElement("li");
    const box=document.createElement("input");box.type="checkbox";
    box.checked=!!player.checklist[task];
    box.onchange=()=>{player.checklist[task]=box.checked;persist();};
    li.append(task,box);
    ul.append(li);
  });
}

// ---------- Complete Day ----------
function completeDay(){
  const allDone=Object.values(player.checklist).every(Boolean);
  if(!allDone)return alert("Finish all tasks first!");
  player.points+=50; player.day++; if(player.day>7){player.day=1;player.week++;}
  if(player.points%300===0)player.rewards.push(rewards[Math.floor(Math.random()*rewards.length)]);
  persist(); document.getElementById("homeStatus").textContent="✅ Great job! +50 pts!"; updateProfile();
}

// ---------- Profile ----------
function updateProfile(){
  document.getElementById("profileName").textContent=player.name;
  document.getElementById("profileGoal").textContent=player.goal;
  document.getElementById("profileWeek").textContent=player.week;
  document.getElementById("profilePoints").textContent=player.points;
  const rewardsList=document.getElementById("rewardsList");
  if(player.rewards.length){
    rewardsList.innerHTML=player.rewards.map(r=>`<li>${r}</li>`).join("");
  }else{
    rewardsList.innerHTML=`<li>🎯 Upcoming Reward: ${getUpcomingReward()}</li>`;
  }
}

// ---------- Journal ----------
function saveJournal(){
  const text=document.getElementById("journalInput").value.trim();
  if(!text)return alert("Write something first!");
  player.journal.unshift({date:new Date().toLocaleDateString(),text});
  document.getElementById("journalInput").value=""; persist(); loadJournal();
}
function loadJournal(){
  const div=document.getElementById("journalEntries");
  if(!player.journal.length)return div.innerHTML="<p style='color:#777;'>No entries yet.</p>";
  div.innerHTML=player.journal.map(j=>`<div style='text-align:left;margin-bottom:0.5rem;'><strong>${j.date}</strong><br>${j.text}</div>`).join("");
}
function clearJournal(){
  if(confirm("Clear all entries?")){player.journal=[];persist();loadJournal();}
}

// ---------- Settings ----------
function changeGoal(val){player.goal=val;persist();alert("Goal changed!");}
function resetProgress(){
  if(confirm("Reset all data?")){
    localStorage.clear();player=null;
    document.querySelectorAll(".section").forEach(s=>s.classList.remove("active-section"));
    document.getElementById("setup").classList.add("active-section");
  }
}

// ---------- Rewards + Reminder ----------
function getUpcomingReward(){
  const weekIndex=(player.week-1)%rewards.length;
  return rewards[weekIndex]||"Surprise Reward 🎁";
}
function showRewardReminder(){
  const daysLeft=7-player.day+1;
  alert(`🎯 Only ${daysLeft} day${daysLeft>1?"s":""} until your next reward! Keep going!`);
}

// ---------- Logo Navigation ----------
function logoutUser(){
  // Allows switching user safely
  player=null;
  localStorage.removeItem("fitness90Day_currentUser");
  showSection("setup");
  showLogin();
}

// ---------- Storage ----------
function persist(){
  localStorage.setItem(`fitness90Day_${player.name}`,JSON.stringify(player));
  localStorage.setItem("fitness90Day_currentUser",JSON.stringify(player));
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded",()=>{
  // ✅ No extra tagline or floating logo — the HTML already has them
  if(player && player.name){
    showSection("home");
    loadToday();
    updateProfile();
    loadJournal();
    updateSidebarUser();
    showRewardReminder();
  } else {
    showSection("setup");
  }
});

// ---------- Theme toggle ----------
const themeToggle=document.getElementById('themeToggle');
const body=document.body;
const savedTheme=localStorage.getItem('theme');
if(savedTheme==='dark'){body.setAttribute('data-theme','dark');themeToggle.textContent='🌞';}
themeToggle.addEventListener('click',()=>{
  const isDark=body.getAttribute('data-theme')==='dark';
  if(isDark){body.removeAttribute('data-theme');themeToggle.textContent='🌙';localStorage.setItem('theme','light');}
  else{body.setAttribute('data-theme','dark');themeToggle.textContent='🌞';localStorage.setItem('theme','dark');}
});

// ---------- Animations ----------
const style=document.createElement('style');
style.textContent=`@keyframes pulse {0%{transform:scale(1);opacity:1;}50%{transform:scale(1.1);opacity:0.8;}100%{transform:scale(1);opacity:1;}}`;
document.head.appendChild(style);
