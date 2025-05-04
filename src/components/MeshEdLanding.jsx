import React, { useState } from 'react';

const MeshEdLanding = () => {
  const [activeTab, setActiveTab] = useState('home');
  
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: '#4CAF50', color: 'white', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            🔬
          </div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>MeshEd Technologies</h1>
        </div>
        
        <nav>
          <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', padding: 0 }}>
            <li>
              <button 
                onClick={() => setActiveTab('home')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: activeTab === 'home' ? '#2196F3' : '#666', 
                  fontWeight: activeTab === 'home' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                Home
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('kits')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: activeTab === 'kits' ? '#2196F3' : '#666', 
                  fontWeight: activeTab === 'kits' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                Kits
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('network')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: activeTab === 'network' ? '#2196F3' : '#666', 
                  fontWeight: activeTab === 'network' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                Network
              </button>
            </li>
            <li>
              <button 
                style={{ 
                  backgroundColor: '#2196F3', 
                  color: 'white', 
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Early Access
              </button>
            </li>
          </ul>
        </nav>
      </header>
      
      {/* Content based on active tab */}
      {activeTab === 'home' && (
        <div>
          <section style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>Distributed Learning Through Environmental Discovery</h1>
            <p style={{ fontSize: '18px', color: '#666', maxWidth: '800px', margin: '0 auto 30px' }}>
              Build your own environmental monitoring network with modular, 
              expandable sensor kits designed for home learning, citizen science, 
              and community environmental projects.
            </p>
            <button style={{ 
              backgroundColor: '#4CAF50', 
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Get Early Access
            </button>
          </section>
          
          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Why MeshEd Technologies?</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h3>Distributed Sensing</h3>
                <p>Capture the full complexity of natural environments with multiple connected sensors.</p>
              </div>
              <div style={{ flex: 1, minWidth: '250px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h3>Modular Expansion</h3>
                <p>Grow your network as your interests and scientific questions evolve.</p>
              </div>
              <div style={{ flex: 1, minWidth: '250px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h3>Real-world Learning</h3>
                <p>Move beyond simulations to authentic environmental investigation.</p>
              </div>
            </div>
          </section>
        </div>
      )}
      
      {activeTab === 'kits' && (
        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Environmental Monitoring Kits</h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '2px solid #4CAF50' }}>
              <h3 style={{ color: '#4CAF50' }}>BioDiver Kit</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Backyard Biodiversity Observer</p>
              <p>Transform your yard into a living wildlife monitoring station that automatically identifies and tracks local species.</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Motion-activated wildlife cameras</li>
                <li>Passive infrared sensors</li>
                <li>Sound identification microphones</li>
                <li>Plant phenology monitoring</li>
              </ul>
            </div>
            
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '2px solid #2196F3' }}>
              <h3 style={{ color: '#2196F3' }}>ClimateSphere Kit</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Microclimate Mapper</p>
              <p>Create detailed environmental maps of your property to understand sunlight, temperature, and microclimate variations.</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Temperature/humidity grid sensors</li>
                <li>Wind speed/direction sensor</li>
                <li>Light intensity & UV monitoring</li>
                <li>Barometric pressure sensors</li>
              </ul>
            </div>
            
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '2px solid #FF9800' }}>
              <h3 style={{ color: '#FF9800' }}>EnergyPulse Kit</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Home Energy Investigator</p>
              <p>Monitor and optimize home energy usage through data collection that identifies inefficiencies and tracks improvements.</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Non-invasive electricity monitors</li>
                <li>Temperature sensors for thermal efficiency</li>
                <li>Light level sensors</li>
                <li>HVAC airflow monitors</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'network' && (
        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Mesh Network Technology</h2>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <p style={{ marginBottom: '20px' }}>
              Every MeshEd kit uses the same core mesh networking technology, allowing them to work together in a unified environmental monitoring system.
            </p>
            <div style={{ margin: '30px 0', textAlign: 'center' }}>
              <svg width="500" height="300" viewBox="0 0 500 300" style={{ maxWidth: '100%' }}>
                {/* Lines representing connections */}
                <line x1="120" y1="100" x2="240" y2="150" stroke="#2196F3" strokeWidth="2" />
                <line x1="120" y1="100" x2="160" y2="220" stroke="#2196F3" strokeWidth="2" />
                <line x1="240" y1="150" x2="160" y2="220" stroke="#2196F3" strokeWidth="2" />
                <line x1="240" y1="150" x2="350" y2="120" stroke="#2196F3" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="160" y1="220" x2="280" y2="240" stroke="#2196F3" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="120" y1="100" x2="80" y2="180" stroke="#2196F3" strokeWidth="2" strokeDasharray="5,5" />
                
                {/* Nodes */}
                <circle cx="120" cy="100" r="15" fill="#2196F3" />
                <circle cx="240" cy="150" r="15" fill="#2196F3" />
                <circle cx="160" cy="220" r="15" fill="#2196F3" />
                <circle cx="350" cy="120" r="15" fill="#4CAF50" />
                <circle cx="280" cy="240" r="15" fill="#4CAF50" />
                <circle cx="80" cy="180" r="15" fill="#4CAF50" />
                
                {/* Node labels */}
                <text x="120" y="80" textAnchor="middle" fontSize="12" fontWeight="bold">Kitchen</text>
                <text x="240" y="130" textAnchor="middle" fontSize="12" fontWeight="bold">Living Room</text>
                <text x="160" y="200" textAnchor="middle" fontSize="12" fontWeight="bold">Garden</text>
                <text x="350" y="100" textAnchor="middle" fontSize="12" fontWeight="bold">Bedroom</text>
                <text x="280" y="220" textAnchor="middle" fontSize="12" fontWeight="bold">Patio</text>
                <text x="80" y="160" textAnchor="middle" fontSize="12" fontWeight="bold">Basement</text>
                
                {/* Data packet animation */}
                <circle cx="180" cy="140" r="5" fill="#FF9800" />
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2196F3' }}></div>
                <span>Core Nodes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#4CAF50' }}></div>
                <span>Extension Nodes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF9800' }}></div>
                <span>Data Flow</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer style={{ marginTop: '60px', padding: '20px 0', borderTop: '1px solid #eee', textAlign: 'center', color: '#666' }}>
        <p>© 2025 MeshEd Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MeshEdLanding;