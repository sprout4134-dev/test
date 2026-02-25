import { useMemo, useRef, useState } from 'react';

const SYSTEM_PROMPT = `당신은 카카오톡 오픈채팅방 커뮤니티 분석 전문가입니다.
채팅 로그를 분석하여 JSON 객체로만 응답하세요.
마크다운 코드블록 없이 JSON만 반환하세요.`;

function Card({ title, children }) {
  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 20,
      }}
    >
      {title ? (
        <h2 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#374151' }}>{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

function ScoreRing({ score, label }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
        <svg width='120' height='120' style={{ transform: 'rotate(-90deg)' }}>
          <circle cx='60' cy='60' r={r} fill='none' stroke='#e5e7eb' strokeWidth='8' />
          <circle
            cx='60'
            cy='60'
            r={r}
            fill='none'
            stroke={color}
            strokeWidth='8'
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap='round'
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <strong style={{ fontSize: 24 }}>{score}</strong>
          <span style={{ color: '#9ca3af', fontSize: 11 }}>/100</span>
        </div>
      </div>
      <div style={{ marginTop: 8, fontWeight: 600, color }}>{label}</div>
    </div>
  );
}

function parseMembers(rawText) {
  const leftMembers = new Set();
  for (const pattern of [/^.+, (.+?) : (.+?)님이 나갔습니다/gm, /(.+?)님이 나갔습니다/gm, /(.+?)님이 퇴장하셨습니다/gm]) {
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      const name = (match[2] || match[1] || '').trim();
      if (name) {
        leftMembers.add(name);
      }
    }
  }

  const memberCount = {};
  for (const pattern of [/^.+, (.+?) : .+$/gm, /^\[(.+?)\] \[(오전|오후)?\s?\d{1,2}:\d{2}/gm]) {
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      const name = (match[1] || '').trim();
      if (!name || name === '카카오톡' || name.startsWith('20')) {
        continue;
      }
      memberCount[name] = (memberCount[name] || 0) + 1;
    }
    if (Object.keys(memberCount).length) {
      break;
    }
  }

  return Object.entries(memberCount)
    .filter(([name]) => !leftMembers.has(name))
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

function sampleText(str, targetLen = 60000) {
  if (str.length <= targetLen) {
    return str;
  }
  const chunkSize = Math.floor(targetLen / 5);
  const step = Math.floor(str.length / 5);
  return [0, 1, 2, 3, 4]
    .map((i) => str.slice(i * step, i * step + chunkSize))
    .join('\n...(중략)...\n');
}

function safeParse(raw) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('JSON 형식을 찾을 수 없어요.');
  }
  const cleaned = jsonMatch[0]
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(cleaned);
}

export default function App() {
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_ANTHROPIC_API_KEY || '');
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const fileRef = useRef(null);

  const computedOverview = useMemo(() => {
    const totalMessages = allMembers.reduce((sum, m) => sum + m.count, 0);
    const dateMatches = text.match(/^(\d{4}[.\-년]\s?\d{1,2}[.\-월]\s?\d{1,2})/gm) || [];
    const activeDays = new Set(dateMatches).size;
    const avg = activeDays ? Math.round(totalMessages / activeDays) : 0;
    return {
      totalMembers: allMembers.length,
      totalMessages,
      activeDays,
      avgMessagesPerDay: avg,
    };
  }, [allMembers, text]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target?.result || '');
    reader.onerror = () => setError('파일을 읽을 수 없어요.');
    reader.readAsText(file, 'utf-8');
  };

  const analyze = async () => {
    if (!text.trim()) {
      setError('채팅 로그를 입력해주세요.');
      return;
    }
    if (!apiKey.trim()) {
      setError('Anthropic API 키를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setDebugInfo('');

    const members = parseMembers(text);
    setAllMembers(members);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey.trim(),
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `채팅 로그:\n\n${sampleText(text)}` }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        setDebugInfo(`HTTP ${response.status}: ${errText}`);
        throw new Error(`API 오류 (${response.status})`);
      }

      const data = await response.json();
      const raw = data?.content?.[0]?.text || '';
      setDebugInfo(`응답 받음 (${raw.length}자)`);
      const parsed = safeParse(raw);

      parsed.overview = {
        ...(parsed.overview || {}),
        totalMembers: members.length || parsed.overview?.totalMembers || 0,
        totalMessages: computedOverview.totalMessages || parsed.overview?.totalMessages || 0,
        activeDays: computedOverview.activeDays || parsed.overview?.activeDays || 0,
        avgMessagesPerDay: computedOverview.avgMessagesPerDay || parsed.overview?.avgMessagesPerDay || 0,
      };

      setResult(parsed);
    } catch (e) {
      setError(`분석 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setText('');
    setAllMembers([]);
    setError('');
    setDebugInfo('');
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h1 style={{ margin: 0 }}>💬 채팅방 커뮤니티 분석기</h1>
      <p style={{ margin: 0, color: '#6b7280' }}>카카오톡 대화 로그를 분석해 커뮤니티 리포트를 생성합니다.</p>

      {!result ? (
        <>
          <Card title='API 설정'>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#4b5563' }}>Anthropic API Key</label>
            <input
              type='password'
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder='sk-ant-...'
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </Card>

          <Card title='채팅 로그 입력'>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <button type='button' onClick={() => fileRef.current?.click()}>
                📎 .txt 파일 업로드
              </button>
              <small style={{ color: '#9ca3af' }}>{text.length.toLocaleString()}자</small>
            </div>
            <input ref={fileRef} type='file' accept='.txt' hidden onChange={handleFile} />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='카카오톡 채팅 내용을 붙여넣으세요.'
              style={{ width: '100%', minHeight: 260, borderRadius: 10, border: '1px solid #e5e7eb', padding: 12 }}
            />
          </Card>

          {error ? <Card title='오류'>{error}<br />{debugInfo}</Card> : null}

          <button type='button' onClick={analyze} disabled={loading} style={{ padding: 12, borderRadius: 10 }}>
            {loading ? '분석 중...' : '분석 시작'}
          </button>
        </>
      ) : (
        <>
          <Card>
            <strong>💡 {result.keyInsight || '-'}</strong>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Card title='커뮤니티 건강도'>
              <ScoreRing score={result.healthScore || 0} label={result.healthLabel || '-'} />
            </Card>
            <Card title='기본 통계'>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>총 메시지: {(result.overview?.totalMessages || 0).toLocaleString()}개</li>
                <li>참여 멤버: {result.overview?.totalMembers || 0}명</li>
                <li>활동 일수: {result.overview?.activeDays || 0}일</li>
                <li>일평균 메시지: {result.overview?.avgMessagesPerDay || 0}개</li>
              </ul>
            </Card>
          </div>

          <Card title={`전체 멤버 (${allMembers.length}명)`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allMembers.map((m) => (
                <span key={m.name} style={{ background: '#f3f4f6', borderRadius: 999, padding: '4px 10px', fontSize: 12 }}>
                  {m.name} ({m.count})
                </span>
              ))}
            </div>
          </Card>

          <button type='button' onClick={reset} style={{ padding: 12, borderRadius: 10 }}>
            ← 새 분석 시작
          </button>
        </>
      )}
    </main>
  );
}
