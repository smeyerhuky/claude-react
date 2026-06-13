import AdvancedSpectrogram from '../components/sonic/AdvancedSpectrogramV2'
import GuitarSynthesizer from '../components/sonic/GuitarSynthesizer'
import AIWritingAnalyzer from '../components/llm-tools/AIWritingAnalyzer'
import MarkdownCommentSystem from '../components/MarkdownCommentSystem'
import AdvancedSpackleDashboard from '../components/AdvancedSpackleDashboard'
import MitosisDemo from '../components/MitosisAnimation'
import EnhancedTextBufferProcessor from '../components/EnhancedTextBufferProcessor'
import MermaidReactions from '../components/mermaid/MermaidReactions'
import AWSWars from '../components/AWSWars'
import SyncAudioMesh from '../components/SyncAudioMesh'
import MarkdownViewer from '../components/markdown/MarkdownViewer'
import ShiftBiddingSimulator from '../components/ShiftBiddingSimulator'
import HandGestureTracker from '../components/HandGestureTracker'
import HandMusicInstrument from '../components/HandMusicInstrument'
import HandGesturePlayground from '../components/HandGesturePlayground'
import StargateFederationPitch from '../components/StargateFederationPitch'
import PatternInTheStatic from '../components/PatternInTheStatic'
import NeuralProceduralAnimation from '../components/arxiv-experimental'
import TrieViz from '../components/trie_viz'
import CSUVisitGuide from '../components/CSUVisitGuide/CSUVisitGuide'
import AsciiRenderer from '../components/ascii-render'
import AsciiLanding from '../components/ascii-landing'
import SDLCCompiler from '../components/SDLCCompiler'
import PdfMerger from '../components/PdfMerger'

/**
 * Navigation item shape:
 *   id        – URL slug
 *   label     – human-readable name shown in cards / headers
 *   component – React component to render
 *   category  – grouping key used by HomePage filter tabs
 *   fullscreen – when true the component gets a fixed viewport wrapper
 */

export const CATEGORIES = [
  { id: 'all',         label: 'All' },
  { id: 'audio',       label: '🎵 Audio' },
  { id: 'ai',          label: '🤖 AI / ML' },
  { id: 'visualization', label: '📊 Visualization' },
  { id: 'tools',       label: '🔧 Tools' },
  { id: 'interactive', label: '🕹️ Interactive' },
  { id: 'immersive',   label: '🌌 Immersive' },
]

export const navigationItems = [
  // ── Audio ──────────────────────────────────────────────────────────────────
  { id: 'advanced-spectrogram',       label: 'Advanced Spectrogram',              component: AdvancedSpectrogram,       category: 'audio' },
  { id: 'guitar-synthesizer',         label: 'Guitar Synthesizer',                component: GuitarSynthesizer,         category: 'audio' },
  { id: 'audio',                      label: 'Audio Mesh',                        component: SyncAudioMesh,             category: 'audio' },

  // ── AI / ML ────────────────────────────────────────────────────────────────
  { id: 'ai-writing-analyzer',        label: 'AI Writing Analyzer',               component: AIWritingAnalyzer,         category: 'ai' },
  { id: 'neural-procedural-animation',label: 'Neural Procedural Animation',       component: NeuralProceduralAnimation, category: 'ai', fullscreen: true },
  { id: 'hand-gesture-tracker',       label: 'Hand Gesture Tracker',              component: HandGestureTracker,        category: 'ai' },
  { id: 'hand-music',                 label: 'Hand Music Instrument',             component: HandMusicInstrument,       category: 'ai' },
  { id: 'hand-gesture-playground',    label: 'Hand-Gesture Playground',           component: HandGesturePlayground,     category: 'ai' },

  // ── Visualization ──────────────────────────────────────────────────────────
  { id: 'mermaid-diagram',            label: 'Mermaid Diagram',                   component: MermaidReactions,          category: 'visualization' },
  { id: 'mitosis-animation',          label: 'Mitosis Animation',                 component: MitosisDemo,               category: 'visualization' },
  { id: 'trie-viz',                   label: 'Trie Visualizer',                   component: TrieViz,                   category: 'visualization' },
  { id: 'spackle-dashboard',          label: 'Spackle Dashboard',                 component: AdvancedSpackleDashboard,  category: 'visualization' },

  // ── Tools ──────────────────────────────────────────────────────────────────
  { id: 'markdown-comment',           label: 'Markdown Comments',                 component: MarkdownCommentSystem,     category: 'tools' },
  { id: 'markdown-viewer',            label: 'Markdown Viewer',                   component: MarkdownViewer,            category: 'tools' },
  { id: 'text-buffer-processor',      label: 'Text Buffer Processor',             component: EnhancedTextBufferProcessor, category: 'tools' },
  { id: 'pdf-merger',                 label: 'PDF Merger',                        component: PdfMerger,                 category: 'tools' },
  { id: 'sdlc-compiler',              label: 'SDLC Compiler — LLM Governance',   component: SDLCCompiler,              category: 'tools', fullscreen: true },
  { id: 'ascii-landing',              label: 'ASCII Renderer — Layout Selector',  component: AsciiLanding,              category: 'tools', fullscreen: true },
  { id: 'ascii-renderer',             label: 'ASCII Renderer',                    component: AsciiRenderer,             category: 'tools', fullscreen: true },

  // ── Interactive ────────────────────────────────────────────────────────────
  { id: 'aws-wars',                   label: 'AWS Wars Game',                     component: AWSWars,                   category: 'interactive' },
  { id: 'shift-bidding-app',          label: 'Shift Bidding App',                 component: ShiftBiddingSimulator,     category: 'interactive' },
  { id: 'csu-visit-guide',            label: 'CSU Visit Guide (Benny)',           component: CSUVisitGuide,             category: 'interactive' },

  // ── Immersive / Fullscreen ─────────────────────────────────────────────────
  { id: 'stargate-federation',        label: 'Stargate: The Federation',          component: StargateFederationPitch,   category: 'immersive', fullscreen: true },
  { id: 'stargate-prologue',          label: 'Stargate Prologue: Pattern in the Static', component: PatternInTheStatic, category: 'immersive', fullscreen: true },
]
