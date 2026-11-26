
"use client";

import { useState } from "react";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Activity,
  Settings, Search, Bell, Plus, ArrowUpRight, ArrowDownRight,
  Clock, MoreHorizontal, CalendarDays, Menu, X
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Projects", icon: FolderKanban },
  { label: "My Tasks", icon: CheckSquare },
  { label: "Team", icon: Users },
  { label: "Activity", icon: Activity },
];

const projects = [
  { name: "Website Redesign", category: "Design", progress: 78, tasks: "24/31", color: "violet", deadline: "Dec 12" },
  { name: "Mobile Application", category: "Development", progress: 42, tasks: "18/43", color: "blue", deadline: "Dec 18" },
  { name: "Marketing Campaign", category: "Marketing", progress: 91, tasks: "33/36", color: "emerald", deadline: "Dec 05" },
  { name: "Product Launch", category: "Product", progress: 24, tasks: "8/34", color: "orange", deadline: "Dec 22" },
];

const tasks = [
  { title: "Finalize homepage wireframes", project: "Website Redesign", assignee: "SC", status: "In Progress", priority: "High", date: "Nov 27" },
  { title: "Review API architecture", project: "Mobile Application", assignee: "AK", status: "Review", priority: "Medium", date: "Nov 28" },
  { title: "Prepare campaign assets", project: "Marketing Campaign", assignee: "JD", status: "Completed", priority: "Low", date: "Nov 25" },
  { title: "Set up CI/CD pipeline", project: "Mobile Application", assignee: "SC", status: "In Progress", priority: "High", date: "Nov 29" },
];

const activities = [
  { name: "Sarah Chen", initials: "SC", action: "completed a task", target: "Design homepage mockups", time: "12 minutes ago" },
  { name: "Alex Kumar", initials: "AK", action: "created a project", target: "Mobile Application", time: "1 hour ago" },
  { name: "Jessica Davis", initials: "JD", action: "commented on", target: "Marketing Campaign", time: "3 hours ago" },
  { name: "Michael Lee", initials: "ML", action: "updated task status", target: "API Integration", time: "5 hours ago" },
];

const colorMap: Record<string, string> = {
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  orange: "bg-orange-500",
};

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const filteredTasks = tasks.filter((task =>
    `${task.title} ${task.project} ${task.status}`.toLowerCase().includes(search.toLowerCase())
  ));

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {mobileMenu && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileMenu(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">W</div>
          <span className="text-lg font-bold tracking-tight">WorkSphere</span>
          <button className="ml-auto lg:hidden" onClick={() => setMobileMenu(false)}><X size={20}/></button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.5px] text-slate-400">Workspace</p>
          <div className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeNav === item.label;
              return (
                <button key={item.label} onClick={() => {setActiveNav(item.label);setMobileMenu(false);}} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <Icon size={18}/>
                  {item.label}
                  {item.label === "My Tasks" && <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">8</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pt-8">
          <div className="mb-3 flex items-center justify-between px-3">
            <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-400">Your projects</p>
            <button className="text-slate-400 hover:text-indigo-600"><Plus size={16}/></button>
          </div>
          {projects.map((project) => (
            <button key={project.name} onClick={() => setActiveNav("Projects")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50">
              <span className={`h-2 w-2 rounded-full ${colorMap[project.color]}`}/>
              <span className="truncate">{project.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto p-4">
          <div className="mb-3 rounded-2xl bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-900">Upgrade your workspace</p>
            <p className="mt-1 text-xs leading-5 text-indigo-700">Unlock advanced workflows and insights.</p>
            <button className="mt-3 text-xs font-semibold text-indigo-700">Explore plans →</button>
          </div>
          <button onClick={() => setActiveNav("Settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50">
            <Settings size={18}/> Settings
          </button>
          <div className="mt-2 flex items-center gap-3 border-t border-slate-100 px-2 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">SH</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Shan Sundaram</p>
              <p className="text-xs text-slate-400">Workspace Admin</p>
            </div>
            <MoreHorizontal className="ml-auto text-slate-400" size={18}/>
          </div>
        </div>
      </aside>

      <main className="lg:ml-[250px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileMenu(true)}><Menu size={20}/></button>
            <div>
              <p className="text-sm font-semibold">{activeNav}</p>
              <p className="hidden text-xs text-slate-400 sm:block">Workspace / {activeNav}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
              <Search size={16} className="text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="w-32 bg-transparent text-sm outline-none placeholder:text-slate-400 md:w-44"/>
              <kbd className="rounded border bg-white px-1.5 text-[10px] text-slate-400">⌘K</kbd>
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <Bell size={18}/>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"/>
            </button>
            <button className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:flex"><Plus size={16}/> Create New</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] p-5 md:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Thursday, November 26, 2026</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-[28px]">Good morning, Shan 👋</h1>
              <p className="mt-1 text-sm text-slate-500">Here’s what’s happening across your workspace today.</p>
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm"><CalendarDays size={16}/> This week</button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {label:"Total Projects",value:"12",change:"+2 this month",up:true,icon:FolderKanban},
              {label:"Tasks Completed",value:"128",change:"+18% vs last month",up:true,icon:CheckSquare},
              {label:"Team Members",value:"24",change:"+3 new members",up:true,icon:Users},
              {label:"Overdue Tasks",value:"7",change:"3 due today",up:false,icon:Clock},
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Icon size={17}/></span>
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-tight">{stat.value}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    {stat.up ? <ArrowUpRight size={14} className="text-emerald-600"/> : <ArrowDownRight size={14} className="text-rose-600"/>}
                    <span className={stat.up ? "text-emerald-600" : "text-rose-600"}>{stat.change}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div><h2 className="font-semibold">Projects Overview</h2><p className="mt-1 text-xs text-slate-400">Track progress across active projects</p></div>
                <button onClick={() => setActiveNav("Projects")} className="text-xs font-semibold text-indigo-600">View all →</button>
              </div>
              <div className="space-y-5">
                {projects.map(project => (
                  <div key={project.name}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-9 w-9 rounded-xl ${colorMap[project.color]} flex items-center justify-center text-xs font-bold text-white`}>{project.name.substring(0,1)}</span>
                        <div><p className="text-sm font-semibold">{project.name}</p><p className="text-xs text-slate-400">{project.category} · {project.tasks} tasks</p></div>
                      </div>
                      <span className="text-sm font-semibold">{project.progress}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${colorMap[project.color]}`} style={{width:`${project.progress}%`}}/>
                    </div>
                    <p className="mt-2 text-right text-xs text-slate-400">Due {project.deadline}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div><h2 className="font-semibold">Recent Activity</h2><p className="mt-1 text-xs text-slate-400">Latest workspace updates</p></div>
                <button onClick={() => setActiveNav("Activity")} className="text-xs font-semibold text-indigo-600">View all →</button>
              </div>
              <div className="space-y-5">
                {activities.map((activity,i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{activity.initials}</div>
                    <div className="min-w-0">
                      <p className="text-sm leading-5"><span className="font-semibold">{activity.name}</span> <span className="text-slate-500">{activity.action}</span> <span className="font-medium">{activity.target}</span></p>
                      <p className="mt-1 text-xs text-slate-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 md:p-6">
              <div><h2 className="font-semibold">My Tasks</h2><p className="mt-1 text-xs text-slate-400">Your latest assigned work</p></div>
              <button onClick={() => setActiveNav("My Tasks")} className="text-xs font-semibold text-indigo-600">View all tasks →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-400">
                  <tr><th className="px-6 py-3 font-medium">Task</th><th className="px-6 py-3 font-medium">Project</th><th className="px-6 py-3 font-medium">Assignee</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Priority</th><th className="px-6 py-3 font-medium">Due date</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task,i) => (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-medium">{task.title}</td>
                      <td className="px-6 py-4 text-slate-500">{task.project}</td>
                      <td className="px-6 py-4"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold">{task.assignee}</span></td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${task.status === "Completed" ? "bg-emerald-50 text-emerald-700" : task.status === "Review" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{task.status}</span></td>
                      <td className="px-6 py-4"><span className={`text-xs font-medium ${task.priority === "High" ? "text-rose-600" : task.priority === "Medium" ? "text-amber-600" : "text-slate-400"}`}>{task.priority}</span></td>
                      <td className="px-6 py-4 text-slate-500">{task.date}</td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No tasks match your search.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="py-7 text-center text-xs text-slate-400">© 2026 WorkSphere · Built for teams that do great work.</footer>
        </div>
      </main>
    </div>
  );
}
