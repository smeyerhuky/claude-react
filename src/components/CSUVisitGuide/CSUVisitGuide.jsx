import React, { useState } from 'react';
import './CSUVisitGuide.css';

export default function CSUVisitGuide() {
  const [expandedSession, setExpandedSession] = useState(null);
  const [expandedStrategy, setExpandedStrategy] = useState(null);

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
        ' 40+ organizations with tables',
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
      color: 'strategy-benny',
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
      color: 'strategy-parent',
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

  return (
    <div className="csu-visit-guide">
      <header className="guide-header">
        <div className="header-content">
          <h1>🎓 CSU Choose Event Guide</h1>
          <p className="subtitle">March 29, 2026 — Comprehensive Visit Prep for Benny (Lighting Technical Theater)</p>
          <div className="key-info">
            <div className="info-box">
              <span className="label">Date:</span>
              <span className="value">Saturday, March 29</span>
            </div>
            <div className="info-box">
              <span className="label">Time:</span>
              <span className="value">~7:30 AM - 4:00 PM</span>
            </div>
            <div className="info-box">
              <span className="label">Check-in:</span>
              <span className="value">Moby Arena</span>
            </div>
            <div className="info-box">
              <span className="label">Expected Attendees:</span>
              <span className="value">~3,000 students</span>
            </div>
          </div>
        </div>
      </header>

      <section className="timeline-section">
        <h2>📅 At-a-Glance Timeline</h2>
        <div className="timeline">
          {timeline.map((item, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-time">{item.time}</div>
              <div className="timeline-action">{item.action}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="strategies-section">
        <h2>🎯 Strategies for Success</h2>
        <div className="strategies-grid">
          {strategies.map((strategy) => (
            <div key={strategy.id} className={`strategy-card ${strategy.color}`}>
              <h3>{strategy.title}</h3>
              <div className="strategy-items">
                {strategy.items.map((item, idx) => (
                  <div key={idx} className="strategy-item">
                    <div className="item-title">{item.title}</div>
                    <div className="item-details">{item.details}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sessions-section">
        <h2>📍 Detailed Session Guide</h2>
        <div className="sessions-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-card ${expandedSession === session.id ? 'expanded' : ''}`}
            >
              <div
                className="session-header"
                onClick={() =>
                  setExpandedSession(expandedSession === session.id ? null : session.id)
                }
              >
                <div className="session-header-left">
                  <div className="session-time">{session.time}</div>
                  <div className="session-title-block">
                    <h3>{session.title}</h3>
                    <span className={`value-badge ${session.value.toLowerCase().replace(/\s+/g, '-')}`}>
                      {session.value}
                    </span>
                  </div>
                </div>
                <div className="expand-icon">
                  {expandedSession === session.id ? '▼' : '▶'}
                </div>
              </div>

              {expandedSession === session.id && (
                <div className="session-details">
                  <p className="session-description">{session.description}</p>

                  <div className="details-block">
                    <h4>What to Expect:</h4>
                    <ul className="details-list">
                      {session.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>

                  {session.questions.length > 0 && (
                    <div className="details-block">
                      <h4>Key Questions to Ask:</h4>
                      <ul className="questions-list">
                        {session.questions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="tip-box">
                    <strong>💡 Tip:</strong> {session.tips}
                  </div>

                  {session.parentStrategy && (
                    <div className="parent-strategy-box">
                      <strong>👨‍👩‍👦 Parent Strategy:</strong> {session.parentStrategy}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="questions-section">
        <h2>❓ Essential Questions Checklist</h2>
        <div className="questions-grid">
          <div className="question-block">
            <h3>For Benny to Ask:</h3>
            <div className="checkbox-list">
              {essentialQuestions.forBenny.map((q, idx) => (
                <label key={idx} className="checkbox-item">
                  <input type="checkbox" />
                  <span>{q}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="question-block">
            <h3>For Parents to Ask:</h3>
            <div className="checkbox-list">
              {essentialQuestions.forParents.map((q, idx) => (
                <label key={idx} className="checkbox-item">
                  <input type="checkbox" />
                  <span>{q}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="prep-section">
        <h2>✅ Pre-Visit Preparation Checklist</h2>
        <div className="prep-checklist">
          <label className="prep-item">
            <input type="checkbox" />
            <span>Charge phone and bring portable charger</span>
          </label>
          <label className="prep-item">
            <input type="checkbox" />
            <span>Wear comfortable walking shoes (lots of campus terrain)</span>
          </label>
          <label className="prep-item">
            <input type="checkbox" />
            <span>Bring a small notebook for Benny to take notes</span>
          </label>
          <label className="prep-item">
            <input type="checkbox" />
            <span>Pack snacks/water (long day, lines at dining)</span>
          </label>
          <label className="prep-item">
            <input type="checkbox" />
            <span>Plan parking/driving route to Moby Arena</span>
          </label>
          <label className="prep-item">
            <input type="checkbox" />
            <span>Bring valid ID (student ID or driver's license)</span>
          </label>
          <label className="prep-item">
            <input type="checkbox" />
            <span>Have Benny review the program ahead of time if available online</span>
          </label>
          <label className="prep-item">
            <input type="checkbox" />
            <span>Decide ahead: will you split during academic session or stay together?</span>
          </label>
          <label className="prep-item">
            <input type="checkbox" />
            <span>Camera or phone ready for photos at CAM meet & greet</span>
          </label>
          <label className="prep-item">
            <input type="checkbox" />
            <span>Bring business cards or paper for collecting contact info from students/faculty</span>
          </label>
        </div>
      </section>

      <section className="key-takeaways">
        <h2>🎯 Key Takeaways</h2>
        <div className="takeaways-content">
          <div className="takeaway">
            <h4>The Main Event</h4>
            <p>
              The <strong>10:00-11:30 AM School of Theatre & Dance academic session</strong> is non-negotiable and worth the entire trip. This is where Benny meets faculty, sees facilities, and talks to current lighting students about their real experience.
            </p>
          </div>
          <div className="takeaway">
            <h4>Connection Over Coverage</h4>
            <p>
              Don't try to hit every session. Focus on depth: get contact info, ask real questions, and build relationships. One meaningful conversation with a current tech student is worth more than skimming five sessions.
            </p>
          </div>
          <div className="takeaway">
            <h4>Debrief Matters</h4>
            <p>
              Use lunch and the resource fair to debrief with Benny about what he learned. Help him synthesize, celebrate wins, and identify remaining questions. This is how the visit solidifies into real understanding.
            </p>
          </div>
          <div className="takeaway">
            <h4>Trust the Schedule, But Stay Flexible</h4>
            <p>
              The event is designed for flexibility. If a session runs long or something amazing happens, stay with it. If you've learned enough by 2:00 PM, it's fine to leave—there's no penalty for heading out early.
            </p>
          </div>
        </div>
      </section>

      <footer className="guide-footer">
        <p>Created for Benny's CSU Visit • March 29, 2026</p>
        <p className="footer-note">
          This guide is a framework, not a rigid schedule. Adjust based on what excites Benny and what questions emerge during the day.
        </p>
      </footer>
    </div>
  );
}
