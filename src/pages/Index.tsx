import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// История показанных анекдотов: ключ — имя (lowercase), значение — список анекдотов
const shownJokes: Record<string, string[]> = {};

const SHAPES = [
  { type: "circle", color: "#FF6B6B", size: 120, top: "5%", left: "3%", anim: "animate-float" },
  { type: "square", color: "#FFE66D", size: 80, top: "8%", right: "6%", anim: "animate-spin-slow" },
  { type: "triangle", color: "#4ECDC4", size: 100, top: "70%", left: "1%", anim: "animate-float-delay" },
  { type: "circle", color: "#A29BFE", size: 60, top: "75%", right: "4%", anim: "animate-float" },
  { type: "square", color: "#FD79A8", size: 50, top: "40%", left: "2%", anim: "animate-wiggle" },
  { type: "circle", color: "#FDCB6E", size: 90, top: "20%", right: "2%", anim: "animate-float-delay" },
  { type: "triangle", color: "#6C5CE7", size: 70, top: "55%", right: "5%", anim: "animate-float" },
  { type: "square", color: "#00B894", size: 65, top: "85%", left: "8%", anim: "animate-spin-slow" },
];

function Shape({ shape }: { shape: typeof SHAPES[0] }) {
  const style: React.CSSProperties = {
    position: "absolute",
    top: shape.top,
    left: "left" in shape ? shape.left : undefined,
    right: "right" in shape ? shape.right : undefined,
    width: shape.size,
    height: shape.size,
    opacity: 0.7,
    zIndex: 0,
  };

  if (shape.type === "circle") {
    return (
      <div
        style={{ ...style, borderRadius: "50%", background: shape.color }}
        className={shape.anim}
      />
    );
  }
  if (shape.type === "square") {
    return (
      <div
        style={{ ...style, borderRadius: 12, background: shape.color, transform: "rotate(15deg)" }}
        className={shape.anim}
      />
    );
  }
  return (
    <div style={{ ...style }} className={shape.anim}>
      <svg viewBox="0 0 100 87" fill={shape.color} xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,0 100,87 0,87" />
      </svg>
    </div>
  );
}

export default function Index() {
  const [name, setName] = useState("");
  const [joke, setJoke] = useState("");
  const [loading, setLoading] = useState(false);
  const [jokeKey, setJokeKey] = useState(0);
  const [hasJoke, setHasJoke] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateJoke = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setHasJoke(false);

    const key = trimmed.toLowerCase();
    const seen = shownJokes[key] ?? [];

    try {
      let newJoke = "";
      let attempts = 0;

      // Пробуем до 3 раз получить непоказанный анекдот
      while (attempts < 3) {
        const res = await fetch("https://functions.poehali.dev/31a85a86-eac0-4b53-829d-ebae165d9655", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed, seen }),
        });
        const data = await res.json();
        newJoke = data.joke || "Что-то пошло не так... как и всё в жизни 💀";

        if (!seen.includes(newJoke)) break;
        attempts++;
      }

      // Сохраняем в историю (последние 40)
      shownJokes[key] = [...seen, newJoke].slice(-40);

      setJoke(newJoke);
      setJokeKey(k => k + 1);
      setHasJoke(true);
    } catch {
      setJoke("Сервер умер от смеха раньше тебя 💀");
      setJokeKey(k => k + 1);
      setHasJoke(true);
    } finally {
      setLoading(false);
    }
  }, [name]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") generateJoke();
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden font-body"
      style={{
        background: "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 25%, #FEE9A0 50%, #A8EDEA 75%, #CEC4FB 100%)",
      }}
    >
      {SHAPES.map((s, i) => (
        <Shape key={i} shape={s} />
      ))}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-10 animate-bounce-in">
          <div className="inline-block mb-4">
            <span className="text-6xl">😂</span>
          </div>
          <h1
            className="font-display text-5xl md:text-7xl mb-3"
            style={{
              color: "#2d3436",
              textShadow: "4px 4px 0px rgba(255,255,255,0.6), 6px 6px 0px rgba(0,0,0,0.1)",
              letterSpacing: "-1px",
            }}
          >
            АнекдотОМАТ
          </h1>
          <p
            className="text-xl md:text-2xl font-body font-700"
            style={{ color: "#636e72", fontWeight: 700 }}
          >
            Введи имя — получи анекдот с тёмной стороной 💀
          </p>
        </div>

        <div
          className="w-full max-w-xl rounded-3xl p-8 relative"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.08)",
            border: "2px solid rgba(255,255,255,0.8)",
          }}
        >
          <label
            className="block text-lg font-body mb-3"
            style={{ color: "#2d3436", fontWeight: 700 }}
          >
            Чьё имя пустим в расход? 🎯
          </label>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Например: Вася"
              maxLength={40}
              className="flex-1 rounded-2xl px-5 py-4 text-lg font-body outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.9)",
                border: "2.5px solid #e0e0e0",
                color: "#2d3436",
                fontWeight: 500,
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.05)",
              }}
              onFocus={e => (e.target.style.borderColor = "#6C5CE7")}
              onBlur={e => (e.target.style.borderColor = "#e0e0e0")}
            />
            <button
              onClick={generateJoke}
              disabled={loading}
              className="rounded-2xl px-6 py-4 font-body text-lg font-700 transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: loading
                  ? "#b2bec3"
                  : "linear-gradient(135deg, #6C5CE7, #a29bfe)",
                color: "#ffffff",
                fontWeight: 800,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 20px rgba(108,92,231,0.4)",
                minWidth: 56,
              }}
            >
              {loading ? (
                <span className="inline-block animate-spin">⚙️</span>
              ) : (
                <Icon name="Zap" size={24} />
              )}
            </button>
          </div>

          {hasJoke && (
            <div
              key={jokeKey}
              className="mt-6 rounded-2xl p-6 animate-joke-in"
              style={{
                background: "linear-gradient(135deg, rgba(108,92,231,0.08), rgba(253,121,168,0.08))",
                border: "2px solid rgba(108,92,231,0.2)",
              }}
            >
              <div className="flex gap-3 items-start">
                <span className="text-3xl mt-1 shrink-0">💀</span>
                <p
                  className="text-lg font-body leading-relaxed"
                  style={{ color: "#2d3436", fontWeight: 500, lineHeight: 1.7 }}
                >
                  {joke}
                </p>
              </div>
              <button
                onClick={generateJoke}
                className="mt-4 w-full rounded-xl py-3 font-body font-700 text-base transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #FF6B6B, #FD79A8)",
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(255,107,107,0.35)",
                }}
              >
                Ещё один! 🎲
              </button>
            </div>
          )}
        </div>

        <p
          className="mt-8 text-sm font-body text-center"
          style={{ color: "rgba(99,110,114,0.8)", fontWeight: 500 }}
        >
          18+ Сайт содержит чёрный юмор. Никаких реальных обид — только смех 😈
        </p>
      </div>
    </div>
  );
}