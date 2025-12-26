import React, { useState, useEffect } from 'react';
import { Book } from 'lucide-react';

export default function PatternInTheStatic() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = (window.scrollY / documentHeight) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-700 z-50">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Title page */}
      <div className="min-h-screen flex flex-col items-center justify-center p-8 border-b border-slate-700">
        <div className="text-center max-w-2xl">
          <Book className="w-16 h-16 mx-auto mb-8 text-blue-400" />
          <h1 className="text-5xl font-serif mb-4 tracking-wide text-slate-100">
            THE PATTERN IN THE STATIC
          </h1>
          <p className="text-xl text-slate-400 mb-8 font-serif italic">
            A Stargate/Star Trek Temporal Convergence
          </p>
          <div className="text-sm text-slate-500 uppercase tracking-widest">
            Prologue
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-16">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-wider text-slate-500 font-sans">
              Cheyenne Mountain Complex, Stargate Command - Present Day
            </p>
          </div>

          <div className="space-y-6">
            <Paragraph>
              Dr. Daniel Jackson's hand trembled slightly as he adjusted the Ancient database interface. The holographic display flickered, casting blue light across the artifacts scattered on his workbench: a ZPM running at 3% capacity, fragments of Ancient text from Atlantis, and now this. A data crystal recovered from a previously unexplored section of Proclarush Taonas.
            </Paragraph>

            <Paragraph quote>
              "Sam, you need to see this."
            </Paragraph>

            <Paragraph>
              Colonel Samantha Carter looked up from the energy readings she'd been analyzing. "Another repository download giving you headaches?"
            </Paragraph>

            <Paragraph quote>
              "No, this is different." Daniel's voice had that particular quality, excitement mixed with profound confusion, that usually preceded weeks of translation work. "This crystal is labeled as an archaeological record. The Ancients documenting their own archaeological discoveries."
            </Paragraph>

            <Paragraph>
              He activated the projection. Ancient text cascaded across the display, and beneath it, a strange technological artifact appeared: corroded, incomplete, but clearly manufactured with incredible precision.
            </Paragraph>

            <Paragraph>
              Sam leaned forward, her eyes narrowing. "Is that... Daniel, run a spectroscopic analysis on that fragment."
            </Paragraph>

            <Paragraph>
              Daniel pulled up the Ancient scan data. Sam studied the readout, her expression shifting from curiosity to disbelief.
            </Paragraph>

            <Paragraph quote>
              "That can't be right." She pulled the data to her own tablet, fingers moving quickly across the interface. "The atomic structure... Daniel, this is a titanium-aluminum-vanadium composite. But the specific ratios, the crystalline alignment, the manufacturing precision, this is beyond anything we can produce now. This is beyond anything the Ancients could produce with the technology we've seen from them."
            </Paragraph>

            <Paragraph quote>
              "According to the Ancients' own carbon dating and radiometric analysis, this fragment is approximately fifty million years old," Daniel said. "They found it already ancient when they discovered it."
            </Paragraph>

            <Paragraph quote>
              "That's impossible. Earth didn't even have advanced life fifty million years ago, let alone metallurgy this sophisticated."
            </Paragraph>

            <Paragraph quote>
              "I know. But the Ancients found it anyway. Along with hundreds of other fragments." Daniel pulled up more images: pieces of hull plating, corroded power conduits, shattered crystal matrices, fragmented computer cores. "They discovered these ruins on dozens of worlds across multiple galaxies. And they couldn't explain where they came from."
            </Paragraph>

            <Paragraph>
              Sam was running more analyses now, comparing the Ancient scans against Earth's materials database. "These alloys... some of them match theoretical compositions in our most advanced research programs. Stuff we haven't even successfully manufactured yet because the energy requirements are prohibitive. But someone made this. And according to the dating, millions of years before the Ancients."
            </Paragraph>

            <Paragraph quote>
              "There's more," Daniel said, pulling up technical schematics the Ancients had painstakingly reconstructed from the fragments. "Look at this power system."
            </Paragraph>

            <Paragraph>
              A complex energy device materialized in the hologram: a chamber with magnetic containment fields, matter and antimatter injection ports, plasma conduits radiating outward in a specific geometric pattern.
            </Paragraph>

            <Paragraph>
              Sam stood up, moving closer to the projection. "That's... Daniel, that's a matter-antimatter reactor. The design is more sophisticated than anything in our current research, but the fundamental principles are identical to the theoretical frameworks in the Cochrane propulsion papers."
            </Paragraph>

            <Paragraph quote>
              "The what papers?"
            </Paragraph>

            <Paragraph quote>
              "Zefram Cochrane. Theoretical physicist, currently working on advanced propulsion systems." Sam was pulling up classified files on her tablet now. "His work is highly classified. Most of it is pure theory right now. We don't have the technology to build what he's proposing. But he's laid out the mathematical framework for a sustained matter-antimatter reaction that could, theoretically, generate enough power to warp space itself."
            </Paragraph>

            <Paragraph>
              She compared Cochrane's theoretical diagrams to the Ancient reconstruction. "It's the same design. Not similar. The same. The geometry of the magnetic containment, the plasma flow dynamics, even the dilithium crystal matrix stabilization. Someone built what Cochrane is theorizing about. And the Ancients found the wreckage millions of years ago."
            </Paragraph>

            <Paragraph>
              Daniel pulled up another schematic. "What about this?"
            </Paragraph>

            <Paragraph>
              A device materialized: cylindrical platform, emitter arrays in a precise configuration, pattern buffer chambers, targeting scanners.
            </Paragraph>

            <Paragraph>
              Sam circled the hologram slowly. "Molecular transport. Subspace carrier wave, pattern buffer, Heisenberg compensators..." She looked at Daniel. "This is a transporter. An actual, functional molecular transport system. We have theoretical papers on this technology. It's decades away from practical implementation. Maybe a century. But someone built it. And it's been sitting in ruins for millions of years."
            </Paragraph>

            <Paragraph quote>
              "Sam, how is this possible?"
            </Paragraph>

            <Paragraph quote>
              "I don't know." She was scrolling through more fragments now, her analytical mind cataloging impossibilities. "Replicator technology, we have early-stage matter synthesis research, but this is orders of magnitude more advanced. Medical scanners that can operate at the quantum level. Weapons that manipulate subspace itself. This is all human-derived physics, human engineering principles, but executed with a level of sophistication we won't achieve for... I don't know. Centuries?"
            </Paragraph>

            <Paragraph>
              Daniel was watching her carefully. "You keep saying 'human-derived.' Why?"
            </Paragraph>

            <Paragraph quote>
              "Because it is." Sam pulled up a materials analysis. "Look at this alloy composition. It's optimized for human physiological comfort. Specific thermal conductivity, electromagnetic shielding tuned to protect against radiation wavelengths dangerous to human DNA. These weren't built by the Asgard or the Ancients or any other species. These were built by us. By humans. Or by something that evolved from humans."
            </Paragraph>

            <Paragraph quote>
              "But millions of years ago, according to the dating."
            </Paragraph>

            <Paragraph quote>
              "According to the Ancients' dating," Sam corrected. "They found these fragments and assumed they were ancient. But what if they're not ancient at all? What if they're from the future?"
            </Paragraph>

            <Paragraph>
              Daniel stared at her. "Sam, that's..."
            </Paragraph>

            <Paragraph quote>
              "The only explanation that makes sense." She pulled up the reactor schematic again. "These technologies are all logical extensions of current human research. Warp drive, transporters, advanced materials science, molecular synthesis, we're already working on the theoretical foundations. In two hundred, three hundred years, if we survive and keep advancing, we could build this. All of it."
            </Paragraph>

            <Paragraph>
              She gestured at the hologram. "But if these were built in our future, how did fragments end up millions of years in the past for the Ancients to find?"
            </Paragraph>

            <Paragraph>
              Daniel was scrolling through the Ancient records. "The Ancients asked the same question. Listen to this." He read from the translation:
            </Paragraph>

            <Paragraph quote>
              "The Fragments of the First Ones remain our greatest mystery. We have found them scattered across the cosmos, artifacts of a civilization that possessed remarkable technology, yet we find no evidence of their cities, their worlds, their people. Only fragments, as if their entire existence was shattered and scattered across space and time."
            </Paragraph>

            <Paragraph quote>
              "Scattered across space and time," Sam repeated. "Daniel, what if that's literal? What if there was some kind of catastrophic temporal displacement event?"
            </Paragraph>

            <Paragraph quote>
              "A temporal explosion?"
            </Paragraph>

            <Paragraph quote>
              "Or collapse. Or fracture." Sam was pulling up theoretical physics models now. "If there was a massive enough disruption to spacetime, an experiment gone wrong, a warp core breach at critical scale, a subspace rupture during faster-than-light travel, matter and energy could be scattered across the temporal axis. Forward, backward, across millions of years."
            </Paragraph>

            <Paragraph>
              She started running calculations on her tablet. "The energy required would be immense, but if you had a fleet of ships, all running matter-antimatter reactors, all connected through some kind of shared power grid or warp field... a cascade failure could potentially tear a hole through causality itself."
            </Paragraph>

            <Paragraph>
              Daniel pulled up more fragment images. "Sam, look at these hull markings."
            </Paragraph>

            <Paragraph>
              Partial lettering appeared on several fragments, corroded, barely legible, but present:
            </Paragraph>

            <div className="my-8 pl-8 border-l-4 border-blue-500 space-y-1">
              <p className="text-slate-300 font-mono">...CC-170...</p>
              <p className="text-slate-300 font-mono">...S Voya...</p>
              <p className="text-slate-300 font-mono">...NCC-7...</p>
              <p className="text-slate-300 font-mono">...arfleet...</p>
            </div>

            <Paragraph>
              Sam felt her breath catch. "NCC. That's a naval construction code. Starfleet... Daniel, some of these fragments have text on them."
            </Paragraph>

            <Paragraph quote>
              "The Ancients couldn't decipher it. They tried for thousands of years." He pulled up their translation attempts: dozens of failed linguistic models, pattern recognition algorithms, frequency analyses. "They catalogued every symbol but couldn't establish meaning."
            </Paragraph>

            <Paragraph>
              Sam was staring at the fragments. "That's because it's English. Or a derivative of English. '...arfleet' is probably 'Starfleet.' That fragment says 'USS Voya,' possibly Voyager. These are ship names. Ship registries."
            </Paragraph>

            <Paragraph quote>
              "Ships from Earth's future," Daniel said slowly. "That somehow ended up in Earth's past."
            </Paragraph>

            <Paragraph quote>
              "Not somehow. There's a record." Sam pulled up a partially reconstructed data fragment the Ancients had recovered from one of the computer cores. The translation matrix had failed, but she could see the underlying code structure. "Daniel, can you bypass the Ancient translation protocol and give me the raw data?"
            </Paragraph>

            <Paragraph>
              He worked the interface for a moment, then the corrupted text appeared in its original form.
            </Paragraph>

            <Paragraph>
              Sam read it, her voice barely above a whisper:
            </Paragraph>

            <Paragraph quote>
              "Temporal Incident Report, Classified Omega. Stardate 63... the numbers are corrupted. Catastrophic failure of experimental transwarp conduit has resulted in... something... displacement event. Initial estimates suggest temporal scatter effect extending... corrupted again... million years in both directions from point of origin."
            </Paragraph>

            <Paragraph>
              She continued reading, her voice getting quieter:
            </Paragraph>

            <Paragraph quote>
              "Fleet elements caught in displacement field: USS Enterprise NCC-1701, corrupted. USS Voyager NCC, corrupted. Multiple vessels from multiple allied species. Stations and outposts. Total personnel, corrupted."
            </Paragraph>

            <Paragraph>
              Her hands were shaking slightly now.
            </Paragraph>

            <Paragraph quote>
              "Reality fracture appears to have... corrupted... timeline into non-linear state. Fragments of displaced matter detected across multiple temporal epochs. United Federation of... corrupted... recommend... corrupted."
            </Paragraph>

            <Paragraph>
              The text cut off abruptly.
            </Paragraph>

            <Paragraph quote>
              "It cannot be repaired. Timeline has become... corrupted. We are... and that's it. That's where it ends."
            </Paragraph>

            <Paragraph quote>
              "United Federation," Daniel read over her shoulder. "Sam, what is that?"
            </Paragraph>

            <Paragraph quote>
              "I don't know," she admitted. "But based on this report, based on these technologies, based on the ship registries and the engineering principles... I think it's us. Or what we become. Two to three hundred years from now, humanity develops these technologies. We build starships, the USS Enterprise, USS Voyager, others. We form some kind of United Federation. Multiple species, advanced technology, exploration vessels."
            </Paragraph>

            <Paragraph quote>
              "And then something goes wrong," Daniel said, reading the report again. "A transwarp experiment. Catastrophic failure. Temporal displacement event."
            </Paragraph>

            <Paragraph quote>
              "Ships, stations, personnel, all scattered across millions of years." Sam pulled up the fragment distribution data the Ancients had mapped. "Look at this. The Ancients found fragments spread across a span of approximately fifty million years. Some in their deep past, some in their contemporary era, probably some even further forward that they never discovered."
            </Paragraph>

            <Paragraph quote>
              "Like shrapnel from a bomb," Daniel said. "Except the explosion went through time instead of just space."
            </Paragraph>

            <Paragraph quote>
              "Exactly." Sam was running through the implications now, her mind racing ahead. "The Ancients, millions of years ago, found these fragments from Earth's future. They didn't know what they were, just incredibly advanced technology from an unknown civilization. So they studied it. Reverse-engineered what they could. Used those principles to develop their own technology."
            </Paragraph>

            <Paragraph>
              Daniel pulled up Ancient technical documentation. "The hyperdrive systems. Sam, look at the design evolution notes."
            </Paragraph>

            <Paragraph>
              Ancient text appeared, with schematics showing iterative development. Daniel translated:
            </Paragraph>

            <Paragraph quote>
              "Initial hyperdrive prototype based on principles derived from Fragment 247-A. The fragment contained a propulsion system using controlled spatial distortion. We have adapted this concept to create sustained faster-than-light travel without the apparent instability that destroyed the First Ones' vessels."
            </Paragraph>

            <Paragraph quote>
              "They reverse-engineered warp drive fragments and created hyperdrives," Sam said. "A different solution to the same problem. More stable, more efficient, refined over millions of years of development."
            </Paragraph>

            <Paragraph quote>
              "And the Stargates?" Daniel asked.
            </Paragraph>

            <Paragraph>
              More Ancient documentation appeared. Daniel translated again:
            </Paragraph>

            <Paragraph quote>
              "The transport devices of the First Ones operated on molecular disassembly principles. Fascinating but limited by range and power requirements. We have evolved this concept into a point-to-point wormhole system capable of instantaneous transport across galactic distances."
            </Paragraph>

            <Paragraph quote>
              "Transporters became Stargates," Sam breathed. "The Ancients found transporter fragments, understood the underlying physics of matter-stream technology, and evolved it into something completely different. Same principle, moving matter from point A to point B, but a revolutionary new implementation."
            </Paragraph>

            <Paragraph quote>
              "ZPMs?" Daniel prompted.
            </Paragraph>

            <Paragraph>
              Daniel read the Ancient text:
            </Paragraph>

            <Paragraph quote>
              "First Ones' power generation relied on matter-antimatter annihilation. Crude but effective. We have refined this into zero-point energy extraction, tapping the quantum vacuum itself. Vastly more efficient and without the catastrophic failure risk that apparently destroyed the First Ones' civilization."
            </Paragraph>

            <Paragraph quote>
              "They learned from the failure," Daniel realized. "The temporal catastrophe was caused by these technologies. So the Ancients built better, safer versions. Hyperdrives instead of warp drives. Stargates instead of transporters. ZPMs instead of matter-antimatter reactors."
            </Paragraph>

            <Paragraph>
              Sam nodded slowly. "And they left all of it for us to find. We're studying Ancient technology right now, learning principles that came from human engineering in the first place. Engineering that won't be developed for centuries, but which has been sitting in the past for millions of years because of a temporal disaster."
            </Paragraph>

            <Paragraph quote>
              "So we learn from the Ancients," Daniel said, working through the timeline. "We develop our technology based on what we discover. In two or three hundred years, that development leads to this United Federation, to ships named Enterprise and Voyager, to experiments with transwarp travel..."
            </Paragraph>

            <Paragraph quote>
              "Which fail catastrophically and scatter everything across time," Sam continued. "The fragments land in the Ancient era. The Ancients find them, evolve them, leave their technology for us. And the cycle continues."
            </Paragraph>

            <Paragraph quote>
              "But it's not a loop," Daniel said. "It's a spiral. Each iteration is different. The Ancients built things the Federation never imagined. We'll build things neither civilization thought possible."
            </Paragraph>

            <Paragraph>
              Sam was staring at the fragment data, at the scattered remains of ships that wouldn't be built for centuries but had been ruins for millions of years.
            </Paragraph>

            <Paragraph quote>
              "Daniel," she said quietly. "We need to tell General O'Neill about this."
            </Paragraph>

            <Paragraph quote>
              "Tell me about what?"
            </Paragraph>

            <Paragraph>
              They both jumped. Jack O'Neill was standing in the doorway with Teal'c, coffee in hand.
            </Paragraph>

            <Paragraph quote>
              "Sir! How long have you been there?"
            </Paragraph>

            <Paragraph quote>
              "Long enough to hear something about time travel and things that haven't happened yet being millions of years old," Jack said, walking into the lab. "Which usually means I need more coffee before the headache starts."
            </Paragraph>

            <Paragraph>
              Sam took a breath. "Sir, the Ancients found fragments of technology millions of years ago. Technology they couldn't identify or fully understand. They reverse-engineered what they could and built their entire civilization on those principles."
            </Paragraph>

            <Paragraph quote>
              "Okay. So?"
            </Paragraph>

            <Paragraph quote>
              "So those fragments are from Earth's future," Daniel said. "From a human civilization that will exist approximately two to three hundred years from now. A civilization that called itself the United Federation."
            </Paragraph>

            <Paragraph>
              Jack stopped mid-sip. "Come again?"
            </Paragraph>

            <Paragraph>
              Sam gestured to the holograms. "These fragments contain technologies that match theoretical research we're conducting right now. Warp propulsion, molecular transport, advanced materials science. But executed with a level of sophistication we won't achieve for centuries. The Ancients found them millions of years ago because of a temporal displacement event. An experiment in our future went catastrophically wrong and scattered ships, stations, everything across millions of years of timeline."
            </Paragraph>

            <Paragraph quote>
              "You're telling me," Jack said slowly, "that the Ancients built all their super-advanced technology by reverse-engineering wreckage from Earth's future that landed in Earth's past."
            </Paragraph>

            <Paragraph quote>
              "Yes, sir."
            </Paragraph>

            <Paragraph quote>
              "And we're now studying Ancient technology, which is based on future human technology, which will be built using knowledge we're gaining from studying Ancient technology."
            </Paragraph>

            <Paragraph quote>
              "Yes, sir."
            </Paragraph>

            <Paragraph>
              Jack set down his coffee very carefully. "I'm going to need a very large drink. And possibly a nap. Maybe in that order."
            </Paragraph>

            <Paragraph quote>
              "O'Neill," Teal'c said, studying the fragment analysis with his usual calm intensity. "If this is accurate, it suggests that humanity's technological development is not linear. We are learning from our own future, which learned from our deep past, which learned from our near future."
            </Paragraph>

            <Paragraph quote>
              "It's a three-way temporal connection," Sam said. "Us, the United Federation, and the Ancients. All connected by a catastrophe that hasn't happened yet but whose results have been sitting in the past for millions of years."
            </Paragraph>

            <Paragraph quote>
              "I hate time travel," Jack muttered. But he was looking at the holographic fragments with something more than just frustration. There was a hint of wonder there too, buried under the resignation.
            </Paragraph>

            <Paragraph>
              The conversation continued for hours, unraveling the impossible temporal spiral that connected three civilizations across millions of years. By the time they finished, one thing was clear: humanity's journey to the stars was far more complex than anyone had imagined.
            </Paragraph>

            <Paragraph>
              The past was their future.
            </Paragraph>

            <Paragraph>
              The future was their past.
            </Paragraph>

            <Paragraph>
              And the present was the only moment where any of it made sense.
            </Paragraph>
          </div>
        </div>

        {/* End marker */}
        <div className="text-center mt-20 mb-12">
          <div className="inline-block">
            <div className="text-slate-500 text-sm uppercase tracking-widest">
              End Prologue
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-slate-600"></div>
              <div className="w-2 h-2 bg-slate-600 rotate-45"></div>
              <div className="h-px w-12 bg-slate-600"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 py-8 text-center text-sm text-slate-500">
        <p>A temporal convergence of humanity's past, present, and future</p>
      </div>
    </div>
  );
}

function Paragraph({ children, quote }) {
  return (
    <p
      className="text-lg leading-relaxed font-serif text-slate-200 first-letter:text-2xl first-letter:font-bold first-letter:text-blue-400"
      style={{
        textIndent: quote ? '0' : '2em',
        textAlign: 'justify',
        hyphens: 'auto'
      }}
    >
      {children}
    </p>
  );
}
