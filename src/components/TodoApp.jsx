import { useState, useRef, useEffect } from "react";
import {
  Plus, Trash2, Check, ClipboardList, Search, CalendarDays,
  Briefcase, User, ShoppingBag, HeartPulse, LayoutList, X,
} from "lucide-react";

/* ---------- constants ---------- */
const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-400", on: "bg-emerald-500 text-white" },
  medium: { label: "ปานกลาง", badge: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-400", on: "bg-amber-500 text-white" },
  high: { label: "สูง", badge: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500", on: "bg-rose-500 text-white" },
};
const ORDER = ["low", "medium", "high"];

const CATEGORIES = {
  work: { label: "งาน", icon: Briefcase, chip: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  personal: { label: "ส่วนตัว", icon: User, chip: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  shopping: { label: "ช้อปปิ้ง", icon: ShoppingBag, chip: "bg-pink-50 text-pink-700", dot: "bg-pink-500" },
  health: { label: "สุขภาพ", icon: HeartPulse, chip: "bg-teal-50 text-teal-700", dot: "bg-teal-500" },
};
const CAT_KEYS = Object.keys(CATEGORIES);

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

/* ---------- date helpers (local time, YYYY-MM-DD) ---------- */
const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => fmtDate(new Date());
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return fmtDate(d);
};
const showDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};

function dueBadge(todo, today) {
  if (!todo.due) return null;
  if (todo.done) return { text: showDate(todo.due), cls: "bg-slate-100 text-slate-500" };
  if (todo.due < today) return { text: `เลยกำหนด ${showDate(todo.due)}`, cls: "bg-rose-100 text-rose-700" };
  if (todo.due === today) return { text: "ครบกำหนดวันนี้", cls: "bg-yellow-100 text-yellow-800" };
  return { text: showDate(todo.due), cls: "bg-slate-100 text-slate-600" };
}

let nextId = 7;

/* ---------- donut chart ---------- */
function Donut({ segments, total, percent }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`เสร็จแล้ว ${percent}%`}>
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="14" className="stroke-slate-100" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.key}
                cx="50" cy="50" r={R} fill="none" strokeWidth="14"
                className={s.stroke}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return s.value > 0 ? el : null;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-800">{percent}%</span>
        <span className="text-[11px] text-slate-500">เสร็จแล้ว</span>
      </div>
    </div>
  );
}

/* ---------- main component ---------- */
export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high", category: "work", due: addDays(-2), removing: false },
    { id: 2, text: "นัดประชุมทีมการตลาด", done: false, priority: "medium", category: "work", due: todayStr(), removing: false },
    { id: 3, text: "ซื้อผักและผลไม้", done: true, priority: "low", category: "shopping", due: addDays(-1), removing: false },
    { id: 4, text: "จองคิวตรวจสุขภาพประจำปี", done: false, priority: "medium", category: "health", due: addDays(5), removing: false },
    { id: 5, text: "โทรหาคุณแม่", done: false, priority: "low", category: "personal", due: "", removing: false },
    { id: 6, text: "วิ่ง 5 กิโลเมตร", done: true, priority: "low", category: "health", due: "", removing: false },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("work");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const editRef = useRef(null);
  const today = todayStr();

  useEffect(() => {
    if (editingId !== null && editRef.current) editRef.current.focus();
  }, [editingId]);

  /* actions */
  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((t) => [{ id: nextId++, text: value, done: false, priority, category, due, removing: false }, ...t]);
    setText("");
    setDue("");
  };
  const toggle = (id) => setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const remove = (id) => {
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, removing: true } : x)));
    setTimeout(() => setTodos((t) => t.filter((x) => x.id !== id)), 300);
  };
  const cyclePriority = (id) =>
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, priority: ORDER[(ORDER.indexOf(x.priority) + 1) % 3] } : x)));
  const startEdit = (todo) => { setEditingId(todo.id); setEditText(todo.text); };
  const saveEdit = () => {
    if (editingId === null) return;
    const value = editText.trim();
    if (value) setTodos((t) => t.map((x) => (x.id === editingId ? { ...x, text: value } : x)));
    setEditingId(null);
  };
  const clearCompleted = () => todos.filter((t) => t.done && !t.removing).forEach((t) => remove(t.id));

  /* derived */
  const live = todos.filter((t) => !t.removing);
  const total = live.length;
  const doneCount = live.filter((t) => t.done).length;
  const overdueCount = live.filter((t) => !t.done && t.due && t.due < today).length;
  const activeCount = total - doneCount - overdueCount;
  const remaining = total - doneCount;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const catCount = (k) => live.filter((t) => t.category === k).length;

  const q = query.trim().toLowerCase();
  const visible = todos.filter(
    (t) =>
      (filter === "all" || (filter === "active" ? !t.done : t.done)) &&
      (catFilter === "all" || t.category === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  );
  const isFiltered = q || catFilter !== "all";
  const emptyText = isFiltered
    ? "ไม่พบงานที่ตรงกับเงื่อนไข"
    : filter === "completed"
    ? "ยังไม่มีงานที่เสร็จ"
    : filter === "active"
    ? "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!"
    : "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย";

  const segments = [
    { key: "done", label: "เสร็จแล้ว", value: doneCount, stroke: "stroke-emerald-500", dot: "bg-emerald-500" },
    { key: "active", label: "กำลังทำ", value: activeCount, stroke: "stroke-indigo-500", dot: "bg-indigo-500" },
    { key: "overdue", label: "เลยกำหนด", value: overdueCount, stroke: "stroke-rose-500", dot: "bg-rose-500" },
  ];

  return (
    <div
      className="min-h-screen bg-slate-100 px-4 py-8 sm:py-12"
      style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', 'Tahoma', system-ui, sans-serif" }}
    >
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800 sm:text-3xl">รายการงานที่ต้องทำ</h1>

        <div className="space-y-4 lg:grid lg:grid-cols-[230px_1fr] lg:items-start lg:gap-x-6 lg:gap-y-4 lg:space-y-0">
          {/* Category filter */}
          <nav className="lg:col-start-1 lg:row-start-1">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:rounded-2xl lg:bg-white lg:p-2 lg:shadow-md">
              {[{ key: "all", label: "ทุกหมวดหมู่", icon: LayoutList, count: total }].concat(
                CAT_KEYS.map((k) => ({ key: k, label: CATEGORIES[k].label, icon: CATEGORIES[k].icon, count: catCount(k) }))
              ).map((c) => {
                const Icon = c.icon;
                const active = catFilter === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setCatFilter(c.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors lg:w-full ${
                      active
                        ? "bg-indigo-600 text-white shadow lg:shadow-none"
                        : "bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:bg-transparent lg:shadow-none"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="flex-1 text-left">{c.label}</span>
                    <span className={`rounded-full px-2 text-xs font-medium ${active ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main column */}
          <main className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {/* Add form */}
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  placeholder="เพิ่มงานใหม่..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={addTodo}
                  disabled={!text.trim()}
                  aria-label="เพิ่มงาน"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">ความสำคัญ</span>
                  <div className="flex gap-1.5">
                    {ORDER.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`rounded-full px-3 py-1 text-sm transition-colors ${
                          priority === p ? PRIORITIES[p].on : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {PRIORITIES[p].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  หมวดหมู่
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
                  >
                    {CAT_KEYS.map((k) => (
                      <option key={k} value={k}>{CATEGORIES[k].label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays size={16} />
                  กำหนดส่ง
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
                  />
                </label>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-xl border border-transparent bg-white py-2.5 pl-10 pr-10 text-slate-800 shadow-md outline-none placeholder:text-slate-400 focus:border-indigo-400"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-lg py-2 text-sm font-medium transition-all ${
                    filter === f.key ? "bg-white text-indigo-700 shadow" : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            <ul className="space-y-2.5">
              {visible.length === 0 && (
                <li className="flex flex-col items-center gap-2 rounded-2xl bg-white px-6 py-10 text-center text-slate-500 shadow-md">
                  <ClipboardList size={32} className="text-slate-300" />
                  {emptyText}
                </li>
              )}

              {visible.map((todo) => {
                const p = PRIORITIES[todo.priority];
                const cat = CATEGORIES[todo.category];
                const CatIcon = cat.icon;
                const badge = dueBadge(todo, today);
                return (
                  <li
                    key={todo.id}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      todo.removing ? "max-h-0 -translate-x-6 opacity-0" : "max-h-40 translate-x-0 opacity-100"
                    }`}
                  >
                    <div className="flex items-start gap-3 rounded-2xl bg-white py-3 pr-3 shadow-md">
                      <span className={`mt-0.5 h-10 w-1.5 shrink-0 rounded-r-full ${p.bar}`} />

                      <button
                        onClick={() => toggle(todo.id)}
                        role="checkbox"
                        aria-checked={todo.done}
                        aria-label="ทำเครื่องหมายว่าเสร็จแล้ว"
                        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                          todo.done ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 hover:border-indigo-400"
                        }`}
                      >
                        {todo.done && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {editingId === todo.id ? (
                          <input
                            ref={editRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            onBlur={saveEdit}
                            className="w-full rounded-lg border border-indigo-300 px-2 py-1 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => startEdit(todo)}
                            title="ดับเบิลคลิกเพื่อแก้ไข"
                            className={`block cursor-text select-none break-words pt-0.5 ${
                              todo.done ? "text-slate-400 line-through" : "text-slate-800"
                            }`}
                          >
                            {todo.text}
                          </span>
                        )}

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => cyclePriority(todo.id)}
                            title="คลิกเพื่อเปลี่ยนความสำคัญ"
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                          >
                            {p.label}
                          </button>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.chip}`}>
                            <CatIcon size={12} />
                            {cat.label}
                          </span>
                          {badge && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                              <CalendarDays size={12} />
                              {badge.text}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => remove(todo.id)}
                        aria-label="ลบงาน"
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            {total > 0 && (
              <div className="flex items-center justify-between px-1 text-sm text-slate-600">
                <span>เหลืออีก {remaining} งาน</span>
                <button
                  onClick={clearCompleted}
                  disabled={doneCount === 0}
                  className="rounded-lg px-3 py-1.5 font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                >
                  ล้างที่เสร็จแล้ว ({doneCount})
                </button>
              </div>
            )}
          </main>

          {/* Statistics */}
          <section className="rounded-2xl bg-white p-4 shadow-md lg:col-start-1 lg:row-start-2">
            <h2 className="mb-3 font-semibold text-slate-800">สถิติ</h2>
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              <Donut segments={segments} total={total} percent={percent} />
              <div className="flex-1 space-y-1.5 text-sm lg:w-full">
                <div className="mb-2 flex justify-between text-slate-800">
                  <span>งานทั้งหมด</span>
                  <span className="font-bold">{total}</span>
                </div>
                {segments.map((s) => (
                  <div key={s.key} className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข • คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </div>
    </div>
  );
}
