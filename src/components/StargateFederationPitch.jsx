import React, { useState } from 'react';
import { Book, Tv, Users, Zap, Globe, Clock, Film, Star } from 'lucide-react';

export default function StargateFederationPitch() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = {
    overview: {
      icon: Tv,
      title: 'Series Overview',
      content: `
# STARGATE: THE FEDERATION
## A New Chapter in Humanity's Journey to the Stars

**Logline:** When Stargate Command discovers that Ancient technology is reverse-engineered from humanity's own future, they must guide Earth's development toward becoming the United Federation while preventing the temporal catastrophe that scattered it across time.

---

## High Concept

**Stargate: The Federation** bridges two legendary science fiction universes through an elegant temporal paradox. It's a series about humanity's destiny written in circular time, where our present learns from our past, which was built on our future.

**The Core Premise:**

The Ancients weren't alien benefactors. They were human descendants from 200-300 years in our future who experienced a catastrophic temporal event that scattered their civilization across millions of years. They reverse-engineered their own future's wreckage and built a new civilization from those fragments.

Now, Stargate Command stands at the nexus of this temporal spiral:
- Learning from Ancient technology (which came from human ingenuity)
- Developing toward the Federation era (guided by Ancient discoveries)
- Trying to prevent or mitigate the temporal catastrophe (without causing it)

---

## Why This Works

**For Stargate Fans:**
- Deepens Ancient mythology with a mind-bending revelation
- Explains why Ancient technology feels almost human-designed
- Provides a roadmap for Earth's future
- Maintains the exploration and discovery that defines Stargate

**For Star Trek Fans:**
- Shows the origin story of the Federation from a new angle
- Explores the development of warp technology, first contact, and interstellar politics
- Examines what happens when humanity's future goes catastrophically wrong
- Provides the temporal mechanics and paradoxes Trek fans love

**For New Audiences:**
- No prior knowledge required - starts fresh with an accessible mystery
- Character-driven drama grounded in relatable human choices
- Big ideas about destiny, free will, and technological progress
- Spectacular visual storytelling combining both universes' aesthetics

---

## The Series Structure

**Season One: Discovery**
The team uncovers the temporal connection and must process the implications while keeping it secret from the IOA and other governments.

**Season Two: Development**
Earth begins developing the technologies that will become the Federation, with SG teams guiding the process using Ancient knowledge.

**Season Three: First Contact**
Humanity makes first contact with species who will become Federation allies, setting the stage for future alliances.

**Season Four: The Fracture**
The temporal catastrophe looms closer as experiments push the boundaries of spacetime.

**Season Five: The Choice**
Humanity must decide whether to prevent the catastrophe (potentially erasing the Ancients) or ensure it happens (preserving causality at terrible cost).
      `
    },
    characters: {
      icon: Users,
      title: 'Characters',
      content: `
# Core Characters

## Dr. Sarah Chen - Lead Scientist (Protagonist)
**Age:** 35 | **Background:** Theoretical physicist specializing in temporal mechanics

Sarah discovered the temporal connection in the Ancient database. Brilliant, driven, and haunted by the weight of knowing humanity's future. She struggles with the ethical implications of guiding technological development based on foreknowledge.

**Character Arc:**
- Season 1: Discovers the truth, becomes obsessed with understanding it
- Season 2-3: Takes responsibility for guiding Earth's development
- Season 4-5: Must decide whether to prevent or enable the catastrophe

**Internal Conflict:** The knowledge of what humanity will become versus the fear of what it will cost.

---

## Commander Marcus Kane - Military Leader
**Age:** 42 | **Background:** Former F-302 pilot, combat veteran

Marcus represents the practical military perspective. Skeptical of temporal mechanics but fiercely protective of Earth's future. Believes humanity should forge its own path rather than follow a predetermined timeline.

**Character Arc:**
- Season 1: Resistant to the temporal paradox concept
- Season 2-3: Becomes convinced Earth must diverge from the Federation timeline
- Season 4-5: Leads the faction wanting to prevent the catastrophe

**Internal Conflict:** Duty to protect Earth versus understanding that some disasters may be necessary.

---

## Dr. Kenji Yamamoto - Ancient Technology Expert
**Age:** 51 | **Background:** Archaeologist and linguist, student of Daniel Jackson

Kenji has spent 20 years studying the Ancients. The revelation that they were human descendants vindicates his theories while devastating his understanding of their culture.

**Character Arc:**
- Season 1: Experiences professional and existential crisis
- Season 2-3: Rebuilds his understanding of Ancient philosophy
- Season 4-5: Discovers the Ancients left specific guidance for this moment

**Internal Conflict:** Scientific objectivity versus emotional connection to the Ancients as ancestors.

---

## Ambassador Tara Singh - Diplomatic Corps
**Age:** 38 | **Background:** International relations, former UN diplomat

Tara joined the Stargate program to foster cooperation between Earth nations. Now she must navigate the politics of forming interstellar alliances while keeping the temporal secret.

**Character Arc:**
- Season 1: Struggles to maintain secrecy from her government
- Season 2-3: Architects Earth's first interstellar treaties
- Season 4-5: Must choose between Earth's interests and the greater timeline

**Internal Conflict:** Transparency versus necessary secrets in diplomacy.

---

## Zephyr (Ancient AI) - The Guide
**Age:** 5 million years (subjective) | **Background:** Ancient consciousness in holographic form

An Ancient who partially ascended and left an AI construct behind to guide humanity through this crucial period. Knows more than it reveals, bound by restrictions against direct interference.

**Character Arc:**
- Season 1: Discovered in the Ancient database, cryptic and limited
- Season 2-3: Gradually reveals more as humanity proves ready
- Season 4-5: Must violate its own programming to save humanity

**Internal Conflict:** Following Ancient non-interference principles versus preventing catastrophe.

---

## Supporting Cast

**General Elizabeth Warren** - SGC Commander, tough pragmatist who demands results

**Dr. Ravi Patel** - Quantum physicist working on warp field theory

**Lt. Maya Rodriguez** - F-302 pilot, represents the next generation

**Professor Dmitri Volkov** - Russian scientist representing international cooperation

**Admiral Chen (Sarah's father)** - Naval officer who doesn't know about the program

---

## Character Relationships

**Sarah & Marcus:** Professional tension evolving into mutual respect and romantic subplot

**Sarah & Kenji:** Mentor-student dynamic reversed as Sarah becomes the expert

**Tara & Marcus:** Philosophical opponents who must work together

**Sarah & Zephyr:** Student and mysterious teacher dynamic with building trust

**The Team vs The IOA:** Constant tension over secrecy and control
      `
    },
    season1: {
      icon: Film,
      title: 'Season 1: Discovery',
      content: `
# Season 1: Discovery
## "The past, present, and future collide"

**Season Arc:** The discovery of the temporal connection and its immediate implications for Stargate Command.

---

## Episode 1: "Fragments"
**Written by:** Series Creator

The team discovers fragments of advanced human technology in Ancient ruins. Initial analysis suggests impossible origins.

**Key Scenes:**
- Opening: Routine mission to Ancient outpost goes wrong when strange artifacts are found
- Daniel Jackson cameo: Brief consultation before he returns to Atlantis
- The moment Sarah realizes the fragments are from Earth's future
- Cliffhanger: First mention of "USS Enterprise" on a corroded hull fragment

---

## Episode 2: "The Report"
**Written by:** Staff Writer

Sarah decrypts the Temporal Incident Report and discovers the United Federation's existence.

**Key Scenes:**
- Sarah working alone late at night, obsessively translating
- The corrupted log file revealing the catastrophe
- Marcus's skepticism: "You're telling me we built time machines and broke time?"
- Team realization: They're looking at their own future's past

---

## Episode 3: "Echoes from Tomorrow"
**Written by:** Staff Writer

The team searches for more Federation fragments while debating whether to tell the IOA.

**Key Scenes:**
- Off-world mission to Fragment Site Gamma-7
- Discovery of intact transporter platform (deactivated)
- Kenji's breakdown: "I've spent my career studying our own grandchildren"
- Decision to keep the discovery classified (for now)

---

## Episode 4: "The Cochrane Papers"
**Written by:** Staff Writer

Sarah investigates current theoretical research and finds unsettling parallels.

**Key Scenes:**
- Meeting with Zefram Cochrane (video call, he's elderly and reclusive)
- Realization that current research is being unconsciously influenced by Ancient tech
- "Are we creating the future or just copying what we already found?"
- Introduction of Dr. Patel and his warp field experiments

---

## Episode 5: "First Contact Protocol"
**Written by:** Staff Writer

The team discovers Ancient records of first contact between Earth and Vulcan.

**Key Scenes:**
- Tara learning about Federation diplomatic principles
- Ancient video footage (degraded) showing a Vulcan ship
- Debate: Should Earth seek out Vulcans now or wait for "natural" development?
- Marcus: "What if we're not supposed to meet them yet?"

---

## Episode 6: "The Witness"
**Written by:** Staff Writer

Zephyr, the Ancient AI, is discovered and activated.

**Key Scenes:**
- The team finding a sealed Ancient facility
- Zephyr's activation: holographic form materializing
- "I have been waiting for you. For this exact moment in your timeline."
- Zephyr's cryptic guidance and programmed limitations
- Revelation: The Ancients knew this would happen and planned for it

---

## Episode 7: "Divergence"
**Written by:** Staff Writer

Sarah and Marcus clash over whether to guide or alter humanity's path.

**Key Scenes:**
- Heated debate in the briefing room
- Marcus: "Just because it happened doesn't mean it has to happen"
- Sarah: "If we change too much, we might erase the Ancients entirely"
- Team splitting into philosophical factions
- Tara mediating: "Maybe we need to do both"

---

## Episode 8: "The Warp Equation"
**Written by:** Staff Writer

Dr. Patel has a breakthrough that matches Federation specifications exactly.

**Key Scenes:**
- Late night eureka moment in the lab
- Sarah recognizing the equation from Ancient records
- "Did I discover this, or did I remember it?"
- Ethical crisis: Should they stop him or help him?
- Decision: Let development proceed but monitor carefully

---

## Episode 9: "Temporal Shadows"
**Written by:** Staff Writer

IOA representative arrives asking questions about classified research.

**Key Scenes:**
- Political tension as IOA demands transparency
- The team scrambling to create cover stories
- General Warren defending her people
- Tara using diplomatic skills to deflect
- Close call: IOA almost discovers the truth

---

## Episode 10: "The Message"
**Written by:** Staff Writer (Mid-Season Finale)

The team discovers an Ancient message specifically addressed to them.

**Key Scenes:**
- Ancient hologram activating with temporal trigger
- Message from an Ancient who remembers being Sarah (in a previous iteration?)
- "We have lived this moment before. Each time differently."
- Revelation: The timeline is a spiral, not a circle
- Each iteration can be better than the last
- Cliffhanger: Zephyr reveals there are others like it, hidden across Earth

---

## Episodes 11-20

**Episode 11: "Hidden Anchors"** - Searching for other Ancient AI constructs

**Episode 12: "The Vulcan Question"** - Long-range sensors detect something near Vulcan's system

**Episode 13: "Acceleration"** - Technological development suddenly speeds up globally

**Episode 14: "The Phoenix Initiative"** - Secret project to build Earth's first warp-capable ship

**Episode 15: "Fracture Lines"** - First signs of temporal instability detected

**Episode 16: "The Opposition"** - Marcus forms a group wanting to prevent the catastrophe

**Episode 17: "Alliance"** - Sarah and Marcus must work together despite philosophical differences

**Episode 18: "The Visitor"** - An Asgard brings a warning about temporal manipulation

**Episode 19: "Point of No Return"** - The warp ship is nearly complete

**Episode 20: "Threshold" (Season Finale)** - First successful warp flight; Sarah sees visions of the future; the temporal catastrophe draws closer; cliffhanger ending suggests someone from the Federation era has made contact
      `
    },
    themes: {
      icon: Star,
      title: 'Themes & Philosophy',
      content: `
# Core Themes

## Destiny vs Free Will

**The Central Question:** If you know your future, are you doomed to repeat it?

The series explores whether humanity can change its destiny while preserving the good that came from it. Characters struggle with:
- Using foreknowledge ethically
- Respecting the timeline while improving it
- Accepting that some pain may be necessary for growth

**Key Scenes:**
- Sarah arguing for preserving the timeline: "The Ancients achieved ascension. We can't risk erasing that."
- Marcus arguing for change: "They also scattered across time in catastrophe. We can do better."

---

## The Bootstrap Paradox

**Where does innovation actually come from?**

The series examines the nature of discovery when humanity is learning from its own future:
- Are current scientists discovering or remembering?
- Does studying Ancient tech count as original research?
- Can humanity truly innovate if it's following a predetermined path?

**Narrative Device:**
Scientists having "eureka moments" that match Ancient records exactly, forcing them to question their own genius.

---

## Responsibility to the Future

**What do we owe the people we'll become?**

Characters must balance present needs against future consequences:
- Should Earth sacrifice now to ensure a better Federation later?
- Is it ethical to guide technological development based on foreknowledge?
- Who gets to decide humanity's path?

**Recurring Conflict:**
The IOA wanting immediate military applications versus the team's long-term planning.

---

## Cultural Evolution

**How does humanity grow up?**

The series traces humanity's journey from isolated planet to interstellar civilization:
- First contact protocols and cultural exchange
- Moving beyond Earth-centric thinking
- Learning to see ourselves as one species among many
- The challenge of maintaining human identity while evolving

**Visual Metaphor:**
Earth gradually changes from closed to open, isolated to connected, as the series progresses.

---

## The Price of Knowledge

**Some truths burden the knower**

Characters carrying the weight of knowing humanity's future:
- Sarah's isolation from friends and family who don't know
- The ethical burden of deciding what to reveal and when
- The psychological toll of living in multiple timelines simultaneously

**Character Study:**
Episodes focusing on how knowledge changes relationships and identity.

---

## Unity Through Adversity

**The Federation's founding principle explored**

The series shows how humanity learns to cooperate:
- International cooperation in the Stargate program
- Species cooperation in the forming Federation
- Temporal cooperation between past, present, and future versions of humanity

**Symbolic Moments:**
- The team as microcosm of future Federation diversity
- Tara's diplomatic victories mirroring Federation founding
- Ancient messages emphasizing unity across time

---

## Science and Wonder

**Maintaining childlike curiosity amid cosmic implications**

Despite heavy themes, the series celebrates discovery:
- The joy of solving impossible physics problems
- Wonder at meeting new species
- Beauty in understanding the universe's temporal mechanics
- Hope that humanity's future, despite catastrophe, is glorious

**Tonal Balance:**
Heavy philosophical questions balanced with moments of pure scientific wonder and human connection.

---

# Philosophical Questions Explored

**Season 1:** Can we know our destiny without becoming slaves to it?

**Season 2:** Does foreknowledge corrupt the purity of discovery?

**Season 3:** What makes us human when we meet non-human intelligence?

**Season 4:** Can catastrophe be prevented without erasing its legacy?

**Season 5:** Is the journey worth it if we know the destination?

---

# The Ancient Philosophy

Throughout the series, we learn the Ancients developed a sophisticated understanding of temporal ethics:

**The Prime Temporal Directive:**
"Observe the past, guide the present, but never dictate the future. Each iteration must choose its own path, or the spiral becomes a cage."

**Their Three Laws:**
1. Knowledge shared freely, but wisdom earned through experience
2. Technology given as tools, never as weapons or shortcuts
3. The timeline preserved in essence, but free in expression

**Why They Left Fragments:**
Not to guide humanity to a specific future, but to show what's possible. The Federation timeline is one path among infinite variations.
      `
    },
    visual: {
      icon: Zap,
      title: 'Visual Design',
      content: `
# Visual Language

## Aesthetic Philosophy

**Stargate: The Federation** blends two distinct visual styles into a cohesive new aesthetic:

**Present Day (SGC):**
- Familiar Stargate Command concrete and metal
- Practical military functionality
- Earth-toned color palette (grays, blues, earth browns)
- Fluorescent lighting, computer screens

**Ancient Technology:**
- Crystalline structures with blue-white energy
- Organic geometric patterns
- Holographic interfaces with Ancient script
- Soft, ambient lighting from within materials

**Federation Era (Fragments & Visions):**
- Sleek curves and smooth metals
- Primary colors: Federation blue, Starfleet delta gold
- LCARS-style interfaces (corrupted and ancient)
- Warm bridge lighting contrasted with cold hull metal

---

## Signature Visual Elements

### Temporal Distortion Effects

When characters experience temporal visions or fragments interact with present-day tech:
- Reality "frays" at the edges
- Multiple timelines visible simultaneously as transparent overlays
- Chromatic aberration suggesting broken causality
- Sound design: echoes from past/future layered together

### The Spiral Motif

The temporal spiral appears throughout:
- Opening credits animation
- Ancient architecture and art
- Energy patterns in Ancient technology
- Visualization of timelines in briefing room
- Reflective surfaces showing past/present/future simultaneously

### Three-Era Transitions

Seamless transitions between time periods:
- Camera push through Ancient crystal → Federation viewscreen → SGC monitor
- Characters walking through time: SGC corridor → Ancient city → Federation ship
- Objects transforming: ZPM → Matter-antimatter reactor → Power cell

---

## Key Locations

### Stargate Command - Level 28 (New Addition)

**Temporal Research Lab:**
- Circular chamber with Ancient technology integrated into SGC infrastructure
- Central holographic projector showing timeline visualizations
- Walls lined with fragment analysis stations
- Zephyr's holographic projection platform (Ancient column in room center)
- Windows overlooking Stargate operations below

**Design Philosophy:**
Military functionality meeting Ancient elegance - cables and conduits running alongside crystalline structures.
      `
    }
  };

  // Simple markdown-like rendering
  const renderContent = (content) => {
    return content.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-indigo-900 mt-6 mb-4">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold text-indigo-800 mt-5 mb-3">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium text-indigo-700 mt-4 mb-2">{line.slice(4)}</h3>;
      }

      // Horizontal rule
      if (line.startsWith('---')) {
        return <hr key={index} className="my-6 border-indigo-200" />;
      }

      // Bold text handling
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={index} className="text-gray-700 mb-2">
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : part
            )}
          </p>
        );
      }

      // List items
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="text-gray-700 ml-4 mb-1 list-disc">
            {line.slice(2)}
          </li>
        );
      }

      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }

      // Regular paragraphs
      return <p key={index} className="text-gray-700 mb-2">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 text-white py-8 px-6 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-10 h-10 text-blue-300" />
            <Clock className="w-8 h-8 text-purple-300" />
          </div>
          <h1 className="text-4xl font-bold mb-2">STARGATE: THE FEDERATION</h1>
          <p className="text-xl text-indigo-200">A Series Pitch Document</p>
          <p className="text-sm text-indigo-300 mt-2 italic">
            "Where the Stargate meets the Enterprise across the river of time"
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto py-2 gap-2">
            {Object.entries(sections).map(([key, section]) => {
              const Icon = section.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    activeSection === key
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-indigo-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderContent(sections[activeSection].content)}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 px-6 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm">
            STARGATE: THE FEDERATION - Series Pitch Document
          </p>
          <p className="text-xs mt-2">
            A crossover concept bridging the Stargate and Star Trek universes through temporal mechanics
          </p>
        </div>
      </footer>
    </div>
  );
}
