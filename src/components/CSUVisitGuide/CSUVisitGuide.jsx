import React, { useState } from 'react';

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h2 className="text-lg sm:text-xl font-bold text-purple-700 mb-4">{children}</h2>
  );
}

function CheckItem({ label }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 active:bg-purple-100 cursor-pointer min-h-[48px] border border-transparent hover:border-purple-100 transition-colors">
      <input type="checkbox" className="mt-0.5 w-5 h-5 accent-purple-600 flex-shrink-0" />
      <span className="text-sm text-gray-700 leading-snug">{label}</span>
    </label>
  );
}

function TipBox({ children }) {
  return (
    <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded-r-lg text-sm text-gray-800">
      <strong>💡 Tip:</strong> {children}
    </div>
  );
}

function ParentBox({ children }) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg text-sm text-gray-800">
      <strong>👨‍👩‍👦 Parent:</strong> {children}
    </div>
  );
}

function BadgePill({ value }) {
  const style = (() => {
    const v = value.toLowerCase();
    if (v.includes('critical')) return 'bg-red-100 text-red-700';
    if (v.includes('high') && !v.includes('moderate')) return 'bg-yellow-100 text-yellow-700';
    if (v.includes('moderate')) return 'bg-gray-100 text-gray-600';
    return 'bg-blue-100 text-blue-700';
  })();
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {value}
    </span>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const SESSIONS = [
  {
    id: 'checkin', time: '7:30–9:00 AM', title: 'Early Check-In', value: 'High Priority',
    description: 'Beat the crowds at Moby Arena. Get your college grouping assignment and grab complimentary snacks.',
    details: ['Arrive by 7:45 AM — early beats the lines', 'Check in at Moby Arena', 'Spanish language family social available', 'Get orientation materials and college assignment'],
    questions: [],
    tips: 'Early arrivals avoid long lines and get better parking.',
  },
  {
    id: 'welcome', time: '9:00–9:30 AM', title: 'Welcome Session', value: 'Moderate',
    description: 'Opening remarks and orientation. Groups separate by college.',
    details: ["Listen to opening remarks about the day", "Get oriented to the event flow", "Benny's group heads toward School of Theatre & Dance", 'Brief overview of activities and logistics'],
    questions: [],
    tips: 'Use this time to decide: split up during academic session or stay together?',
  },
  {
    id: 'academic', time: '10:00–11:30 AM', title: 'Academic Experience — Theatre & Dance', value: 'CRITICAL – Main Event',
    description: 'Tour of theater facilities, meet faculty, connect with current lighting students, learn about the program.',
    details: ['Tour stages, lighting booths, and technical spaces', 'Meet faculty advisors for lighting/tech track', "See current students' work and hear about their path", 'Learn about equipment and production opportunities', 'Q&A with current students and faculty'],
    questions: ['What shows run each semester and when does tech crew get involved?', 'What lighting equipment and systems are available?', 'Are there mentorship opportunities with upper-level techs?', 'What is the career outcome for lighting designers/technicians?', "How many shows per year? What's the technical calendar?", 'What internship opportunities exist locally or regionally?', 'How much autonomous responsibility do first-year techs have?', "What's the typical load (rehearsals, tech hours per week)?"],
    tips: "Heart of the visit. Take notes, ask about first-year experience, get contact info from student mentors.",
    parentStrategy: "Stay with Benny for context, or split to explore another college — you'll reconvene at lunch.",
  },
  {
    id: 'lunch', time: '11:30 AM–2:00 PM', title: 'Lunch & Residence Hall Tours', value: 'High – Informal Learning',
    description: 'Experience campus dining and see where students actually live.',
    details: ['Eat at actual student dining centers', 'Alternative: Lory Student Center food court', 'Residence hall tours: 11:30 AM–1:00 PM slot', 'Informal debrief time — process the morning', 'Benny gets feel for dorm life and community'],
    questions: ["What's the dining plan like? How many meals included?", 'Do theater/performance students tend to live together?', 'How safe is the area around campus?', 'What dorms are closest to the theater facilities?'],
    tips: 'Debrief over lunch — ask Benny what excited him, what surprised him, what questions remain.',
    parentStrategy: 'Grab lunch together, then do the residence hall tour. This context primes the resource fair.',
  },
  {
    id: 'resourcefair', time: '1:00–2:30 PM', title: 'Resource Fair (Lory Student Center)', value: 'Moderate-High – Informal Connections',
    description: 'Meet 40+ organizations. Connect with theater-specific resources, student groups, and support services.',
    details: ['40+ organizations with tables', 'School of Theatre & Dance student orgs', 'Technical theater clubs and production groups', 'Housing and residential college options', 'Mental health, academic support, and more', 'Informal conversations with current students'],
    questions: ['What is the main tech theater student org? When do they meet?', 'Are there clubs specifically for lighting designers?', 'What housing options exist for performance students?', 'What mental health support is available for high-stress programs?', 'Are there peer mentoring programs?'],
    tips: 'Target theater-specific booths first — this is where you get unfiltered student perspectives.',
    parentStrategy: 'Attend together. Introduce yourself to theater faculty and ask parent-focused questions.',
  },
  {
    id: 'breakout', time: '2:40–3:10 PM', title: 'Breakout Session', value: 'Medium – Context-Dependent',
    description: 'Choose ONE focused session targeting unanswered questions from the morning.',
    details: ['Theater-specific sessions: production pipeline, design process', '"Student Life in Theater/Performance"', 'Internship/career pathways in technical theater', 'Study abroad and touring opportunities', 'Wellness in high-stress performance programs'],
    questions: ["Based on the morning: what's still unclear?", 'Which breakout directly fills that gap?'],
    tips: 'One well-chosen breakout beats attending two unfocused ones. Skip if the morning answered everything.',
    parentStrategy: 'Benny should attend solo. Use this time for bookstore, RAMGO photos, or a last chat with admissions.',
  },
];

const STRATEGIES = [
  {
    id: 'benny', title: "Benny's Strategy",
    bg: 'from-pink-50 to-purple-50', border: 'border-pink-400',
    items: [
      { title: "Don't miss the academic session", body: 'School of Theatre & Dance (10:00–11:30 AM) is where Benny meets faculty, sees facilities, and connects with current lighting students.' },
      { title: 'Talk to current lighting students', body: "Ask about first semester, what they wish they'd known, job placement, and whether you can stay in touch." },
      { title: 'Ask about mentorship', body: 'Are there upper-level techs who guide newbies? Formal or informal structure?' },
      { title: 'Collect contact info', body: 'Email or social handles from faculty and student mentors for follow-up after the visit.' },
      { title: 'Take notes', body: 'Shows, tech calendar, equipment, opportunities — details that help compare programs later.' },
    ],
  },
  {
    id: 'parent', title: 'Parent Strategy',
    bg: 'from-blue-50 to-indigo-50', border: 'border-blue-400',
    items: [
      { title: 'Decide early on splitting up', body: 'Stay with Benny (context) or explore another college (breadth). Decide before 10:00 AM.' },
      { title: 'Work the resource fair together', body: 'Introduce yourself to theater faculty. Ask about program structure, safety, and support systems.' },
      { title: 'Use lunch as a debrief', body: "Ask Benny what excited him and what questions remain. This shapes how you use the afternoon." },
      { title: 'Ask parent-specific questions', body: 'Housing safety, mental health support, academic resources, financial aid, family communication.' },
      { title: 'Gather logistics', body: 'Move-in dates, required materials for tech students, parking for families, emergency contacts.' },
    ],
  },
];

const TIMELINE = [
  { time: '7:45 AM',          action: 'Arrive early — beat the check-in lines at Moby Arena' },
  { time: '7:30–9:00 AM',     action: 'Check-in, snacks, get orientation materials' },
  { time: '9:00–9:30 AM',     action: 'Welcome session — groups split by college' },
  { time: '10:00–11:30 AM',   action: '🎭  MAIN EVENT — School of Theatre & Dance academic session' },
  { time: '11:30 AM–1:00 PM', action: 'Lunch at dining center + residence hall tour' },
  { time: '1:00–2:30 PM',     action: 'Resource fair — target theater-specific booths first' },
  { time: '2:40–3:10 PM',     action: 'One focused breakout session (if questions remain)' },
  { time: '3:10–4:00 PM',     action: 'Meet CAM, bookstore, wrap up and head out' },
];

const QUESTIONS = {
  benny: [
    'Can I speak with current first-year lighting students?',
    "What's a typical week — rehearsals and tech hours?",
    'How much equipment access do first-year students have?',
    'What shows are coming up that I could work on?',
    'Is there a formal mentorship program for new techs?',
    'What technical skills do I need to start, and what will I learn here?',
  ],
  parent: [
    'What support systems exist for students in high-stress performance programs?',
    'How is the community among technical theater students?',
    'What is the career outcome for graduates in this track?',
    'How does the program balance academics and performance commitments?',
    'What resources are available if Benny struggles academically or emotionally?',
    "What's the campus culture for families visiting?",
  ],
};

const PREP_ITEMS = [
  'Charge phone — bring a portable charger',
  'Comfortable walking shoes (lots of campus terrain)',
  'Small notebook for Benny to take notes',
  'Snacks and water bottle (long day)',
  'Plan parking/route to Moby Arena',
  'Valid ID for both of you',
  'Review the event program if available online beforehand',
  'Decide: split during academic session or stay together?',
  'Camera ready for CAM meet & greet photos',
  'Cards or paper to collect contact info from students/faculty',
];

const TAKEAWAYS = [
  {
    title: 'The Main Event',
    body: 'The 10:00–11:30 AM Theatre & Dance academic session is non-negotiable. Facilities, faculty, and real student conversations all happen here.',
  },
  {
    title: 'Connection Over Coverage',
    body: "One meaningful conversation with a current tech student beats five skimmed sessions. Depth wins.",
  },
  {
    title: 'Debrief Over Lunch',
    body: "Synthesize over food. What excited Benny? What surprised him? What's still unanswered? This primes the afternoon.",
  },
  {
    title: 'Stay Flexible',
    body: "If a session runs long and something great is happening — stay. If you're satisfied by 2 PM, it's fine to leave early.",
  },
];

// ─── Tabs config ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',   icon: '🎓', label: 'Overview'   },
  { id: 'timeline',   icon: '📅', label: 'Timeline'   },
  { id: 'sessions',   icon: '📍', label: 'Sessions'   },
  { id: 'strategies', icon: '🎯', label: 'Strategies' },
  { id: 'questions',  icon: '❓', label: 'Questions'  },
  { id: 'prep',       icon: '✅', label: 'Prep'       },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function CSUVisitGuide() {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSession, setExpandedSession] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-blue-50 flex flex-col">

      {/* ── Sticky tab bar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5
                py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all border-b-2
                ${activeTab === tab.id
                  ? 'border-purple-600 text-purple-700 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <span className="text-base sm:text-sm leading-none">{tab.icon}</span>
              <span className="leading-none">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Tab content ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-12">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Hero card */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-xl p-5 sm:p-8 shadow-lg">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 leading-tight">🎓 CSU Choose Day</h1>
              <p className="text-purple-100 text-sm sm:text-base mb-5">
                March 29, 2026 — Visit prep for Benny (Lighting / Technical Theater)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: 'Date',     value: 'Sat Mar 29' },
                  { label: 'Hours',    value: '7:30 AM – 4 PM' },
                  { label: 'Check-in', value: 'Moby Arena' },
                  { label: 'Crowd',    value: '~3,000 students' },
                ].map((item) => (
                  <div key={item.label} className="bg-white/20 backdrop-blur rounded-lg p-2.5 sm:p-3 border border-white/25">
                    <div className="text-purple-200 text-xs mb-0.5">{item.label}</div>
                    <div className="text-white font-semibold text-xs sm:text-sm">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key takeaways */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <SectionHeading>🎯 Key Takeaways</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TAKEAWAYS.map((t) => (
                  <div key={t.title} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3.5 border-l-4 border-purple-500">
                    <div className="font-semibold text-sm text-gray-800 mb-1">{t.title}</div>
                    <p className="text-xs text-gray-600 leading-relaxed">{t.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick nav prompts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TABS.filter(t => t.id !== 'overview').map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100
                    hover:border-purple-300 hover:bg-purple-50 active:bg-purple-100 transition-colors"
                >
                  <div className="text-xl mb-1">{tab.icon}</div>
                  <div className="text-xs font-medium text-gray-700">{tab.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <SectionHeading>📅 Day Schedule</SectionHeading>
            <ol className="relative border-l-2 border-purple-200 ml-2 space-y-0">
              {TIMELINE.map((item, idx) => (
                <li key={idx} className="pl-5 pb-5 relative last:pb-0">
                  <span className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-sm" />
                  <div className="text-purple-600 font-semibold text-xs mb-0.5">{item.time}</div>
                  <div className="text-sm text-gray-800">{item.action}</div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* SESSIONS */}
        {activeTab === 'sessions' && (
          <div className="space-y-3">
            <SectionHeading>📍 Session Guide</SectionHeading>
            {SESSIONS.map((session) => {
              const open = expandedSession === session.id;
              return (
                <div key={session.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-all ${open ? 'border-purple-300' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setExpandedSession(open ? null : session.id)}
                    className="w-full text-left flex items-start gap-3 p-4 hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-purple-600 font-semibold text-xs mb-0.5">{session.time}</div>
                      <div className="font-bold text-sm text-gray-800 leading-snug">{session.title}</div>
                      <BadgePill value={session.value} />
                    </div>
                    <span className={`text-purple-500 mt-1 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-90' : ''}`}>▶</span>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                      <p className="text-sm text-gray-700">{session.description}</p>

                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">What to Expect</div>
                        <ul className="space-y-1">
                          {session.details.map((d, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-700">
                              <span className="text-purple-500 flex-shrink-0 font-bold">✓</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {session.questions.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Questions to Ask</div>
                          <ul className="space-y-1">
                            {session.questions.map((q, i) => (
                              <li key={i} className="flex gap-2 text-sm text-gray-700">
                                <span className="text-blue-500 flex-shrink-0 font-bold">?</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <TipBox>{session.tips}</TipBox>
                      {session.parentStrategy && <ParentBox>{session.parentStrategy}</ParentBox>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* STRATEGIES */}
        {activeTab === 'strategies' && (
          <div className="space-y-4">
            <SectionHeading>🎯 Strategies for Success</SectionHeading>
            {STRATEGIES.map((s) => (
              <div key={s.id} className={`bg-gradient-to-br ${s.bg} rounded-xl shadow-sm p-4 sm:p-5 border-t-4 ${s.border}`}>
                <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-3">{s.title}</h3>
                <div className="space-y-3">
                  {s.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{item.title}</div>
                        <div className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QUESTIONS */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <SectionHeading>❓ Questions Checklist</SectionHeading>
            {[
              { title: "Benny's Questions", items: QUESTIONS.benny, accent: 'border-pink-400 bg-pink-50' },
              { title: "Parent's Questions", items: QUESTIONS.parent, accent: 'border-blue-400 bg-blue-50' },
            ].map((block) => (
              <div key={block.title} className={`rounded-xl shadow-sm overflow-hidden border-t-4 ${block.accent} bg-white`}>
                <div className={`px-4 pt-4 pb-2 ${block.accent.includes('pink') ? 'bg-pink-50' : 'bg-blue-50'}`}>
                  <h3 className="font-bold text-sm text-gray-800">{block.title}</h3>
                </div>
                <div className="p-3 space-y-1">
                  {block.items.map((q, i) => <CheckItem key={i} label={q} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PREP */}
        {activeTab === 'prep' && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <SectionHeading>✅ Pre-Visit Checklist</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {PREP_ITEMS.map((item, i) => <CheckItem key={i} label={item} />)}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
