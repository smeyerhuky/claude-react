import React, { useState } from 'react';

export default function CSUVisitGuide() {
  const [expandedSession, setExpandedSession] = useState(null);

  const sessions = [
    {
      id: 'checkin',
      time: '7:30-9:00 AM',
      title: 'Early Check-In',
      value: 'High Priority',
      description: 'Beat the crowds at Moby Arena. Get your college grouping assignment and grab complimentary snacks.',
      details: [
        'Arrive by 7:45 AM (early is better than on-time)',
        'Check in at Moby Arena',
        'Spanish language family social available',
        'Get orientation materials and college assignment'
      ],
      questions: [],
      tips: 'Skip the last-minute rush—early arrivals avoid long lines and get better parking.',
    },
    {
      id: 'welcome',
      time: '9:00-9:30 AM',
      title: 'Welcome Session',
      value: 'Moderate',
      description: 'Opening remarks and orientation. Groups separate by college.',
      details: [
        'Listen to opening remarks about the day',
        'Get oriented to the event flow',
        'Benny\'s group separates toward School of Theatre & Dance',
        'Brief overview of activities and logistics'
      ],
      questions: [],
      tips: 'Use this time to mentally prepare for the academic session and decide on your strategy.',
    },
    {
      id: 'academic',
      time: '10:00-11:30 AM',
      title: 'Academic Experience (School of Theatre & Dance)',
      value: 'CRITICAL – Main Event',
      description: 'Tour of theater facilities, meet faculty, connect with current lighting students, learn about the program.',
      details: [
        'Tour of theater facilities (stages, lighting booths, technical spaces)',
        'Meet faculty advisors for lighting/tech track',
        'See current lighting students\' work and hear about their path',
        'Learn about equipment and production opportunities',
        'Q&A with current students and faculty'
      ],
      questions: [
        'What shows run each semester and when does tech crew get involved?',
        'What lighting equipment and systems are available?',
        'Are there mentorship opportunities with upper-level techs?',
        'What is the career outcome for lighting designers/technicians?',
        'How many shows per year? What\'s the technical calendar?',
        'What internship opportunities exist locally or regionally?',
        'How much autonomous responsibility do first-year techs have?',
        'What\'s the typical load (rehearsals, tech hours per week)?'
      ],
      tips: 'This is the heart of the visit. Benny should take notes, ask specifics about first-year experience, and get contact info of student mentors.',
      parentStrategy: 'You can either attend with Benny (great for context) or split up to explore a different college—you\'ll reconnect at lunch.'
    },
    {
      id: 'lunch',
      time: '11:30 AM-2:00 PM',
      title: 'Lunch & Residence Hall Tours',
      value: 'High – Informal Learning',
      description: 'Experience campus dining and see where students actually live.',
      details: [
        'Eat at actual student dining centers (best way to experience real dining)',
        'Alternative: Lory Student Center food court',
        'Residence hall tours: 11:30 AM-1:00 PM slot (pick this one)',
        'Informal time to debrief and process',
        'Benny gets feel for dorm life and community'
      ],
      questions: [
        'What\'s the dining plan like? How many meals included?',
        'Do theater/performance students tend to live together?',
        'How safe is the area around campus?',
        'What dorms are closest to the theater facilities?'
      ],
      tips: 'This is your debrief moment. Ask Benny what excited him, what surprised him, and what he still has questions about.',
      parentStrategy: 'Grab lunch together (Benny should try the actual dining), then do the residence hall tour. This builds context for the resource fair.'
    },
    {
      id: 'resourcefair',
      time: '1:00-2:30 PM',
      title: 'Resource Fair (Lory Student Center)',
      value: 'Moderate-High – Informal Connections',
      description: 'Meet 40+ organizations. Connect with student groups, theater-specific resources, and support services.',
      details: [
        '40+ organizations with tables',
        'School of Theatre & Dance-specific student orgs',
        'Technical theater clubs or production organizations',
        'Housing/residential college options',
        'Support services (mental health, academic support, etc.)',
        'Informal conversations with current students'
      ],
      questions: [
        'What\'s the main tech theater student org? (ask about meetings, projects)',
        'Are there clubs specifically for lighting designers?',
        'What housing options exist for performance students?',
        'What mental health support is available? (performance programs can be high-stress)',
        'Are there peer mentoring programs?'
      ],
      tips: 'This is where you meet current students informally and ask unfiltered questions. Target theater-specific booths first.',
      parentStrategy: 'Attend together. You can introduce yourself to theater faculty and ask parent-focused questions (program structure, safety, support systems).'
    },
    {
      id: 'breakout1',
      time: '2:40-3:10 PM',
      title: 'Breakout Session (Slot 1)',
      value: 'Medium – Context-Dependent',
      description: 'Choose ONE focused session on a topic relevant to unanswered questions.',
      details: [
        'Theater-specific sessions (if offered): production pipeline, design process',
        '"Student Life in Theater/Performance" – what the community is like',
        'Internship/career pathways specific to technical theater',
        'Study abroad opportunities (if theater tours internationally)',
        'Mental health/wellness in high-stress performance programs',
        'Technical skills training or certifications'
      ],
      questions: [
        'Based on the academic session, what\'s still unclear?',
        'Which breakout directly addresses those gaps?'
      ],
      tips: 'Pick ONE breakout that fills gaps from the morning academic session. Skip if you\'re satisfied with what you learned.',
      parentStrategy: 'Benny should attend solo. You can visit CSU Bookstore, take RAMGO photos, or grab last questions with admissions.'
    }
  ];

  const strategies = [
    {
      id: 'benny',
      title: 'Benny\'s Strategy',
      color: 'from-pink-100 to-pink-50',
      borderColor: 'border-pink-400',
      items: [
        {
          title: 'Don\'t miss the morning academic session',
          details: 'School of Theatre & Dance session (10:00-11:30 AM) is where Benny learns about the program, meets faculty, sees facilities, and connects with current lighting students.'
        },
        {
          title: 'Prioritize conversations with current lighting students',
          details: 'Ask about first semester experience, what they wish they\'d known, job placement post-graduation, and whether they have contact info for future questions.'
        },
        {
          title: 'Ask about mentorship',
          details: 'Are there upper-level techs who guide newbies? Is there a formal or informal mentorship structure?'
        },
        {
          title: 'Get contact info',
          details: 'Collect email/Slack handles from faculty and student mentors for follow-up questions after the visit.'
        },
        {
          title: 'Take detailed notes',
          details: 'Jot down key details about shows, tech calendar, equipment, and opportunities so he can compare with other programs.'
        }
      ]
    },
    {
      id: 'parent',
      title: 'Parent Strategy',
      color: 'from-blue-100 to-blue-50',
      borderColor: 'border-blue-400',
      items: [
        {
          title: 'Decide early on splitting up',
          details: 'During the 10:00-11:30 AM academic session, you can either stay with Benny (good for context) or explore a different college (Agricultural Sciences, Business, Engineering, etc.) to see campus breadth.'
        },
        {
          title: 'Attend resource fair together',
          details: 'This is where you can introduce yourself to theater faculty and ask parent-focused questions about program structure, safety, support systems, and community.'
        },
        {
          title: 'Use lunch for debrief',
          details: 'Ask Benny what excited him, what surprised him, and what questions remain. This helps you both synthesize and prepare for the resource fair.'
        },
        {
          title: 'Ask parent-specific questions',
          details: 'Housing safety, mental health support for high-stress programs, academic support resources, financial aid details, community among performing arts students.'
        },
        {
          title: 'Gather logistics info',
          details: 'Move-in dates, required materials for tech students, parking for families, communication channels, emergency contacts.'
        }
      ]
    }
  ];

  const timeline = [
    { time: '7:45 AM', action: 'Arrive early at Moby Arena for check-in' },
    { time: '7:30-9:00 AM', action: 'Check-in, grab snacks, get orientation' },
    { time: '9:00-9:30 AM', action: 'Welcome session (groups separate)' },
    { time: '10:00-11:30 AM', action: '🎭 MAIN: Academic Experience - School of Theatre & Dance' },
    { time: '11:30 AM-1:00 PM', action: 'Lunch at dining center + residence hall tour' },
    { time: '1:00-2:30 PM', action: 'Resource fair (find theater-specific booths)' },
    { time: '2:40-3:10 PM', action: 'Choose ONE breakout session (if questions remain)' },
    { time: '3:10-4:00 PM', action: 'Meet CAM, bookstore, final questions, wrap up' }
  ];

  const essentialQuestions = {
    forBenny: [
      'Can I speak with current first-year lighting students about their experience?',
      'What\'s a typical week like in terms of rehearsals and tech hours?',
      'How much equipment access do first-year students have?',
      'What shows are coming up that I could work on?',
      'Is there a formal mentorship program or do upper-level techs help newbies?',
      'What technical skills do I need to start, and what will I learn here?'
    ],
    forParents: [
      'What support systems exist for students in high-stress performance programs?',
      'How is the community among technical theater students?',
      'What is the career outcome for graduates in this track?',
      'How does the program balance academics with performance commitments?',
      'What resources are available if Benny struggles academically or emotionally?',
      'How often do families come visit? What\'s the campus culture for families?'
    ]
  };

  const getBadgeStyle = (value) => {
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('critical')) return 'bg-red-100 text-red-700';
    if (lowerValue.includes('high') && !lowerValue.includes('moderate')) return 'bg-yellow-100 text-yellow-700';
    if (lowerValue.includes('moderate')) return 'bg-gray-100 text-gray-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 sm:px-6 py-6 sm:py-8 rounded-b-xl shadow-lg mb-6 sm:mb-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight">🎓 CSU Choose Event Guide</h1>
          <p className="text-sm sm:text-base opacity-95">March 29, 2026 — Comprehensive Visit Prep for Benny (Lighting Technical Theater)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Date:', value: 'Saturday, March 29' },
              { label: 'Time:', value: '~7:30 AM - 4:00 PM' },
              { label: 'Check-in:', value: 'Moby Arena' },
              { label: 'Expected:', value: '~3,000 students' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                <div className="text-xs opacity-90 mb-1">{item.label}</div>
                <div className="text-sm sm:text-base font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        {/* Timeline */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-4 sm:mb-6">📅 At-a-Glance Timeline</h2>
          <div className="space-y-4">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="text-purple-600 font-semibold text-xs sm:text-sm sm:min-w-32 flex-shrink-0">{item.time}</div>
                <div className="flex-1 text-xs sm:text-sm text-gray-700 flex items-start gap-2">
                  <span className="inline-block w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1"></span>
                  <span>{item.action}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Strategies */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-4 sm:mb-6">🎯 Strategies for Success</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {strategies.map((strategy) => (
              <div key={strategy.id} className={`bg-gradient-to-br ${strategy.color} rounded-lg shadow-md p-4 sm:p-6 border-t-4 ${strategy.borderColor}`}>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">{strategy.title}</h3>
                <div className="space-y-3 sm:space-y-4">
                  {strategy.items.map((item, idx) => (
                    <div key={idx}>
                      <div className="font-semibold text-sm sm:text-base text-gray-800">{item.title}</div>
                      <div className="text-xs sm:text-sm text-gray-700 mt-1">{item.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sessions */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-4 sm:mb-6">📍 Detailed Session Guide</h2>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <button
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  className="w-full flex justify-between items-start gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm text-purple-600 font-semibold">{session.time}</div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-800 mt-1">{session.title}</h3>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${getBadgeStyle(session.value)}`}>
                      {session.value}
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-lg text-purple-600 transition-transform">
                    {expandedSession === session.id ? '▼' : '▶'}
                  </div>
                </button>

                {expandedSession === session.id && (
                  <div className="p-4 sm:p-6 border-t border-gray-200 space-y-4">
                    <p className="text-sm sm:text-base text-gray-700">{session.description}</p>

                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-gray-800 mb-2">What to Expect:</h4>
                      <ul className="space-y-1">
                        {session.details.map((detail, idx) => (
                          <li key={idx} className="text-xs sm:text-sm text-gray-700 flex gap-2">
                            <span className="text-purple-600 font-bold flex-shrink-0">✓</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {session.questions.length > 0 && (
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-gray-800 mb-2">Key Questions to Ask:</h4>
                        <ul className="space-y-1">
                          {session.questions.map((q, idx) => (
                            <li key={idx} className="text-xs sm:text-sm text-gray-700 flex gap-2">
                              <span className="text-purple-600 font-bold flex-shrink-0">?</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded text-xs sm:text-sm text-gray-800">
                      <strong>💡 Tip:</strong> {session.tips}
                    </div>

                    {session.parentStrategy && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-xs sm:text-sm text-gray-800">
                        <strong>👨‍👩‍👦 Parent:</strong> {session.parentStrategy}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Essential Questions */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-4 sm:mb-6">❓ Essential Questions Checklist</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { title: 'For Benny to Ask:', questions: essentialQuestions.forBenny },
              { title: 'For Parents to Ask:', questions: essentialQuestions.forParents }
            ].map((block, idx) => (
              <div key={idx}>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3">{block.title}</h3>
                <div className="space-y-2">
                  {block.questions.map((q, qIdx) => (
                    <label key={qIdx} className="flex items-start gap-3 p-2 hover:bg-purple-50 rounded cursor-pointer min-h-12">
                      <input type="checkbox" className="mt-1 w-5 h-5 rounded accent-purple-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700">{q}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prep Checklist */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-4 sm:mb-6">✅ Pre-Visit Preparation Checklist</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Charge phone and bring portable charger',
              'Wear comfortable walking shoes (lots of campus terrain)',
              'Bring a small notebook for Benny to take notes',
              'Pack snacks/water (long day, lines at dining)',
              'Plan parking/driving route to Moby Arena',
              'Bring valid ID (student ID or driver\'s license)',
              'Have Benny review the program ahead of time if available online',
              'Decide ahead: will you split during academic session or stay together?',
              'Camera or phone ready for photos at CAM meet & greet',
              'Bring business cards or paper for collecting contact info'
            ].map((item, idx) => (
              <label key={idx} className="flex items-start gap-3 p-2 hover:bg-purple-50 rounded cursor-pointer min-h-12">
                <input type="checkbox" className="mt-1 w-5 h-5 rounded accent-purple-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Key Takeaways */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-4 sm:mb-6">🎯 Key Takeaways</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                title: 'The Main Event',
                text: 'The 10:00-11:30 AM School of Theatre & Dance academic session is non-negotiable and worth the entire trip. This is where Benny meets faculty, sees facilities, and talks to current lighting students about their real experience.'
              },
              {
                title: 'Connection Over Coverage',
                text: 'Don\'t try to hit every session. Focus on depth: get contact info, ask real questions, and build relationships. One meaningful conversation with a current tech student is worth more than skimming five sessions.'
              },
              {
                title: 'Debrief Matters',
                text: 'Use lunch and the resource fair to debrief with Benny about what he learned. Help him synthesize, celebrate wins, and identify remaining questions. This is how the visit solidifies into real understanding.'
              },
              {
                title: 'Trust the Schedule, But Stay Flexible',
                text: 'The event is designed for flexibility. If a session runs long or something amazing happens, stay with it. If you\'ve learned enough by 2:00 PM, it\'s fine to leave—there\'s no penalty for heading out early.'
              }
            ].map((takeaway, idx) => (
              <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border-l-4 border-purple-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-800 mb-2">{takeaway.title}</h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{takeaway.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-600">
        <p className="mb-1">Created for Benny's CSU Visit • March 29, 2026</p>
        <p className="italic text-gray-500">This guide is a framework, not a rigid schedule. Adjust based on what excites Benny and what questions emerge during the day.</p>
      </footer>
    </div>
  );
}
