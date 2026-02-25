import { useState, useRef } from "react";

const SYSTEM_PROMPT = `당신은 카카오톡 오픈채팅방 커뮤니티 분석 전문가입니다.
채팅 로그를 분석하여 아래 JSON 형식으로만 응답하세요.
절대로 JSON 외의 텍스트, 마크다운 코드블록, 설명을 포함하지 마세요.
오직 JSON 객체만 반환하세요. 문자열 내부에 큰따옴표 절대 사용 금지, 작은따옴표 사용.

{
  "overview": {
    "totalMessages": 0,
    "totalMembers": 0,
    "activeDays": 0,
    "avgMessagesPerDay": 0
  },
  "healthScore": 0,
  "healthLabel": "보통",
  "topMembers": [
    {"name": "닉네임", "messages": 0, "percentage": 0}
  ],
  "strengths": ["강점1", "강점2", "강점3"],
  "problems": ["문제점1", "문제점2", "문제점3"],
  "activationTips": ["방법1", "방법2", "방법3"],
  "peakHours": ["활발한 시간대 설명"],
  "newMemberRetention": "신규 멤버 정착률 분석",
  "communityCharacter": "커뮤니티 성격 한 줄",
  "keyInsight": "핵심 인사이트 한 문장",
  "topTopics": [
    {"topic": "주제명", "description": "어떤 대화였는지 2줄 설명", "emoji": "이모지"}
  ],
  "memes": [
    {"name": "밈 또는 내부 용어", "description": "어떤 맥락에서 쓰이는지 설명"}
  ],
  "recurringThemes": ["자주 반복되는 이야기 주제1", "주제2", "주제3"],
  "monthlyHighlights": [
    {"month": "YYYY년 MM월", "highlight": "그 달의 가장 인상적인 사건이나 대화 요약", "mood": "활발"}
  ],
  "famousQuotes": [
    {"quote": "기억에 남는 발언", "author": "닉네임"}
  ],
  "communityMBTI": {
    "type": "ENFJ",
    "ei": {"label": "E (외향)", "score": 70, "description": "대화가 활발하고 반응이 빠름"},
    "sn": {"label": "N (직관)", "score": 60, "description": "아이디어와 가능성 중심 대화"},
    "tf": {"label": "F (감정)", "score": 75, "description": "공감과 감성적 표현이 많음"},
    "jp": {"label": "J (계획)", "score": 55, "description": "챌린지나 루틴 등 구조적 활동 선호"},
    "summary": "MBTI 기반 커뮤니티 성격 요약 2줄"
  },
  "memberTraits": [
    {"name": "닉네임", "trait": "항상 음식 얘기를 꺼내는 먹방 담당", "emoji": "🍕"}
  ],
  "communityNicknames": [
    {"nickname": "방 별명", "reason": "이 별명이 붙은 이유 한 줄"}
  ]
}`;

function ScoreRing({ score, label }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{ fontSize: "26px", fontWeight: "700", color: "#111827" }}>{score}</span>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>/ 100</span>
        </div>
      </div>
      <span style={{ marginTop: "8px", fontSize: "13px", fontWeight: "600", color }}>{label}</span>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb",
      borderRadius: "16px", padding: "24px", ...style
    }}>
      {children}
    </div>
  );
}

function BarChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.messages), 1);
  const colors = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {data.slice(0, 5).map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: colors[i], color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: "700", flexShrink: 0
          }}>
            {(m.name || "?")[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: "500" }}>{m.name}</span>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>{m.messages}개 ({m.percentage}%)</span>
            </div>
            <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "999px" }}>
              <div style={{
                height: "100%", width: `${(m.messages / max) * 100}%`,
                background: colors[i], borderRadius: "999px"
              }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [showAllMembers, setShowAllMembers] = useState(false);
  const fileRef = useRef();

  // 카카오톡 로그에서 전체 멤버 직접 파싱
  const parseMembers = (rawText) => {
    // 나간 멤버 추출
    const leftMembers = new Set();
    const leftPatterns = [
      /^.+, (.+?) : (.+?)님이 나갔습니다/gm,
      /(.+?)님이 나갔습니다/gm,
      /(.+?)님이 퇴장하셨습니다/gm,
    ];
    for (const pattern of leftPatterns) {
      let match;
      while ((match = pattern.exec(rawText)) !== null) {
        const name = (match[2] || match[1] || "").trim();
        if (name) leftMembers.add(name);
      }
    }

    const memberCount = {};
    const patterns = [
      /^.+, (.+?) : .+$/gm,
      /^\[(.+?)\] \[\d{1,2}:\d{2}/gm,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(rawText)) !== null) {
        const name = match[1].trim();
        if (name && !name.includes("오전") && !name.includes("오후") && name !== "카카오톡" && !name.startsWith("20")) {
          memberCount[name] = (memberCount[name] || 0) + 1;
        }
      }
      if (Object.keys(memberCount).length > 0) break;
    }
    return Object.entries(memberCount)
      .filter(([name]) => !leftMembers.has(name))
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target.result);
    reader.onerror = () => setError("파일을 읽을 수 없어요.");
    reader.readAsText(file, "utf-8");
  };

  const analyze = async () => {
    if (!text.trim()) { setError("채팅 로그를 입력해주세요."); return; }
    setLoading(true);
    setError("");
    setDebugInfo("");

    // 전체 텍스트에서 직접 멤버 파싱
    const members = parseMembers(text);
    setAllMembers(members);

    // 총 메시지 수 직접 카운팅 (전체 텍스트 기준)
    const totalMessages = members.reduce((sum, m) => sum + m.count, 0);

    // 활동 일수 직접 카운팅
    const dateMatches = text.match(/^(\d{4}[.\-년]\s?\d{1,2}[.\-월]\s?\d{1,2})/gm) || [];
    const uniqueDays = new Set(dateMatches).size;

    try {
      // 전체 텍스트를 균등하게 샘플링 (앞/중간/뒤 골고루)
      const sampleText = (str, targetLen = 60000) => {
        if (str.length <= targetLen) return str;
        const chunkSize = Math.floor(targetLen / 5);
        const step = Math.floor(str.length / 5);
        return [0, 1, 2, 3, 4]
          .map(i => str.slice(i * step, i * step + chunkSize))
          .join("\n...(중략)...\n");
      };
      const truncated = sampleText(text);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `채팅 로그:\n\n${truncated}` }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        setDebugInfo(`HTTP ${response.status}: ${errText}`);
        throw new Error(`API 오류 (${response.status})`);
      }

      const data = await response.json();
      const raw = data?.content?.[0]?.text || "";
      setDebugInfo(`응답 받음 (${raw.length}자)`);

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON 형식을 찾을 수 없어요");

      // 제어문자 제거 + 줄바꿈 정리
      const cleaned = jsonMatch[0]
        .replace(/[\x00-\x1F\x7F]/g, (c) => {
          if (c === "\n" || c === "\r" || c === "\t") return " ";
          return "";
        })
        .replace(/,\s*([}\]])/g, "$1"); // trailing comma 제거

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
        // AI 추정값을 실제 파싱 결과로 덮어쓰기
        if (members.length > 0) parsed.overview.totalMembers = members.length;
        if (totalMessages > 0) {
          parsed.overview.totalMessages = totalMessages;
          const days = uniqueDays > 0 ? uniqueDays : parsed.overview.activeDays;
          parsed.overview.activeDays = days;
          parsed.overview.avgMessagesPerDay = days > 0 ? Math.round(totalMessages / days) : 0;
        }
      } catch (e) {
        // 마지막 수단: 각 필드를 개별로 추출
        const extract = (key, fallback) => {
          const m = raw.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*?)"`));
          return m ? m[1] : fallback;
        };
        const extractNum = (key) => {
          const m = raw.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
          return m ? parseInt(m[1]) : 0;
        };
        parsed = {
          overview: {
            totalMessages: extractNum("totalMessages"),
            totalMembers: extractNum("totalMembers"),
            activeDays: extractNum("activeDays"),
            avgMessagesPerDay: extractNum("avgMessagesPerDay"),
          },
          healthScore: extractNum("healthScore"),
          healthLabel: extract("healthLabel", "보통"),
          topMembers: [],
          strengths: ["분석 결과를 파싱하는 중 오류가 발생했어요. 다시 시도해주세요."],
          problems: [],
          activationTips: [],
          peakHours: [extract("peakHours", "-")],
          newMemberRetention: extract("newMemberRetention", "-"),
          communityCharacter: extract("communityCharacter", "-"),
          keyInsight: extract("keyInsight", "분석 중 오류가 발생했어요. 다시 시도해주세요."),
        };
      }
      setResult(parsed);
    } catch (e) {
      setError(`분석 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setText(""); setError(""); setDebugInfo(""); setAllMembers([]); setShowAllMembers(false); };

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, sans-serif"
    }}>
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          30% { width: 45%; }
          60% { width: 70%; }
          85% { width: 88%; }
          100% { width: 95%; }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
      <div style={{ textAlign: "center", width: "280px" }}>
        <div style={{ fontSize: "36px", marginBottom: "20px" }}>🔍</div>
        <div style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "6px" }}>
          분석 중이에요
          <span style={{ display: "inline-flex", gap: "3px", marginLeft: "4px", verticalAlign: "middle" }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: "#111827", display: "inline-block",
                animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </span>
        </div>
        <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "24px" }}>
          AI가 채팅 로그를 꼼꼼히 읽고 있어요
        </div>
        <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "#111827", borderRadius: "999px",
            animation: "loading-bar 8s cubic-bezier(0.4, 0, 0.2, 1) forwards"
          }} />
        </div>
        <div style={{ marginTop: "10px", fontSize: "11px", color: "#d1d5db" }}>
          멤버 패턴 · 활성도 · 강점/문제점 분석 중
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      padding: "32px 20px"
    }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>

        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              background: "#111827", borderRadius: "10px",
              width: "34px", height: "34px", display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontSize: "16px"
            }}>💬</span>
            채팅방 커뮤니티 분석기
          </h1>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
            카카오톡 채팅 로그를 붙여넣으면 AI가 커뮤니티를 분석해드려요
          </p>
        </div>

        {!result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>채팅 로그</span>
                <button onClick={() => fileRef.current.click()} style={{
                  border: "1px solid #e5e7eb", background: "#fff", borderRadius: "8px",
                  padding: "5px 12px", fontSize: "12px", cursor: "pointer", color: "#374151"
                }}>
                  📎 .txt 파일 업로드
                </button>
                <input ref={fileRef} type="file" accept=".txt" style={{ display: "none" }} onChange={handleFile} />
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={"카카오톡 채팅 내용을 붙여넣으세요.\n\n내보내기: 채팅방 우측 상단 메뉴 → 대화 내용 내보내기"}
                style={{
                  width: "100%", minHeight: "200px", border: "1px solid #e5e7eb",
                  borderRadius: "10px", padding: "12px", fontSize: "13px",
                  resize: "vertical", outline: "none", lineHeight: "1.6",
                  background: "#fafafa", boxSizing: "border-box", fontFamily: "inherit", color: "#374151"
                }}
              />
              {text && <div style={{ marginTop: "6px", fontSize: "11px", color: "#9ca3af" }}>{text.length.toLocaleString()}자</div>}
            </Card>

            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#dc2626"
              }}>
                {error}
                {debugInfo && <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.7, fontFamily: "monospace" }}>{debugInfo}</div>}
              </div>
            )}

            <button onClick={analyze} disabled={!text.trim()} style={{
              background: text.trim() ? "#111827" : "#e5e7eb",
              color: text.trim() ? "#fff" : "#9ca3af",
              border: "none", borderRadius: "12px", padding: "13px",
              fontSize: "14px", fontWeight: "600",
              cursor: text.trim() ? "pointer" : "not-allowed"
            }}>
              분석 시작 →
            </button>
          </div>
        )}

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            <div style={{ background: "#111827", borderRadius: "14px", padding: "18px 22px", color: "#fff" }}>
              <div style={{ fontSize: "10px", opacity: 0.5, marginBottom: "6px", letterSpacing: "1px", fontWeight: "600" }}>KEY INSIGHT</div>
              <div style={{ fontSize: "15px", fontWeight: "600", lineHeight: "1.5" }}>💡 {result.keyInsight}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Card style={{ textAlign: "center" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "16px", textAlign: "left" }}>커뮤니티 건강도</div>
                <ScoreRing score={result.healthScore || 0} label={result.healthLabel || ""} />
                <div style={{ marginTop: "14px", padding: "8px 12px", background: "#f9fafb", borderRadius: "8px", fontSize: "12px", color: "#6b7280" }}>
                  {result.communityCharacter}
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>기본 통계</div>
                {[
                  { label: "💬 총 메시지", val: `${(result.overview?.totalMessages || 0).toLocaleString()}개` },
                  { label: "👥 참여 멤버", val: `${result.overview?.totalMembers || 0}명` },
                  { label: "📅 활동 일수", val: `${result.overview?.activeDays || 0}일` },
                  { label: "📊 일평균", val: `${result.overview?.avgMessagesPerDay || 0}개` },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>{item.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>{item.val}</span>
                  </div>
                ))}
              </Card>
            </div>

            {/* All Members */}
            {allMembers.length > 0 && (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                    👥 전체 멤버 <span style={{ color: "#9ca3af", fontWeight: "400" }}>({allMembers.length}명)</span>
                  </div>
                  <button onClick={() => setShowAllMembers(v => !v)} style={{
                    border: "1px solid #e5e7eb", background: "#fff", borderRadius: "8px",
                    padding: "4px 12px", fontSize: "12px", cursor: "pointer", color: "#6b7280"
                  }}>
                    {showAllMembers ? "접기" : "전체 보기"}
                  </button>
                </div>
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: "8px",
                  maxHeight: showAllMembers ? "none" : "80px",
                  overflow: showAllMembers ? "visible" : "hidden"
                }}>
                  {allMembers.map((m, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "4px 10px", background: "#f3f4f6",
                      borderRadius: "999px", fontSize: "12px"
                    }}>
                      <div style={{
                        width: "18px", height: "18px", borderRadius: "50%",
                        background: `hsl(${(i * 47) % 360}, 60%, 65%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: "700", color: "#fff", flexShrink: 0
                      }}>{m.name[0]}</div>
                      <span style={{ color: "#374151", fontWeight: "500" }}>{m.name}</span>
                      <span style={{ color: "#9ca3af" }}>{m.count}</span>
                    </div>
                  ))}
                </div>
                {!showAllMembers && allMembers.length > 10 && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#9ca3af", textAlign: "center" }}>
                    +{allMembers.length - 10}명 더 있어요
                  </div>
                )}
              </Card>
            )}

            <Card>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>활발한 멤버 TOP 5</div>
              <BarChart data={result.topMembers || []} />
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }}>✅ 강점</div>
                {(result.strengths || []).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%", background: "#d1fae5",
                      color: "#065f46", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: "700", flexShrink: 0, marginTop: "2px"
                    }}>{i + 1}</div>
                    <span style={{ fontSize: "13px", color: "#374151", lineHeight: "1.5" }}>{s}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }}>⚠️ 문제점</div>
                {(result.problems || []).map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%", background: "#fee2e2",
                      color: "#991b1b", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: "700", flexShrink: 0, marginTop: "2px"
                    }}>{i + 1}</div>
                    <span style={{ fontSize: "13px", color: "#374151", lineHeight: "1.5" }}>{p}</span>
                  </div>
                ))}
              </Card>
            </div>

            <Card>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }}>🚀 활성화 방법</div>
              {(result.activationTips || []).map((tip, i) => (
                <div key={i} style={{
                  display: "flex", gap: "10px", padding: "11px 14px",
                  background: "#f9fafb", borderRadius: "10px", marginBottom: "8px"
                }}>
                  <span style={{ fontSize: "14px" }}>{["1️⃣","2️⃣","3️⃣"][i]}</span>
                  <span style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>{tip}</span>
                </div>
              ))}
            </Card>

            {/* Top Topics */}
            {result.topTopics?.length > 0 && (
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }}>🗣️ 자주 나온 대화 주제</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {result.topTopics.map((t, i) => (
                    <div key={i} style={{
                      display: "flex", gap: "12px", alignItems: "flex-start",
                      padding: "12px 14px", background: "#f9fafb", borderRadius: "10px"
                    }}>
                      <span style={{ fontSize: "22px", flexShrink: 0 }}>{t.emoji}</span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#111827", marginBottom: "3px" }}>{t.topic}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.5" }}>{t.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Memes & Recurring Themes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {result.memes?.length > 0 && (
                <Card>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }}>😂 밈 & 내부 용어</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.memes.map((m, i) => (
                      <div key={i} style={{ borderBottom: i < result.memes.length - 1 ? "1px solid #f3f4f6" : "none", paddingBottom: i < result.memes.length - 1 ? "10px" : 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#111827", marginBottom: "2px" }}>
                          "{m.name}"
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.4" }}>{m.description}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {result.recurringThemes?.length > 0 && (
                <Card>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }}>🔁 반복되는 이야기</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {result.recurringThemes.map((theme, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <span style={{ color: "#9ca3af", fontSize: "12px", marginTop: "2px", flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: "13px", color: "#374151", lineHeight: "1.5" }}>{theme}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Monthly Highlights */}
            {result.monthlyHighlights?.length > 0 && (
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>📅 월별 하이라이트</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
                  {result.monthlyHighlights.map((m, i) => {
                    const moodColor = m.mood === "활발" ? "#10b981" : m.mood === "조용" ? "#9ca3af" : "#f59e0b";
                    const moodBg = m.mood === "활발" ? "#d1fae5" : m.mood === "조용" ? "#f3f4f6" : "#fef3c7";
                    return (
                      <div key={i} style={{
                        display: "flex", gap: "16px", alignItems: "flex-start",
                        paddingBottom: "16px", marginBottom: "16px",
                        borderBottom: i < result.monthlyHighlights.length - 1 ? "1px solid #f3f4f6" : "none"
                      }}>
                        <div style={{ flexShrink: 0, textAlign: "center", minWidth: "64px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#111827" }}>{m.month}</div>
                          <span style={{
                            marginTop: "4px", display: "inline-block",
                            background: moodBg, color: moodColor,
                            padding: "2px 8px", borderRadius: "999px",
                            fontSize: "11px", fontWeight: "600"
                          }}>{m.mood}</span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>{m.highlight}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Famous Quotes */}
            {result.famousQuotes?.length > 0 && (
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }}>💬 기억에 남는 발언</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {result.famousQuotes.map((q, i) => (
                    <div key={i} style={{
                      padding: "12px 16px", background: "#f9fafb",
                      borderLeft: "3px solid #111827", borderRadius: "0 10px 10px 0"
                    }}>
                      <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6", marginBottom: "6px" }}>
                        "{q.quote}"
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "500" }}>— {q.author}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Community MBTI */}
            {result.communityMBTI && (
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>🧠 커뮤니티 MBTI</div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                  <div style={{
                    width: "72px", height: "72px", borderRadius: "16px",
                    background: "#111827", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "24px", fontWeight: "800", color: "#fff", flexShrink: 0, letterSpacing: "1px"
                  }}>
                    {result.communityMBTI.type}
                  </div>
                  <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.7" }}>
                    {result.communityMBTI.summary}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[result.communityMBTI.ei, result.communityMBTI.sn, result.communityMBTI.tf, result.communityMBTI.jp].filter(Boolean).map((axis, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#111827" }}>{axis.label}</span>
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>{axis.score}%</span>
                      </div>
                      <div style={{ height: "4px", background: "#e5e7eb", borderRadius: "999px", marginBottom: "6px" }}>
                        <div style={{ height: "100%", width: `${axis.score}%`, background: "#111827", borderRadius: "999px" }} />
                      </div>
                      <div style={{ fontSize: "11px", color: "#6b7280", lineHeight: "1.4" }}>{axis.description}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Member Traits */}
            {result.memberTraits?.length > 0 && (
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }}>🎭 멤버별 특징</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {result.memberTraits.map((m, i) => (
                    <div key={i} style={{
                      display: "flex", gap: "10px", alignItems: "flex-start",
                      padding: "10px 12px", background: "#f9fafb", borderRadius: "10px"
                    }}>
                      <span style={{ fontSize: "20px", flexShrink: 0 }}>{m.emoji}</span>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#111827", marginBottom: "2px" }}>{m.name}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.4" }}>{m.trait}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Community Nicknames */}
            {result.communityNicknames?.length > 0 && (
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }}>🏷️ 이 방의 별명</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {result.communityNicknames.map((n, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 14px", background: "#f9fafb", borderRadius: "10px" }}>
                      <div style={{
                        padding: "4px 12px", background: "#111827", color: "#fff",
                        borderRadius: "999px", fontSize: "13px", fontWeight: "700", flexShrink: 0
                      }}>
                        {n.nickname}
                      </div>
                      <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.5" }}>{n.reason}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>🕐 활발한 시간대</div>
                <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.6" }}>{result.peakHours?.[0]}</div>
              </Card>
              <Card>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>🌱 신규 멤버 정착률</div>
                <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.6" }}>{result.newMemberRetention}</div>
              </Card>
            </div>

            <button onClick={reset} style={{
              background: "#fff", color: "#374151", border: "1px solid #e5e7eb",
              borderRadius: "12px", padding: "12px", fontSize: "14px",
              fontWeight: "500", cursor: "pointer"
            }}>
              ← 새로운 채팅 분석하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
