import React, { useState, useEffect, useMemo } from "react";


 
const YOUTUBE_API_KEY = "AIzaSyCsO1lfj0CzTeuXlIbJMhqE3PrTT6T8KUY"; 


const CHANNELS = {
  news: {
    label: "News / Docs",
    base: "independent documentary news report",
  },
  music: {
    label: "Music",
    base: "music video live performance underground remix",
  },
  visuals: {
    label: "Visuals",
    base: "psychedelic visuals projection experimental VJ loop",
  },
  retro: {
    label: "Retro / Archive",
    base: "forgotten 80s 90s vhs commercial archive",
  },
  cooking: {
    label: "Cooking / Lifestyle",
    base: "home cooking recipe food vlog tutorial",
  },
  educational: {
    label: "Educational",
    base: "science documentary how it's made educational explain",
  },
};

// === WORD BANKS
const WEIRDNESS_WORDS = [
  "normal",
  "quirky",
  "odd",
  "strange",
  "bizarre",
  "cursed",
  "surreal",
];

const ENERGY_WORDS = ["calm", "steady", "neutral", "upbeat", "energetic", "chaotic"];

const RETRO_WORDS = [
  "modern",
  "2000s",
  "1990s",
  "1980s",
  "vintage",
  "vhs",
  "analog",
];

// Words to minimize
const BLACKLIST_TERMS = [
  "compilation",
  "reaction",
  "review",
  "watchmojo",
  "top 10",
  "listicle",
  "documentary trailer",
  "interview",
  "news anchor",
];

// Helper
function pickFromBucket(bucket, value) {
  const n = bucket.length;
  // map 
  const idx = Math.min(n - 1, Math.floor((value / 100) * n));
  return bucket[idx];
}

//  prompt string from selected params
function buildPrompt(channelKey, weird, retro, energy, extra) {
  const channel = CHANNELS[channelKey];
  const weirdWord = pickFromBucket(WEIRDNESS_WORDS, weird);
  const retroWord = pickFromBucket(RETRO_WORDS, retro);
  const energyWord = pickFromBucket(ENERGY_WORDS, energy);

  // Compose phrases 
  const parts = [channel.base];

  // include words 
  if (weirdWord && weirdWord !== "normal") parts.push(weirdWord);
  if (retroWord && retroWord !== "modern") parts.push(retroWord);
  if (energyWord && energyWord !== "steady" && energyWord !== "neutral") parts.push(energyWord);

  if (extra && extra.trim()) parts.push(extra.trim());

  
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// title filter
function isTitleAllowed(title) {
  if (!title) return false;
  const lt = title.toLowerCase();
  return !BLACKLIST_TERMS.some((t) => lt.includes(t));
}

export default function App() {
  const [channel, setChannel] = useState("visuals");
  const [weirdness, setWeirdness] = useState(50); // 0..100
  const [retroness, setRetroness] = useState(20); // 0..100
  const [energy, setEnergy] = useState(50); // 0..100
  const [extraKeywords, setExtraKeywords] = useState("");
  const [autoFetch, setAutoFetch] = useState(false);

  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");
  const [error, setError] = useState(null);

  // Compose the prompt 
  const prompt = useMemo(
    () => buildPrompt(channel, weirdness, retroness, energy, extraKeywords),
    [channel, weirdness, retroness, energy, extraKeywords]
  );

  // fetch a random video 
  async function fetchRandomVideo(usePrompt = prompt) {
    setError(null);
    setLoading(true);
    setDebug(`Searching YouTube for: "${usePrompt}"`);

    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "YOUR_API_KEY_HERE") {
      setError("YouTube API key not set. Insert your key in the code.");
      setLoading(false);
      return;
    }

    try {
      // Search endpoint
      const q = encodeURIComponent(usePrompt);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=25&q=${q}&key=${YOUTUBE_API_KEY}`;

      const resp = await fetch(url);
      setDebug((d) => d + `\nHTTP ${resp.status}`);

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(`${resp.status} - ${errData.error?.message || "API error"}`);
      }

      const data = await resp.json();

      if (!data.items || data.items.length === 0) {
        setError("No results returned by YouTube for that prompt.");
        setLoading(false);
        return;
      }

     
      const filtered = data.items.filter(
        (it) => it.id && it.id.videoId && isTitleAllowed(it.snippet?.title)
      );

      
      const pool = filtered.length > 0 ? filtered : data.items;

      // Pick a random item
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const vid = picked.id.videoId;
      setCurrentVideoId(vid);
      setDebug((d) => d + `\nFound ${pool.length} candidate(s), selected: ${vid} - "${picked.snippet.title}"`);
    } catch (err) {
      console.error("Fetch error", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch on slider/channel change if enabled
  useEffect(() => {
    if (autoFetch) {
      // small debounce
      const t = setTimeout(() => {
        fetchRandomVideo();
      }, 350);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, weirdness, retroness, energy, extraKeywords, autoFetch]);

  // Simple UI styles (black & white, monospace)
  const base = {
    fontFamily: "monospace",
    color: "#fff",
    background: "#000",
    minHeight: "100vh",
    padding: "24px",
    boxSizing: "border-box",
  };

  const card = {
    background: "#0b0b0b",
    border: "1px solid #222",
    padding: "12px",
    borderRadius: "6px",
  };

  const labelStyle = { display: "block", fontSize: "12px", color: "#ddd", marginBottom: "6px" };

  return (
    <div style={base}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>Cable Algorithm</h1>
          <div style={{ fontSize: 12, color: "#bbb" }}>YouTube but you control the algorithm!</div>
        </header>

        <main style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
          {/* TV area */}
          <section style={card}>
            <div style={{ marginBottom: 12 }}>
              <strong>Prompt:</strong>
              <div style={{ marginTop: 6, color: "#eee", fontSize: 13 }}>{prompt}</div>
            </div>

            <div style={{ background: "#000", border: "1px solid #111", padding: 6, borderRadius: 4 }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: "center" }}>Loading...</div>
              ) : error ? (
                <div style={{ padding: 24, textAlign: "center", color: "#f88" }}>{error}</div>
              ) : currentVideoId ? (
                <iframe
                  key={currentVideoId}
                  width="100%"
                  height="480"
                  src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
                  title="TV Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={{ padding: 24, textAlign: "center", color: "#999" }}>TV is idle — press Shuffle</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => fetchRandomVideo()}
                style={{
                  flex: 1,
                  background: "#111",
                  color: "#fff",
                  border: "1px solid #333",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Shuffle
              </button>

              <button
                onClick={() => {
                  setCurrentVideoId(null);
                  setError(null);
                  setDebug("");
                }}
                style={{
                  padding: "8px 12px",
                  background: "#111",
                  color: "#fff",
                  border: "1px solid #333",
                  cursor: "pointer",
                }}
              >
                Stop
              </button>

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, fontSize: 13 }}>
                <input type="checkbox" checked={autoFetch} onChange={(e) => setAutoFetch(e.target.checked)} /> Auto
              </label>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: "#bbb", whiteSpace: "pre-wrap" }}>{debug}</div>
          </section>

          {/* Controls */}
          <aside style={card}>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                style={{ width: "100%", padding: "8px", background: "#000", color: "#fff", border: "1px solid #333" }}
              >
                {Object.entries(CHANNELS).map(([k, v]) => (
                  <option value={k} key={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Weirdness ({weirdness})</label>
              <input
                type="range"
                min="0"
                max="100"
                value={weirdness}
                onChange={(e) => setWeirdness(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Retro-ness / Year vibe ({retroness})</label>
              <input
                type="range"
                min="0"
                max="100"
                value={retroness}
                onChange={(e) => setRetroness(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Energy ({energy})</label>
              <input
                type="range"
                min="0"
                max="100"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Extra keywords (optional- might confuse the algorithm but works)</label>
              <input
                value={extraKeywords}
                onChange={(e) => setExtraKeywords(e.target.value)}
              
                style={{ width: "100%", padding: "8px", background: "#000", color: "#fff", border: "1px solid #333" }}
              />
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "#aaa" }}>
              How to use: move sliders to adjust the search prompt — press Shuffle to fetch a new random result from the YouTube algoritm.
            </div>
          </aside>
        </main>

        <footer style={{ color: "#666", fontSize: 12 }}>
           Made by Arav Tewari. Enjoy!
        </footer>
      </div>
    </div>
  );
}

