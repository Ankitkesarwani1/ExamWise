import { useMemo, useState } from "react";
import "./dashboard.css";
import "./intelligence.css";
import "./mobile.css";
import { useAuth } from "./auth/AuthProvider";
import { supabaseConfigured } from "./lib/supabase";
import { useSubjects, usePapers, paperUrl } from "./lib/data";

type Page = "Dashboard" | "Question Papers" | "Syllabus Explorer" | "Exam Intelligence" | "Analyze Paper" | "Mock Tests" | "Study Planner" | "Performance Analytics" | "Saved Resources" | "Community Contributions" | "Notifications" | "Settings" | "Admin";

const nav: { label: Page; icon: string }[] = [
  { label: "Dashboard", icon: "grid" }, { label: "Question Papers", icon: "file" },
  { label: "Syllabus Explorer", icon: "book" }, { label: "Exam Intelligence", icon: "spark" },
  { label: "Mock Tests", icon: "check" }, { label: "Study Planner", icon: "calendar" },
  { label: "Performance Analytics", icon: "chart" },
];
const extra: { label: Page; icon: string }[] = [
  { label: "Saved Resources", icon: "bookmark" }, { label: "Community Contributions", icon: "users" },
  { label: "Notifications", icon: "bell" }, { label: "Settings", icon: "settings" },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M8 7h8M8 11h6"/></>,
    spark: <><path d="m12 3-1.2 4.2L7 9l3.8 1.8L12 15l1.2-4.2L17 9l-3.8-1.8z"/><path d="m5 15-.6 2.1L2.5 18l1.9.9L5 21l.6-2.1 1.9-.9-1.9-.9z"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4z"/>, users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-6 6-6s6 2 6 6M16 5a3 3 0 0 1 0 6M17 14c3 0 4 2 4 5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>, arrow: <path d="m9 18 6-6-6-6"/>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16"/></>, upload: <><path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, filter: <path d="M3 5h18l-7 8v6l-4 2v-8z"/>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>, close: <path d="m6 6 12 12M18 6 6 18"/>, plus: <path d="M12 5v14M5 12h14"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Button({ children, kind = "primary", icon, onClick }: { children: React.ReactNode; kind?: "primary" | "secondary" | "ghost"; icon?: string; onClick?: () => void }) {
  return <button className={`btn ${kind}`} onClick={onClick}>{icon && <Icon name={icon} size={16}/>}<span>{children}</span></button>;
}
function Progress({ value, violet = false }: { value: number; violet?: boolean }) {
  return <div className="progress"><div className={violet ? "violet" : ""} style={{ width: `${value}%` }}/></div>;
}
function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: string }) { return <span className={`badge ${tone}`}>{children}</span>; }


function Sidebar({ page, go, open, close }: { page: Page; go: (p: Page) => void; open: boolean; close: () => void }) {
  const { displayName, initials, profile, signOut } = useAuth();
  const group = (items: typeof nav) => items.map(item => <button key={item.label} className={`nav-item ${page === item.label ? "active" : ""}`} onClick={() => { go(item.label); close(); }}><Icon name={item.icon}/><span>{item.label}</span></button>);
  return <aside className={`sidebar ${open ? "open" : ""}`}>
    <div className="brand"><div className="logo"><Icon name="book" size={21}/><i/></div><div><b>ExamWise</b> <span>AI</span><small>Study smarter</small></div><button className="icon-btn mobile-close" onClick={close}><Icon name="close"/></button></div>
    <div className="nav-label">MAIN</div><nav>{group(nav)}</nav>
    <div className="nav-label extra-label">ADDITIONAL</div><nav>{group(extra)}</nav>
    <div className="sidebar-foot"><div className="mini-avatar">{initials}</div><div><b>{displayName}</b><span>Semester {profile?.semester ?? 5}</span></div>{supabaseConfigured ? <button className="icon-btn" title="Sign out" onClick={signOut}><Icon name="close" size={15}/></button> : <Icon name="arrow" size={15}/>}</div>
  </aside>;
}

function Header({ page, menu }: { page: Page; menu: () => void }) {
  const { initials } = useAuth();
  return <header><button className="icon-btn mobile-menu" onClick={menu}><Icon name="menu"/></button><div className="crumb">ExamWise <span>/</span> <b>{page}</b></div><div className="header-actions"><label className="top-search"><Icon name="search" size={17}/><input placeholder="Search anything..." /></label><div className="term">Semester 5 <span>2025–26</span></div><button className="icon-btn bell"><Icon name="bell"/><i/></button><div className="avatar">{initials}</div></div></header>;
}

function MobileNav({ page, go, more }: { page: Page; go: (page: Page) => void; more: () => void }) {
  const items: { label: string; page?: Page; icon: string }[] = [
    { label: "Home", page: "Dashboard", icon: "grid" },
    { label: "Papers", page: "Question Papers", icon: "file" },
    { label: "Insights", page: "Exam Intelligence", icon: "spark" },
    { label: "Practice", page: "Mock Tests", icon: "check" },
    { label: "More", icon: "menu" },
  ];
  return <nav className="mobile-bottom-nav" aria-label="Mobile navigation">{items.map(item => <button className={item.page === page ? "active" : ""} key={item.label} onClick={() => item.page ? go(item.page) : more()}><Icon name={item.icon} size={19}/><span>{item.label}</span></button>)}</nav>;
}

function Dashboard({ go }: { go: (p: Page) => void }) {
  const { displayName } = useAuth();
  const { rows: subjects, loading: subjectsLoading } = useSubjects(5);
  return <div className="page dashboard-page">
    <section className="welcome"><div><Badge tone="violet">SEMESTER EXAMS · 38 DAYS AWAY</Badge><h1>Good morning, {displayName.split(" ")[0]}</h1><p>Your preparation, made smarter. Find resources, discover examination trends, and prepare with confidence.</p><div className="context">B.Tech Artificial Intelligence & Data Science <span/> Third Year · Semester 5</div></div><div className="readiness"><div className="ring"><b>68%</b><span>ready</span></div><div><b>Preparation score</b><p>Up 8% this week</p></div></div></section>
    <div className="hero-search"><Icon name="search" size={21}/><input placeholder="Search subjects, question papers, syllabus topics..." /><kbd>⌘ K</kbd></div>
    <div className="quick"><Button icon="spark" onClick={() => go("Analyze Paper")}>Analyze a Paper</Button><Button kind="secondary" icon="plus" onClick={() => go("Mock Tests")}>Generate Mock Test</Button><Button kind="secondary" icon="calendar" onClick={() => go("Study Planner")}>Create Study Plan</Button></div>
    <div className="metrics">{[["128","Available papers","+12 this month"],["6","Subjects available","Semester V"],["68%","Syllabus coverage","+8% this week"],["8","Mock tests completed","74% average"]].map((m,i)=><div className="metric" key={m[1]}><div className={`metric-icon c${i}`}><Icon name={["file","book","chart","check"][i]}/></div><div><strong>{m[0]}</strong><span>{m[1]}</span><small>{m[2]}</small></div></div>)}</div>
    <div className="section-head"><div><h2>My subjects</h2><p>Continue where you left off</p></div><button className="text-btn" onClick={() => go("Syllabus Explorer")}>View syllabus <Icon name="arrow" size={15}/></button></div>
    <div className="subjects">{subjectsLoading && <p>Loading subjects…</p>}{!subjectsLoading && subjects.length === 0 && <p>No subjects added yet.</p>}{subjects.map((s,i)=><div className="subject-card" key={s[1]}><div className={`subject-icon s${i}`}><Icon name={i%2?"chart":"book"}/></div><div className="subject-title"><h3>{s[0]}</h3><Badge>{s[1]}</Badge></div><div className="subject-meta"><span>{s[2]}</span><b>{s[3]}% complete</b></div><Progress value={Number(s[3])} violet={i===1}/><button className="explore" onClick={()=>go("Syllabus Explorer")}>Explore subject <Icon name="arrow" size={15}/></button></div>)}</div>
    <div className="dashboard-grid">
      <section className="card intelligence"><div className="section-head"><div><h2>Exam intelligence</h2><p>Frequency across 5 DBMS papers</p></div><Badge tone="violet">AI INSIGHT</Badge></div>
        <div className="bar-chart">{[["Normalization",100,"5/5"],["SQL Queries",80,"4/5"],["Transactions",60,"3/5"],["ER Modeling",60,"3/5"],["Recovery",40,"2/5"]].map(x=><div className="bar-row" key={x[0]}><span>{x[0]}</span><div><i style={{width:`${x[1]}%`}}/></div><b>{x[2]}</b></div>)}</div>
        <div className="insight"><div className="sparkbox"><Icon name="spark"/></div><div><small>FREQUENTLY TESTED TOPIC</small><b>Database Normalization</b><p>Appeared in 5 of 5 analyzed papers.</p></div></div>
        <div className="disclaimer">Historical trend · Not a guaranteed prediction</div><Button kind="secondary" onClick={()=>go("Exam Intelligence")}>Explore exam trends</Button>
      </section>
      <section className="card preparation"><div className="section-head"><div><h2>Continue preparation</h2><p>Today's focused plan · 2h 15m</p></div><span className="done">1 of 3 done</span></div>
        {[["Revise Normal Forms","DBMS · 35 min",true],["Practice SQL joins","DBMS · 45 min",false],["Review TCP/IP layers","Networks · 55 min",false]].map(t=><label className="task" key={t[0]}><input type="checkbox" defaultChecked={t[2]}/><span><b>{t[0]}</b><small>{t[1]}</small></span><Icon name="arrow" size={15}/></label>)}
        <div className="next-up"><Icon name="spark"/><div><small>NEXT RECOMMENDED</small><b>Functional Dependencies</b><span>Based on your recent mock score</span></div></div>
        <Button kind="secondary" onClick={()=>go("Study Planner")}>Open study plan</Button>
      </section>
    </div>
    <div className="dashboard-bottom">
      <RecentPapers go={go}/>
      <section className="card recommendations">
        <div className="section-head"><div><h2>Smart recommendations</h2><p>Personalized from your recent activity</p></div><div className="ai-mark"><Icon name="spark" size={15}/></div></div>
        {[
          ["Practice normalization", "Your last mock score was 58%", "High impact", "violet"],
          ["Complete Unit 4", "Two syllabus topics remain", "45 min", "amber"],
          ["Review repeated questions", "3 patterns found in DBMS", "View set", "blue"],
        ].map((item, index) => <button className="recommendation-row" key={item[0]} onClick={() => go(index === 1 ? "Syllabus Explorer" : index === 2 ? "Exam Intelligence" : "Mock Tests")}>
          <span className={`recommendation-icon r${index}`}><Icon name={index === 0 ? "chart" : index === 1 ? "book" : "spark"} size={16}/></span>
          <span><b>{item[0]}</b><small>{item[1]}</small></span>
          <Badge tone={item[3]}>{item[2]}</Badge><Icon name="arrow" size={14}/>
        </button>)}
        <div className="recommendation-note"><Icon name="spark" size={14}/><span>Recommendations use your progress and historical data—not future exam predictions.</span></div>
      </section>
    </div>
  </div>;
}

function RecentPapers({ go }: { go: (p: Page)=>void }) {
  const { rows } = usePapers();
  return <section className="card papers-card"><div className="section-head"><div><h2>Recently added papers</h2><p>Verified resources from your semester</p></div><button className="text-btn" onClick={()=>go("Question Papers")}>Browse all <Icon name="arrow" size={15}/></button></div>
    <div className="paper-list">{rows.slice(0,3).map(p=><div className="paper-row" key={p[7]}><div className="pdf">PDF</div><div className="paper-name"><b>{p[0]}</b><span>{p[1]} · Semester V</span></div><span>{p[2]}</span><Badge tone="green">Verified</Badge><span>{p[3]}</span><span>{p[4]}</span><button className="icon-btn" onClick={async()=>{const u=await paperUrl(p[6]);if(u)window.open(u,"_blank")}}><Icon name="download"/></button></div>)}</div>
  </section>;
}

function Papers({ go }: { go: (p: Page)=>void }) {
  const [query,setQuery]=useState(""); const [saved,setSaved]=useState<string[]>([]); const [selected,setSelected]=useState<string|null>(null);
  const { rows } = usePapers();
  const filtered=rows.filter(r=>r.join(" ").toLowerCase().includes(query.toLowerCase()));
  return <div className="page"><PageTitle title="Question Paper Library" sub="Every paper, organized and ready for your next preparation session." action={<Button icon="upload" onClick={()=>go("Analyze Paper")}>Analyze a paper</Button>}/>
    <div className="library-search"><div><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by subject, code or year..."/></div><Button kind="secondary" icon="filter">Filters</Button></div>
    <div className="filters">{["Branch: AI & DS","Semester: V","Subject: All","Year: All","Type: All","File: PDF"].map(x=><button key={x}>{x}<span>⌄</span></button>)}</div>
    <section className="card table-card"><div className="table-top"><b>{filtered.length} question papers</b><span>Sort by <strong>Recently added</strong>⌄</span></div>
      {filtered.length ? filtered.map((r,i)=><div className="library-row" key={r[7]}><div className="pdf big">PDF</div><div className="paper-name"><b>{r[0]}</b><span>{r[1]} · Semester V</span></div><span><small>YEAR</small>{r[2]}</span><span><small>EXAM TYPE</small>{r[3]}</span><span><small>FILE</small>{r[4]} · {r[5]}</span><Badge tone="green">Verified</Badge><button className={`icon-btn ${saved.includes(r[1]+r[2])?"saved":""}`} onClick={()=>setSaved(v=>v.includes(r[1]+r[2])?v.filter(x=>x!==r[1]+r[2]):[...v,r[1]+r[2]])}><Icon name="bookmark"/></button><Button kind="secondary" onClick={()=>setSelected(String(i))}>Preview</Button><button className="icon-btn" onClick={async()=>{const u=await paperUrl(r[6]);if(u)window.open(u,"_blank")}}><Icon name="download"/></button></div>):<div className="empty"><Icon name="search" size={32}/><h3>No papers found</h3><p>Try removing a filter or searching a different subject.</p><Button onClick={()=>setQuery("")}>Clear search</Button></div>}
    </section>
    {selected && <div className="modal-back" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="icon-btn modal-x" onClick={()=>setSelected(null)}><Icon name="close"/></button><div className="pdf-preview"><div>EXAMWISE UNIVERSITY COPY</div><h3>Database Management Systems</h3><p>End-Semester Examination · 2025</p><hr/><b>Q1. Explain functional dependencies with suitable examples. [10]</b><b>Q2. Normalize the given relation to 3NF. [12]</b><b>Q3. Write SQL queries for the following schema. [10]</b></div><div className="modal-info"><Badge tone="green">Verified resource</Badge><h2>Database Management Systems</h2><p>AIML503 · Semester V · 2025</p><div className="meta-grid"><span><small>TYPE</small>End-Semester</span><span><small>PAGES</small>8 pages</span><span><small>SIZE</small>2.4 MB</span><span><small>FORMAT</small>PDF</span></div><h3>Mapped syllabus topics</h3><div className="chips"><Badge>Normalization</Badge><Badge>SQL Queries</Badge><Badge>Transactions</Badge></div><Button icon="download">Download paper</Button></div></div></div>}
  </div>;
}

function PageTitle({title,sub,action}:{title:string;sub:string;action?:React.ReactNode}) {return <div className="page-title"><div><h1>{title}</h1><p>{sub}</p></div>{action}</div>}

function Intelligence({ go }: { go:(p:Page)=>void }) {
 const [topic,setTopic]=useState("Database Normalization");
 const frequencies=[["Database Normalization",5],["SQL Queries",4],["Transactions",3],["ER Modeling",3],["Database Recovery",2]];
 return <div className="page intelligence-page">
  <div className="intelligence-title"><div><div className="title-kicker"><Icon name="spark" size={14}/> FLAGSHIP ANALYTICS</div><h1>Exam Intelligence</h1><p>Turn five years of verified examination papers into evidence-based preparation decisions.</p></div><Button onClick={()=>go("Study Planner")} icon="calendar">Build My Revision Plan</Button></div>
  <div className="intelligence-toolbar">
   <button><small>SUBJECT</small><b>Database Management Systems</b><span>⌄</span></button>
   <button><small>EXAMINATION YEARS</small><b>2021 — 2025</b><span>⌄</span></button>
   <button><small>EXAM TYPE</small><b>All examinations</b><span>⌄</span></button>
   <div className="analysis-status"><span><i/>Analysis up to date</span><b>5 verified papers · 42 questions</b><small>Refreshed today, 09:42 AM</small></div>
   <Button kind="secondary" icon="spark">Refresh</Button>
  </div>
  <div className="evidence-strip">
   <div><small>HISTORICAL DATA</small><b>5</b><span>Papers analyzed</span></div>
   <div><small>MEASURED</small><b>42</b><span>Mapped questions</span></div>
   <div><small>MEASURED</small><b>400</b><span>Total marks reviewed</span></div>
   <div><small>SYLLABUS MAPPING</small><b>86%</b><span>Topics represented</span></div>
   <div className="method-note"><Icon name="check"/><span><b>Evidence-based analysis</b>Statistics are calculated from selected verified papers.</span></div>
  </div>
  <div className="intel-primary">
   <section className="card frequency-card"><div className="section-head"><div><h2>Topic frequency across papers</h2><p>How often each topic appeared in the five selected examinations</p></div><Badge>MEASURED HISTORY</Badge></div>
    <div className="frequency-scale"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 papers</span></div>
    <div className="frequency-bars">{frequencies.map(([name,value])=><button className={topic===name?"selected":""} onClick={()=>setTopic(String(name))} key={name}><span>{name}</span><div><i style={{width:`${Number(value)*20}%`}}/></div><b>{value} / 5</b><Icon name="arrow" size={14}/></button>)}</div>
    <div className="chart-purpose"><Icon name="search" size={14}/><span>Select any topic to inspect its historical appearances and related questions.</span></div>
   </section>
   <section className="card marks-card"><div className="section-head"><div><h2>Unit-wise historical marks</h2><p>Average share of marks across selected papers</p></div><Badge>MEASURED HISTORY</Badge></div>
    <div className="marks-chart"><div className="y-axis"><span>30%</span><span>20%</span><span>10%</span><span>0</span></div><div className="marks-columns">{[["Unit 1",16],["Unit 2",22],["Unit 3",28],["Unit 4",24],["Unit 5",10]].map(([name,value],i)=><button key={name}><b>{value}%</b><i className={i===2?"focus":""} style={{height:`${Number(value)*4}px`}}/><span>{name}</span></button>)}</div></div>
    <div className="marks-summary"><span><i/>Highest historical share</span><b>Unit 3 · Normalization</b><small>28% average · 112 of 400 marks</small></div>
   </section>
  </div>
  <div className="intel-secondary">
   <section className="card topic-drill"><div className="section-head"><div><span className="eyebrow">TOPIC DRILL-DOWN</span><h2>{topic}</h2><p>Measured occurrences in selected papers</p></div><Badge tone="violet">{topic==="Database Normalization"?"5 APPEARANCES":"HISTORICAL"}</Badge></div>
    <div className="year-timeline">{["2021","2022","2023","2024","2025"].map((year,i)=><div className={i===1&&topic==="Database Normalization"?"absent":"present"} key={year}><i/><b>{year}</b><span>{i===1?"Not found":i===4?"12 marks":"8–10 marks"}</span></div>)}</div>
    <div className="drill-question"><span>2025 · 12 marks</span><b>Normalize the given relation to 3NF and explain dependency preservation.</b><button>View paper <Icon name="arrow" size={13}/></button></div>
    <div className="drill-question"><span>2024 · 10 marks</span><b>Explain 2NF and 3NF with suitable examples.</b><button>View paper <Icon name="arrow" size={13}/></button></div>
   </section>
   <section className="card repeated-card"><div className="section-head"><div><h2>Repeated-question detection</h2><p>Semantically similar wording across years</p></div><Badge tone="amber">3 GROUPS</Badge></div>
    <div className="similarity-head"><div className="similarity-ring"><b>92%</b></div><span><b>Normalization question cluster</b><small>2021 · 2023 · 2025 · 10–12 marks</small></span></div>
    {["Explain 2NF and 3NF with examples.","Normalize a relation to Third Normal Form.","Explain dependencies in normalization."].map((q,i)=><button className="similar-question" key={q}><span>{i+1}</span><b>{q}</b><Icon name="arrow" size={14}/></button>)}
    <button className="view-all">View all repeated groups <Icon name="arrow" size={14}/></button>
   </section>
  </div>
  <div className="coverage-insights">
   <section className="card coverage-card"><div className="section-head"><div><h2>Syllabus evidence coverage</h2><p>Topics represented in the selected historical papers</p></div><Badge>86% MAPPED</Badge></div>
    <div className="coverage-bar"><i style={{width:"86%"}}/></div><div className="coverage-legend"><span><i className="mapped"/>18 topics mapped</span><span><i/>3 topics with no mapped question</span></div>
    {[["Database Security","No mapped questions","No uploaded notes"],["Indexing methods","1 appearance","Resources available"],["Distributed databases","No mapped questions","2 notes available"]].map((x,i)=><div className="gap-row" key={x[0]}><span className={`gap-status g${i}`}/><div><b>{x[0]}</b><small>{x[1]} · {x[2]}</small></div><Badge tone={i===1?"blue":"amber"}>{i===1?"LOW FREQUENCY":"COVERAGE GAP"}</Badge></div>)}
    <p className="coverage-warning">Low historical frequency does not mean a syllabus topic is unimportant.</p>
   </section>
   <section className="card insight-card"><div className="section-head"><div><h2>What the history shows</h2><p>Concise findings from the selected dataset</p></div><div className="insight-spark"><Icon name="spark"/></div></div>
    {[["5 of 5","Normalization appeared in every analyzed paper."],["4 of 5","SQL questions appeared in four papers."],["28%","Unit 3 held the largest average marks share."],["3 groups","Similar question wording was detected across years."]].map((x,i)=><div className="evidence-insight" key={x[1]}><span>{i+1}</span><p><b>{x[0]}</b>{x[1]}</p></div>)}
   </section>
  </div>
  <section className="card priority priority-table"><div className="section-head"><div><span className="eyebrow violet-text">ESTIMATED STUDY PRIORITY</span><h2>Topic priority ranking</h2><p>Suggested preparation order combining historical evidence, syllabus progress, and mock performance</p></div><Button onClick={()=>go("Study Planner")} icon="calendar">Build My Revision Plan</Button></div>
   <div className="priority-head"><span>TOPIC</span><span>APPEARANCE</span><span>HISTORICAL MARKS</span><span>YOUR MASTERY</span><span>ESTIMATED PRIORITY</span><span>SUGGESTED ACTION</span></div>
   {[["Database Normalization","5 / 5 papers","48 marks","58%","Very High","Practice 3NF problems"],["SQL Queries","4 / 5 papers","36 marks","88%","High","Review joins & subqueries"],["Transactions","3 / 5 papers","28 marks","76%","High","Review concurrency control"],["Database Recovery","2 / 5 papers","14 marks","64%","Moderate","Read notes, then practice"]].map((r,row)=><button className="priority-data" key={r[0]} onClick={()=>setTopic(r[0])}>{r.map((x,i)=>i===4?<Badge key={x} tone={x==="Moderate"?"amber":"violet"}>{x}</Badge>:i===3?<span className="mastery-cell" key={x}><i><em style={{width:x}}/></i><b>{x}</b></span>:<span key={x}>{i===0&&<b>{row+1}</b>}{x}</span>)}<Icon name="arrow" size={14}/></button>)}
   <div className="priority-disclaimer"><Icon name="spark" size={14}/><span><b>Study priorities are estimates, not predictions.</b> Past examination patterns and topic rankings do not guarantee future questions. Cover the complete official syllabus.</span></div>
  </section>
 </div>
}

function Syllabus() {
 const [unit,setUnit]=useState(2); const units=["Introduction to Database Systems","Relational Model and SQL","Functional Dependencies and Normalization","Transactions and Concurrency Control","Database Recovery and Security"];
 return <div className="page"><PageTitle title="Syllabus Explorer" sub="Understand what to study and connect topics to previous examinations."/>
 <div className="syllabus-head card"><div><small>SELECTED SUBJECT</small><h2>Database Management Systems <Badge>AIML503</Badge></h2><p>5 units · 42 mapped questions · 24 papers</p></div><div className="coverage"><div><b>68%</b><span>Syllabus complete</span></div><Progress value={68}/></div></div>
 <div className="unit-layout"><div className="units">{units.map((u,i)=><section className={`unit card ${unit===i?"expanded":""}`} key={u}><button onClick={()=>setUnit(unit===i?-1:i)}><span className="unit-num">{i+1}</span><div><small>UNIT {i+1}</small><h3>{u}</h3><p>{[6,11,9,8,8][i]} mapped questions · {[12,20,24,26,18][i]}% historical marks</p></div><Badge tone={i<2?"green":"blue"}>{i<2?"Completed":i===2?"In progress":"Not started"}</Badge><span className="chev">⌄</span></button>{unit===i&&<div className="topics">{["Functional Dependencies","Normal Forms: 1NF, 2NF, 3NF","BCNF and Decomposition"].map((t,j)=><div className="topic" key={t}><label><input type="checkbox" defaultChecked={j===0}/></label><div><b>{t}</b><span>Appeared in {5-j} papers · 2021, 2023, 2024, 2025</span></div><div className="chips"><Badge>{5-j} questions</Badge><Badge tone="green">{j+1} notes</Badge></div><Button kind="secondary">Practice</Button></div>)}</div>}</section>)}</div><aside className="card unit-info"><Badge tone="violet">CURRENT FOCUS</Badge><h2>Unit 3</h2><h3>Functional Dependencies and Normalization</h3><div><span>Estimated revision</span><b>3h 30m</b></div><div><span>Mapped questions</span><b>9 questions</b></div><div><span>Historical marks</span><b>24%</b></div><hr/><p>Prioritize practice problems after reviewing normal forms. Historical frequency is not a prediction.</p><Button>Start unit practice</Button></aside></div></div>
}

function Analyzer() {
 const [step,setStep]=useState<"upload"|"processing"|"results">("upload");
 const upload=()=>{setStep("processing");setTimeout(()=>setStep("results"),1800)};
 return <div className="page"><PageTitle title="Analyze a Question Paper" sub="Upload a PDF to extract questions, map topics, and compare historical patterns."/>
 <div className="steps">{["Upload paper","Extract & map","Review questions","View insights"].map((s,i)=><div className={(step==="upload"?0:step==="processing"?1:3)>=i?"active":""} key={s}><span>{i+1}</span><b>{s}</b></div>)}</div>
 {step==="upload"&&<><div className="upload-zone" onClick={upload}><div><Icon name="upload" size={30}/></div><h2>Drop your question paper here</h2><p>or click to browse from your device</p><Button>Browse PDF files</Button><small>PDF only · Maximum 20 MB · Scanned papers supported</small></div><div className="workflow">{["Extract questions from PDF","Identify marks and structure","Map to syllabus topics","Compare historical papers","Generate analytical insights"].map((x,i)=><div key={x}><span>{i+1}</span><b>{x}</b><Icon name="arrow" size={14}/></div>)}</div></>}
 {step==="processing"&&<div className="processing card"><div className="scan"><div className="paper-scan"/><i/></div><Badge tone="violet">AI ANALYSIS IN PROGRESS</Badge><h2>Reading your question paper...</h2><p>Mapping extracted questions to the DBMS syllabus</p><Progress value={64} violet/><div className="process-list"><span className="complete"><Icon name="check"/>PDF uploaded</span><span className="complete"><Icon name="check"/>12 questions extracted</span><span><i/>Mapping syllabus topics...</span><span>Comparing historical papers</span></div></div>}
 {step==="results"&&<><div className="success-banner"><Icon name="check"/><div><b>Analysis complete</b><span>12 questions extracted with 94% confidence. Two items need your review.</span></div><Button kind="secondary" icon="download">Download report</Button></div><div className="metrics">{[["12","Questions extracted","2 need review"],["80","Total marks","Fully identified"],["5","Units mapped","Complete syllabus"],["3","Repeated matches","Across 2021–25"]].map((m,i)=><div className="metric" key={m[1]}><div className={`metric-icon c${i}`}><Icon name={["file","check","book","spark"][i]}/></div><div><strong>{m[0]}</strong><span>{m[1]}</span><small>{m[2]}</small></div></div>)}</div><section className="card review"><div className="section-head"><div><h2>Review extracted questions</h2><p>Correct mappings before saving the report</p></div><Badge tone="amber">2 NEED REVIEW</Badge></div>{["Explain 2NF and 3NF with suitable examples. [10]","Write SQL queries for the given employee schema. [8]","Describe two-phase locking protocol. [10]"].map((q,i)=><div className="review-row" key={q}><span>Q{i+1}</span><div><b>{q}</b><Badge tone={i===1?"amber":"blue"}>{i===1?"Review mapping": ["Normalization","Transactions"][i/2]}</Badge></div><Button kind="ghost">Edit</Button></div>)}</section></>}
 </div>
}

function MockTests() {
 const { displayName } = useAuth(); const [mode,setMode]=useState<"config"|"test"|"result">("config"); const [answer,setAnswer]=useState<number|null>(null);
 if(mode==="test") return <div className="test-screen"><div className="test-top"><div><Badge>DBMS MOCK TEST</Badge><b>Historical Pattern Practice</b></div><div className="timer"><Icon name="clock"/> 38:24</div><Button kind="secondary" onClick={()=>setMode("result")}>Submit test</Button></div><div className="test-body"><main className="question-panel"><span>Question 1 of 20 · 2 marks</span><h2>Which normal form removes partial dependency from a relation?</h2><div className="answers">{["First Normal Form (1NF)","Second Normal Form (2NF)","Third Normal Form (3NF)","Boyce-Codd Normal Form"].map((a,i)=><button className={answer===i?"selected":""} onClick={()=>setAnswer(i)} key={a}><span>{String.fromCharCode(65+i)}</span>{a}</button>)}</div><div className="question-actions"><Button kind="secondary">Mark for review</Button><Button>Save & next</Button></div></main><aside className="palette"><h3>Question palette</h3><p><i className="answered"/> Answered <i/> Not answered</p><div>{Array.from({length:20},(_,i)=><button className={i===0?"current":i<4?"answered":""} key={i}>{i+1}</button>)}</div><Progress value={20}/><span>4 of 20 answered</span></aside></div></div>
 if(mode==="result") return <div className="page"><PageTitle title="Mock Test Results" sub="Database Management Systems · Historical Pattern Practice"/><div className="result-hero card"><div className="score-ring"><b>76%</b><span>61 / 80</span></div><div><Badge tone="green">GOOD PROGRESS</Badge><h1>Strong attempt, {displayName.split(" ")[0]}.</h1><p>You performed well in SQL Queries. Review normalization before your next attempt.</p><div className="result-stats"><span><b>15</b>Correct</span><span><b>4</b>Incorrect</span><span><b>1</b>Skipped</span><span><b>41m</b>Time taken</span></div></div><Button onClick={()=>setMode("config")}>Retake test</Button></div><section className="card"><div className="section-head"><div><h2>Topic-wise performance</h2><p>Focus on the areas with the most room to improve</p></div></div><div className="performance-bars">{[["SQL Queries",88],["Transactions",80],["ER Modeling",75],["Normalization",58],["Recovery",50]].map(x=><div key={x[0]}><span>{x[0]}</span><Progress value={Number(x[1])}/><b>{x[1]}%</b></div>)}</div></section></div>
 return <div className="page"><PageTitle title="Practice with Purpose" sub="Generate focused mock tests from syllabus topics and historical examination patterns."/>
 <div className="config-grid"><section className="card config"><h2>Configure your test</h2><div className="mode-cards"><button className="selected"><Icon name="file"/><b>Previous Paper Practice</b><span>Attempt a complete past paper</span></button><button><Icon name="spark"/><b>Historical Pattern-Based</b><span>Balanced from past trends</span></button></div><div className="form-grid">{["Subject|Database Management Systems","Syllabus units|All 5 units","Questions|20 questions","Difficulty|Mixed difficulty","Total marks|80 marks","Duration|60 minutes"].map(x=>{const [a,b]=x.split("|");return <label key={a}><span>{a}</span><button>{b}⌄</button></label>})}</div><label className="types"><span>Question types</span><div><Badge>Multiple choice</Badge><Badge>Short answer</Badge><Badge>Long answer</Badge></div></label><Button onClick={()=>setMode("test")} icon="spark">Generate test preview</Button></section><aside className="card preview-paper"><div className="paper-head"><Icon name="book"/><b>ExamWise AI</b><span>MOCK TEST PREVIEW</span></div><h2>Database Management Systems</h2><p>20 questions · 80 marks · 60 minutes</p><hr/>{["Section A · Multiple Choice","Section B · Short Answer","Section C · Long Answer"].map((x,i)=><div className="preview-section" key={x}><b>{x}</b><span>{[10,6,4][i]} questions · {[20,24,36][i]} marks</span></div>)}<div className="disclaimer">Generated for practice from historical patterns. Not a prediction of future papers.</div></aside></div></div>
}

function Planner() {
 const [done,setDone]=useState([true,false,false,false]); const tasks=[["Revise Normal Forms","DBMS","35 min","High"],["Practice SQL joins","DBMS","45 min","High"],["Review TCP/IP layers","Networks","55 min","Medium"],["Solve greedy algorithms","DAA","40 min","Revision"]];
 return <div className="page"><PageTitle title="Your Personal Study Plan" sub="A realistic revision schedule built around your syllabus and available time." action={<Button kind="secondary">Reschedule my plan</Button>}/>
 <div className="planner-metrics"><div className="plan-progress card"><div className="ring small"><b>68%</b></div><div><small>OVERALL SYLLABUS</small><h2>Good momentum</h2><p>You're 8% ahead of last week.</p></div></div>{[["9.5h","Study hours","this week"],["14","Topics remaining","across 6 subjects"],["12 / 18","Tasks completed","this week"],["Tomorrow","Next revision","Normalization · 9 AM"]].map(x=><div className="card plan-stat" key={x[1]}><strong>{x[0]}</strong><b>{x[1]}</b><span>{x[2]}</span></div>)}</div>
 <div className="planner-layout"><section className="card calendar-card"><div className="section-head"><div><h2>December 8–14</h2><p>Your weekly revision schedule</p></div><div><button className="icon-btn">‹</button><button className="icon-btn">›</button></div></div><div className="week">{["MON 8","TUE 9","WED 10","THU 11","FRI 12","SAT 13","SUN 14"].map((d,i)=><div className={i===2?"today":""} key={d}><b>{d.split(" ")[0]}</b><span>{d.split(" ")[1]}</span><i>{[2,3,2,3,2,4,1][i]} tasks</i><div className={`dot d${i}`}/></div>)}</div><div className="day-focus"><small>WEDNESDAY · TODAY</small><h3>Focus: Database fundamentals</h3><p>2h 15m planned · 3 tasks</p></div></section><section className="card task-list"><div className="section-head"><div><h2>Today's tasks</h2><p>One step at a time</p></div><Badge tone="green">{done.filter(Boolean).length} DONE</Badge></div>{tasks.map((t,i)=><label className={`task ${done[i]?"completed":""}`} key={t[0]}><input type="checkbox" checked={done[i]} onChange={()=>setDone(x=>x.map((v,j)=>j===i?!v:v))}/><span><b>{t[0]}</b><small>{t[1]} · {t[2]}</small></span><Badge tone={t[3]==="High"?"violet":t[3]==="Medium"?"amber":"blue"}>{t[3]}</Badge><Button kind="ghost">Start</Button></label>)}</section></div></div>
}

function Performance() {return <div className="page"><PageTitle title="Performance Analytics" sub="Understand your progress and choose the right next step."/><div className="metrics">{[["74%","Mock test average","+6% across 3 tests"],["8","Tests attempted","2 this month"],["82%","Best subject","Software Engineering"],["61%","Focus area","Normalization"]].map((m,i)=><div className="metric" key={m[1]}><div className={`metric-icon c${i}`}><Icon name="chart"/></div><div><strong>{m[0]}</strong><span>{m[1]}</span><small>{m[2]}</small></div></div>)}</div><div className="intel-grid"><section className="card"><div className="section-head"><div><h2>Score improvement</h2><p>Last six mock tests</p></div><Badge tone="green">+18%</Badge></div><div className="line-chart"><svg viewBox="0 0 600 190"><path d="M20 150 L130 128 L240 135 L350 93 L460 75 L575 48" fill="none" stroke="#4169e1" strokeWidth="4"/>{[[20,150],[130,128],[240,135],[350,93],[460,75],[575,48]].map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="6" fill="white" stroke="#4169e1" strokeWidth="4"/>)}</svg><div>{["Test 1","Test 2","Test 3","Test 4","Test 5","Test 6"].map(x=><span key={x}>{x}</span>)}</div></div></section><section className="card"><div className="section-head"><div><h2>Unit-wise accuracy</h2><p>Database Management Systems</p></div></div><div className="performance-bars">{[["Unit 1",82],["Unit 2",88],["Unit 3",58],["Unit 4",76],["Unit 5",64]].map(x=><div key={x[0]}><span>{x[0]}</span><Progress value={Number(x[1])}/><b>{x[1]}%</b></div>)}</div></section></div><div className="success-banner insight-banner"><Icon name="spark"/><div><b>You're building momentum</b><span>You consistently perform well in SQL queries. Your normalization scores improved from 44% to 58% across the last three attempts.</span></div><Button kind="secondary">Practice weak topics</Button></div></div>}

function Community() {const { displayName, initials } = useAuth(); return <div className="page"><PageTitle title="Community Contributions" sub="Share verified resources and help your classmates prepare better." action={<Button icon="plus">New contribution</Button>}/><div className="community-grid"><section className="card contribution-form"><h2>Submit a resource</h2><p>Every upload is reviewed before it receives verified status.</p>{["Subject · Database Management Systems","Semester · V","Resource type · Question paper","Examination year · 2025"].map(x=><button key={x}>{x}<span>⌄</span></button>)}<div className="mini-upload"><Icon name="upload"/><span>Drop PDF or notes here</span></div><label><span>Description</span><textarea placeholder="Add context about this resource..."/></label><Button>Submit for review</Button></section><section className="card"><div className="contributor"><div className="avatar large">{initials}</div><div><Badge tone="violet">TRUSTED CONTRIBUTOR</Badge><h2>{displayName}</h2><p>Helping AI & DS students prepare smarter.</p></div></div><div className="result-stats"><span><b>12</b>Uploads</span><span><b>9</b>Verified</span><span><b>184</b>Downloads</span></div><h3>Contribution history</h3>{[["DBMS End-Sem 2025","Verified","green"],["ML Unit 2 Notes","Pending Review","amber"],["CN Mid-Sem 2024","Needs Correction","red"]].map(x=><div className="history" key={x[0]}><div className="pdf">PDF</div><span><b>{x[0]}</b><small>Submitted Dec 8</small></span><Badge tone={x[2]}>{x[1]}</Badge></div>)}</section></div></div>}

function Generic({page}:{page:Page}) {return <div className="page"><PageTitle title={page} sub="Everything you need, organized in one place."/><div className="empty card"><Icon name={page==="Notifications"?"bell":"settings"} size={34}/><h2>{page}</h2><p>This area is ready for your personalized content and preferences.</p><Button>Explore options</Button></div></div>}

export default function App() {
 const [page,setPage]=useState<Page>("Dashboard"); const [menu,setMenu]=useState(false);
 const content=useMemo(()=>{if(page==="Dashboard")return <Dashboard go={setPage}/>;if(page==="Question Papers")return <Papers go={setPage}/>;if(page==="Syllabus Explorer")return <Syllabus/>;if(page==="Exam Intelligence")return <Intelligence go={setPage}/>;if(page==="Analyze Paper")return <Analyzer/>;if(page==="Mock Tests")return <MockTests/>;if(page==="Study Planner")return <Planner/>;if(page==="Performance Analytics")return <Performance/>;if(page==="Community Contributions")return <Community/>;return <Generic page={page}/>},[page]);
 return <div className="app"><Sidebar page={page} go={setPage} open={menu} close={()=>setMenu(false)}/>{menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}<div className="main"><Header page={page} menu={()=>setMenu(true)}/>{content}</div><MobileNav page={page} go={setPage} more={()=>setMenu(true)}/></div>
}
