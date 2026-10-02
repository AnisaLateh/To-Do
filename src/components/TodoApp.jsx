import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ClipboardList } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-400", on: "bg-emerald-500 text-white" },
  medium: { label: "ปานกลาง", badge: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-400", on: "bg-amber-500 text-white" },
  high: { label: "สูง", badge: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500", on: "bg-rose-500 text-white" },
};
const ORDER = ["low", "medium", "high"];

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

const EMPTY_TEXT = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย",
  active: "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!",
  completed: "ยังไม่มีงานที่เสร็จ",
};

let nextId = 4;

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high", removing: false },
    { id: 2, text: "นัดประชุมทีมวันพฤหัสบดี", done: false, priority: "medium", removing: false },
    { id: 3, text: "ซื้อของเข้าบ้าน", done: true, priority: "low", removing: false },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const editRef = useRef(null);

  useEffect(() => {
    if (editingId !== null && editRef.current) editRef.current.focus();
  }, [editingId]);

  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((t) => [{ id: nextId++, text: value, done: false, priority, removing: false }, ...t]);
    setText("");
  };

  const toggle = (id) => setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const remove = (id) => {
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, removing: true } : x)));
    setTimeout(() => setTodos((t) => t.filter((x) => x.id !== id)), 300);
  };

  const cyclePriority = (id) =>
    setTodos((t) =>
      t.map((x) => (x.id === id ? { ...x, priority: ORDER[(ORDER.indexOf(x.priority) + 1) % 3] } : x))
    );

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    const value = editText.trim();
    if (editingId === null) return;
    if (value) setTodos((t) => t.map((x) => (x.id === editingId ? { ...x, text: value } : x)));
    setEditingId(null);
  };

  const clearCompleted = () => {
    const ids = todos.filter((t) => t.done).map((t) => t.id);
    ids.forEach(remove);
  };

  const remaining = todos.filter((t) => !t.done && !t.removing).length;
  const completedCount = todos.filter((t) => t.done && !t.removing).length;
  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );

  return (
    <div
      className="min-h-screen bg-slate-100 px-4 py-8 sm:py-14"
      style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', 'Tahoma', system-ui, sans-serif" }}
    >
      <div className="mx-auto w-full max-w-xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800 sm:text-3xl">รายการงานที่ต้องทำ</h1>

        {/* Add form */}
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-md">
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

          <div className="mt-3 flex items-center gap-2">
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

        {/* Filter tabs */}
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1">
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
              {EMPTY_TEXT[filter]}
            </li>
          )}

          {visible.map((todo) => {
            const p = PRIORITIES[todo.priority];
            return (
              <li
                key={todo.id}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  todo.removing ? "max-h-0 -translate-x-6 opacity-0" : "max-h-28 translate-x-0 opacity-100"
                }`}
              >
                <div className="flex items-center gap-3 rounded-2xl bg-white p-3 pl-0 shadow-md">
                  <span className={`ml-0 h-10 w-1.5 shrink-0 rounded-r-full ${p.bar}`} />

                  <button
                    onClick={() => toggle(todo.id)}
                    role="checkbox"
                    aria-checked={todo.done}
                    aria-label="ทำเครื่องหมายว่าเสร็จแล้ว"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
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
                        className={`block cursor-text select-none break-words ${
                          todo.done ? "text-slate-400 line-through" : "text-slate-800"
                        }`}
                      >
                        {todo.text}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => cyclePriority(todo.id)}
                    title="คลิกเพื่อเปลี่ยนความสำคัญ"
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                  >
                    {p.label}
                  </button>

                  <button
                    onClick={() => remove(todo.id)}
                    aria-label="ลบงาน"
                    className="shrink-0 rounded-lg p-2 pr-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        {todos.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-1 text-sm text-slate-600">
            <span>เหลืออีก {remaining} งาน</span>
            <button
              onClick={clearCompleted}
              disabled={completedCount === 0}
              className="rounded-lg px-3 py-1.5 font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              ล้างที่เสร็จแล้ว ({completedCount})
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข • คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </div>
    </div>
  );
}
