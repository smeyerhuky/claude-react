import { useState } from 'react';
import Layout1Stacked from '../ascii-render/Layout1Stacked';
import Layout2Sidebar from '../ascii-render/Layout2Sidebar';
import Layout3Drawer  from '../ascii-render/Layout3Drawer';
import Layout4HUD     from '../ascii-render/Layout4HUD';
import Layout5Split   from '../ascii-render/Layout5Split';

const ASCII_LAYOUTS = [
  { id: 'layout1', label: 'STACKED',   desc: 'Full-width stacked layout (classic)', component: Layout1Stacked },
  { id: 'layout2', label: 'SIDEBAR',   desc: 'Canvas + always-visible right sidebar', component: Layout2Sidebar },
  { id: 'layout3', label: 'DRAWER',    desc: 'Full canvas with collapsible icon drawer', component: Layout3Drawer },
  { id: 'layout4', label: 'HUD',       desc: 'Immersive full-screen HUD overlay', component: Layout4HUD },
  { id: 'layout5', label: 'SPLIT',     desc: 'Split dashboard: canvas + matrix + bottom bar', component: Layout5Split },
];

export default function AsciiLanding() {
  const [activeLayout, setActiveLayout] = useState(null);

  if (activeLayout) {
    const item = ASCII_LAYOUTS.find(l => l.id === activeLayout);
    return (
      <div style={{ position:'relative' }}>
        <button
          onClick={() => setActiveLayout(null)}
          style={{
            position:'fixed', top:8, right:8, zIndex:9999,
            background:'rgba(0,0,0,0.7)', color:'#00ff41',
            border:'1px solid #00ff41', padding:'4px 10px',
            fontFamily:'monospace', fontSize:11, cursor:'pointer',
            letterSpacing:2,
          }}
        >✕ BACK</button>
        <item.component />
      </div>
    );
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#050a04',
      fontFamily:"'Courier New',monospace",
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'flex-start',
      padding:'32px 16px',
    }}>
      <div style={{ color:'#00ff41', fontSize:11, letterSpacing:5, marginBottom:4, opacity:.4 }}>
        ▓▒░ ASCII RENDERER ░▒▓
      </div>
      <div style={{ color:'#00ff41', fontSize:18, letterSpacing:4, marginBottom:8 }}>
        LAYOUT SELECTOR
      </div>
      <div style={{ color:'#004400', fontSize:9, letterSpacing:2, marginBottom:32 }}>
        SELECT A WIREFRAME LAYOUT TO EXPLORE
      </div>
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',
        gap:16, width:'100%', maxWidth:900,
      }}>
        {ASCII_LAYOUTS.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setActiveLayout(item.id)}
            style={{
              background:'#020802', border:'1px solid #002a00',
              color:'#00ff41', fontFamily:'monospace',
              padding:'20px 16px', cursor:'pointer',
              textAlign:'left', transition:'border-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#00ff41'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#002a00'}
          >
            <div style={{ fontSize:9, color:'#004400', letterSpacing:2, marginBottom:6 }}>
              OPTION {idx + 1}
            </div>
            <div style={{ fontSize:14, letterSpacing:3, marginBottom:8 }}>
              {item.label}
            </div>
            <div style={{ fontSize:9, color:'#007700', letterSpacing:1, lineHeight:1.5 }}>
              {item.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
