import { useState, useEffect, useRef } from 'react';

const MeshEdAnnouncement = () => {
  const [activeKit, setActiveKit] = useState(0);
  const [animationState, setAnimationState] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const networkRef = useRef(null);
  
  // Animation timing effect
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationState((prev) => (prev + 1) % 4);
    }, 3000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Kit information
  const kits = [
    {
      id: 'biodiverkit',
      name: 'BioDiver Kit',
      fullName: 'Backyard Biodiversity Observer',
      color: '#4CAF50',
      icon: '🦋',
      description: 'Transform your yard into a living wildlife monitoring station. Track and identify local species with automated detection.',
      components: ['Motion-activated wildlife cameras', 'Passive infrared sensors', 'Microphones for bird/insect identification', 'Plant phenology monitoring'],
      extensions: ['Soil quality testing', 'Insect monitoring', 'Water quality for ponds', 'Local ecology database']
    },
    {
      id: 'climatespherekit',
      name: 'ClimateSphere Kit',
      fullName: 'Microclimate Mapper',
      color: '#2196F3',
      icon: '🌡️',
      description: 'Create detailed environmental maps of your property. Understand sunlight, temperature variation, and microclimates.',
      components: ['Temperature/humidity grid sensors', 'Wind speed/direction', 'Light intensity & UV monitoring', 'Barometric pressure'],
      extensions: ['Soil temperature probes', 'Frost detection', 'Evapotranspiration calculation', 'Weather prediction tools']
    },
    {
      id: 'energypulsekit',
      name: 'EnergyPulse Kit',
      fullName: 'Home Energy Investigator',
      color: '#FF9800',
      icon: '⚡',
      description: 'Monitor and optimize home energy usage through data. Identify inefficiencies and track improvements.',
      components: ['Electricity monitors for circuits', 'Temperature sensors for thermal efficiency', 'Light level sensors', 'HVAC airflow monitors'],
      extensions: ['Smart plug integration', 'Water usage monitoring', 'Solar production tracking', 'Seasonal reporting']
    },
    {
      id: 'airscopekit',
      name: 'AirScope Kit',
      fullName: 'Air Quality Network',
      color: '#9C27B0',
      icon: '💨',
      description: 'Track indoor and outdoor air quality patterns. Monitor particulates, CO2, VOCs and correlate with activities.',
      components: ['Particulate matter sensors (PM2.5, PM10)', 'CO2 concentration monitors', 'VOC sensors', 'Air flow measurement'],
      extensions: ['Pollen detection', 'Activity correlation', 'Ventilation testing', 'Regional data integration']
    },
    {
      id: 'hydronetkit',
      name: 'HydroNet Kit',
      fullName: 'Community Water Monitor',
      color: '#03A9F4',
      icon: '💧',
      description: 'Track water quality and usage across residential areas. Monitor rainfall, irrigation, and water conservation efforts.',
      components: ['Water quality sensors (pH, turbidity)', 'Rainwater collection measurement', 'Moisture mapping', 'Flood/water level monitoring'],
      extensions: ['Contaminant detection', 'Watershed mapping', 'Irrigation automation', 'Citizen science data sharing']
    }
  ];
  
  // SVG animation for mesh network
  const MeshNetworkAnimation = () => {
    const nodes = [
      { id: 'node1', x: 100, y: 100, type: 'core' },
      { id: 'node2', x: 220, y: 160, type: 'core' },
      { id: 'node3', x: 150, y: 240, type: 'core' },
      { id: 'node4', x: 300, y: 120, type: 'extension', active: animationState > 0 },
      { id: 'node5', x: 280, y: 240, type: 'extension', active: animationState > 1 },
      { id: 'node6', x: 50, y: 180, type: 'extension', active: animationState > 2 }
    ];

    const getNodeColor = (type, active) => {
      if (type === 'core') return '#2196F3';
      return active ? '#4CAF50' : '#9E9E9E';
    };

    // Create connections between nodes based on animation state
    const connections = [];
    
    // Core mesh connections (always active)
    connections.push({ from: 'node1', to: 'node2' });
    connections.push({ from: 'node2', to: 'node3' });
    connections.push({ from: 'node1', to: 'node3' });
    
    // Extension connections based on animation state
    if (animationState > 0) connections.push({ from: 'node2', to: 'node4' });
    if (animationState > 1) connections.push({ from: 'node3', to: 'node5' });
    if (animationState > 2) {
      connections.push({ from: 'node1', to: 'node6' });
      connections.push({ from: 'node3', to: 'node6' });
    }
    
    // Function to draw a pulsing data packet on a connection
    const DataPacket = ({ fromNode, toNode, animationDelay }) => {
      const fromNodeObj = nodes.find(n => n.id === fromNode);
      const toNodeObj = nodes.find(n => n.id === toNode);
      
      if (!fromNodeObj || !toNodeObj) return null;
      
      // Generate a unique animation name for this specific path
      const animationName = `move-${fromNode}-to-${toNode}`;
      
      return (
        <>
          <style>
            {`
              @keyframes ${animationName} {
                0% { transform: translate(0, 0); }
                100% { transform: translate(${toNodeObj.x - fromNodeObj.x}px, ${toNodeObj.y - fromNodeObj.y}px); }
              }
            `}
          </style>
          <circle 
            cx={fromNodeObj.x} 
            cy={fromNodeObj.y} 
            r={4}
            fill="#FF9800"
            opacity={0.8}
            style={{
              animation: `${animationName} 3s infinite ${animationDelay}s`
            }}
          />
        </>
      );
    };
    
    return (
      <div className="mesh-animation-container" ref={networkRef}>
        <style>
          {`
            @keyframes pulse {
              0% { r: 10; opacity: 0.7; }
              50% { r: 12; opacity: 1; }
              100% { r: 10; opacity: 0.7; }
            }
            /* Base animation styles - replaced by dynamic ones */
            @keyframes dataFlow {
              0% { opacity: 0.9; r: 4; }
              50% { opacity: 1; r: 5; }
              100% { opacity: 0.9; r: 4; }
            }
            .node-pulse {
              animation: pulse 2s infinite;
            }
          `}
        </style>
        <svg width="100%" height="300" viewBox="0 0 350 300">
          {/* Draw connections */}
          {connections.map((conn, i) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            return (
              <line 
                key={`conn-${i}`}
                x1={fromNode.x} 
                y1={fromNode.y} 
                x2={toNode.x} 
                y2={toNode.y}
                stroke="#BBDEFB"
                strokeWidth={2}
                strokeDasharray={fromNode.type === 'extension' || toNode.type === 'extension' ? "5,5" : "none"}
              />
            );
          })}
          
          {/* Draw nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle 
                cx={node.x} 
                cy={node.y} 
                r={10}
                fill={getNodeColor(node.type, node.active)}
                className={node.active || node.type === 'core' ? "node-pulse" : ""}
              />
              <text 
                x={node.x} 
                y={node.y + 25} 
                textAnchor="middle" 
                fill="#333" 
                fontSize="10"
              >
                {node.type === 'core' ? 'Core' : 'Extension'}
              </text>
            </g>
          ))}
          
          {/* Animate data packets */}
          {animationState > 0 && 
            <DataPacket fromNode="node1" toNode="node2" animationDelay={0} />}
          {animationState > 1 && 
            <DataPacket fromNode="node2" toNode="node3" animationDelay={0.5} />}
          {animationState > 2 && 
            <DataPacket fromNode="node3" toNode="node1" animationDelay={1} />}
          {animationState > 0 && 
            <DataPacket fromNode="node2" toNode="node4" animationDelay={0.3} />}
          {animationState > 1 && 
            <DataPacket fromNode="node3" toNode="node5" animationDelay={0.8} />}
          {animationState > 2 && 
            <DataPacket fromNode="node1" toNode="node6" animationDelay={1.2} />}
        </svg>
      </div>
    );
  };
  
  // Kit card component with animation states
  const KitCard = ({ kit, index, isActive, onClick }) => {
    return (
      <div 
        className={`kit-card ${isActive ? 'active' : ''}`}
        style={{ 
          borderColor: kit.color,
          boxShadow: isActive ? `0 6px 12px rgba(0,0,0,0.15), 0 0 0 3px ${kit.color}33` : 'none'
        }}
        onClick={() => onClick(index)}
      >
        <div className="kit-icon" style={{ backgroundColor: kit.color }}>
          <span>{kit.icon}</span>
        </div>
        <h3>{kit.name}</h3>
        <p className="kit-subtitle">{kit.fullName}</p>
        <p className="kit-description">{kit.description}</p>
        {isActive && (
          <div className="kit-details">
            <h4>Core Components:</h4>
            <ul>
              {kit.components.map((component, i) => (
                <li key={i}>{component}</li>
              ))}
            </ul>
            <h4>Extension Options:</h4>
            <ul>
              {kit.extensions.map((extension, i) => (
                <li key={i}>{extension}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  // Email signup form handler
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real implementation, this would send the email to a server
    console.log('Email submitted:', emailInput);
    setIsSubmitted(true);
  };
  
  return (
    <div className="meshed-announcement-page">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🔬</span>
          <h1>MeshEd Technologies</h1>
        </div>
        <nav>
          <button onClick={() => setShowModal(true)} className="cta-button small">
            Early Access
          </button>
        </nav>
      </header>
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Distributed Learning Through Environmental Discovery</h1>
          <p>
            Build your own environmental monitoring network with modular, 
            expandable sensor kits designed for home learning, citizen science, 
            and community environmental projects.
          </p>
          <button onClick={() => setShowModal(true)} className="cta-button primary">
            Get Early Access
          </button>
        </div>
        <div className="hero-animation">
          <MeshNetworkAnimation />
          <div className="animation-caption">
            <p>Interactive mesh network demonstration - watch as it expands!</p>
            <p className="animation-state">
              {animationState === 0 && "Basic mesh network with core nodes"}
              {animationState === 1 && "Adding first extension node"}
              {animationState === 2 && "Adding second extension node"}
              {animationState === 3 && "Complete mesh with all extensions"}
            </p>
          </div>
        </div>
      </section>
      
      {/* Problem/Solution Section */}
      <section className="problem-solution-section">
        <div className="section-content">
          <h2>Why a Mesh Network for Learning?</h2>
          <div className="columns">
            <div className="column">
              <h3>Traditional Approaches</h3>
              <p><strong>Single-point sensors</strong> provide limited data from one location</p>
              <p><strong>Classroom kits</strong> are often confined to artificial experiments</p>
              <p><strong>Consumer weather stations</strong> offer minimal expandability</p>
              <p><strong>Complex scientific equipment</strong> is expensive and inaccessible</p>
            </div>
            <div className="column">
              <h3>The Mesh Advantage</h3>
              <p><strong>Distributed sensing</strong> captures the full complexity of natural environments</p>
              <p><strong>Modular expansion</strong> grows with your interests and projects</p>
              <p><strong>Flexible deployment</strong> adapts to your unique space and questions</p>
              <p><strong>Affordable extensibility</strong> makes real scientific tools accessible</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Kit Showcase Section */}
      <section className="kits-section">
        <h2>Choose Your Environmental Focus</h2>
        <p className="section-intro">
          Every kit uses the same core mesh technology but specializes in different environmental monitoring. 
          Start with one kit and expand your network over time.
        </p>
        
        <div className="kits-container">
          {kits.map((kit, index) => (
            <KitCard 
              key={kit.id}
              kit={kit}
              index={index}
              isActive={activeKit === index}
              onClick={setActiveKit}
            />
          ))}
        </div>
        
        <div className="kit-showcase">
          <h3>Featured Kit: {kits[activeKit].fullName}</h3>
          <div className="kit-showcase-content">
            <div className="kit-image">
              <div className="placeholder-image" style={{ backgroundColor: `${kits[activeKit].color}22` }}>
                <span style={{ fontSize: '64px' }}>{kits[activeKit].icon}</span>
              </div>
            </div>
            <div className="kit-info">
              <p className="featured-description">{kits[activeKit].description}</p>
              <button 
                className="toggle-details-button"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Show Less' : 'Show More Details'}
              </button>
              
              {isExpanded && (
                <div className="expanded-details">
                  <div className="technical-specs">
                    <h4>Technical Specifications</h4>
                    <ul>
                      <li><strong>Core Nodes:</strong> 3 ESP32S3 devices in weather-resistant enclosures</li>
                      <li><strong>Power Options:</strong> USB, rechargeable battery, or solar (optional)</li>
                      <li><strong>Wireless:</strong> Self-forming mesh network with 100m range between nodes</li>
                      <li><strong>Hub:</strong> Raspberry Pi for data processing and visualization</li>
                      <li><strong>Expansion:</strong> Up to 12 additional nodes per network</li>
                      <li><strong>Software:</strong> Open-source dashboard with educational resources</li>
                    </ul>
                  </div>
                  <div className="educational-applications">
                    <h4>Educational Applications</h4>
                    <ul>
                      <li>Data collection and analysis</li>
                      <li>Environmental science principles</li>
                      <li>Computer science and networking</li>
                      <li>Scientific method through experimentation</li>
                      <li>Cross-disciplinary project-based learning</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Deploy</h3>
            <p>Place your sensor nodes throughout your environment - indoors, outdoors, or both.</p>
            <div className="step-icon">📍</div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Connect</h3>
            <p>Nodes automatically form a mesh network, sharing data even when some are out of WiFi range.</p>
            <div className="step-icon">🔄</div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Collect</h3>
            <p>Sensors gather environmental data based on your chosen kit and extensions.</p>
            <div className="step-icon">📊</div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Discover</h3>
            <p>Analyze patterns, conduct experiments, and engage in authentic scientific inquiry.</p>
            <div className="step-icon">🔍</div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2>From Our Early Users</h2>
        <div className="testimonials-container">
          <div className="testimonial">
            <p>"My homeschooled children are now collecting real scientific data instead of just reading about concepts in textbooks. The BioDiver Kit has transformed our backyard into a living laboratory."</p>
            <div className="testimonial-author">
              <strong>Sarah M.</strong> - Homeschool Parent
            </div>
          </div>
          <div className="testimonial">
            <p>"We started with the AirScope Kit to understand air quality in our neighborhood and ended up partnering with three nearby schools to create a community-wide monitoring network."</p>
            <div className="testimonial-author">
              <strong>Michael T.</strong> - Community Science Leader
            </div>
          </div>
          <div className="testimonial">
            <p>"The modular approach is brilliant - we added components as our students' questions evolved. Their engagement with environmental science has never been higher."</p>
            <div className="testimonial-author">
              <strong>Emma R.</strong> - Science Educator
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <h2>Join Our Early Access Program</h2>
        <p>Be among the first to build your environmental mesh network</p>
        <button onClick={() => setShowModal(true)} className="cta-button primary large">
          Reserve Your Kit
        </button>
      </section>
      
      {/* Modal for email signup */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
            <h2>Get Early Access</h2>
            
            {!isSubmitted ? (
              <>
                <p>Join our waitlist to be notified when MeshEd kits become available.</p>
                <form onSubmit={handleSubmit} className="signup-form">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      value={emailInput} 
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="your@email.com"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="kitInterest">Which kit interests you most?</label>
                    <select id="kitInterest">
                      {kits.map(kit => (
                        <option key={kit.id} value={kit.id}>{kit.name}</option>
                      ))}
                      <option value="undecided">Not sure yet</option>
                    </select>
                  </div>
                  <button type="submit" className="cta-button primary">
                    Join Waitlist
                  </button>
                </form>
              </>
            ) : (
              <div className="success-message">
                <div className="success-icon">✓</div>
                <h3>Thank you for your interest!</h3>
                <p>We've added you to our early access list and will contact you when MeshEd kits are ready for release.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-icon">🔬</span>
            <h3>MeshEd Technologies</h3>
          </div>
          <div className="footer-links">
            <h4>Learn More</h4>
            <ul>
              <li><a href="#!">Our Technology</a></li>
              <li><a href="#!">Educational Resources</a></li>
              <li><a href="#!">About Us</a></li>
              <li><a href="#!">Contact</a></li>
            </ul>
          </div>
          <div className="footer-newsletter">
            <h4>Stay Updated</h4>
            <button onClick={() => setShowModal(true)} className="cta-button small">
              Join Our Mailing List
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 MeshEd Technologies. All rights reserved.</p>
        </div>
      </footer>
      
      {/* Styles */}
      <style jsx>{`
        /* Global Styles */
        .meshed-announcement-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
          color: #333;
          line-height: 1.6;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        h1, h2, h3, h4 {
          margin-top: 0;
          line-height: 1.2;
        }
        
        h1 {
          font-size: 2.4rem;
          margin-bottom: 1rem;
        }
        
        h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        
        p {
          margin-bottom: 1rem;
        }
        
        section {
          margin: 4rem 0;
          padding: 2rem 0;
        }
        
        .section-intro {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 2rem;
        }
        
        /* Header Styles */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
          border-bottom: 1px solid #eaeaea;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .logo h1 {
          font-size: 1.5rem;
          margin: 0;
        }
        
        .logo-icon {
          font-size: 1.8rem;
        }
        
        /* Button Styles */
        .cta-button {
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .cta-button:hover {
          background-color: #1976D2;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .cta-button.primary {
          background-color: #4CAF50;
        }
        
        .cta-button.primary:hover {
          background-color: #388E3C;
        }
        
        .cta-button.small {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }
        
        .cta-button.large {
          padding: 1rem 2rem;
          font-size: 1.125rem;
        }
        
        /* Hero Section */
        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 3rem 0;
        }
        
        .hero-content {
          max-width: 800px;
          margin-bottom: 2rem;
        }
        
        .hero-animation {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .animation-caption {
          font-size: 0.875rem;
          color: #666;
          margin-top: 1rem;
        }
        
        .animation-state {
          font-weight: bold;
          color: #2196F3;
        }
        
        /* Problem/Solution Section */
        .problem-solution-section {
          background-color: #f5f9ff;
          padding: 3rem;
          border-radius: 8px;
        }
        
        .columns {
          display: flex;
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .column {
          flex: 1;
        }
        
        /* Kits Section */
        .kits-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: center;
          margin-bottom: 2rem;
        }
        
        .kit-card {
          width: 210px;
          padding: 1.5rem;
          border: 2px solid #eaeaea;
          border-radius: 8px;
          background-color: white;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .kit-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .kit-card.active {
          border-width: 2px;
          transform: translateY(-5px);
        }
        
        .kit-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .kit-icon span {
          font-size: 1.5rem;
        }
        
        .kit-subtitle {
          color: #666;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        
        .kit-description {
          font-size: 0.875rem;
          line-height: 1.4;
        }
        
        .kit-details {
          margin-top: 1rem;
          font-size: 0.8125rem;
        }
        
        .kit-details h4 {
          margin-bottom: 0.5rem;
          margin-top: 1rem;
        }
        
        .kit-details ul {
          margin: 0;
          padding-left: 1.25rem;
        }
        
        .kit-details li {
          margin-bottom: 0.25rem;
        }
        
        /* Kit Showcase */
        .kit-showcase {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 2rem;
          margin-top: 3rem;
        }
        
        .kit-showcase h3 {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .kit-showcase-content {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }
        
        .kit-image {
          flex: 1;
          min-width: 300px;
        }
        
        .placeholder-image {
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .kit-info {
          flex: 2;
        }
        
        .featured-description {
          font-size: 1.125rem;
          margin-bottom: 1.5rem;
        }
        
        .toggle-details-button {
          background: none;
          border: 1px solid #2196F3;
          color: #2196F3;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .toggle-details-button:hover {
          background-color: #2196F322;
        }
        
        .expanded-details {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eaeaea;
          display: flex;
          gap: 2rem;
        }
        
        .technical-specs, .educational-applications {
          flex: 1;
        }
        
        /* How It Works Section */
        .steps-container {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          justify-content: center;
          margin-top: 2rem;
        }
        
        .step {
          width: 200px;
          text-align: center;
          position: relative;
        }
        
        .step-number {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #2196F3;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin: 0 auto 1rem;
        }
        
        .step-icon {
          font-size: 2rem;
          margin: 1rem 0;
        }
        
        /* Testimonial Section */
        .testimonials-container {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          justify-content: center;
          margin-top: 2rem;
        }
        
        .testimonial {
          flex: 1;
          min-width: 300px;
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .testimonial p {
          font-style: italic;
        }
        
        .testimonial-author {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eaeaea;
        }
        
        /* CTA Section */
        .cta-section {
          text-align: center;
          background-color: #f5f9ff;
          padding: 3rem;
          border-radius: 8px;
          margin: 4rem 0;
        }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 8px;
          padding: 2rem;
          width: 90%;
          max-width: 500px;
          position: relative;
        }
        
        .close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }
        
        .signup-form {
          margin-top: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-group input, .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .success-message {
          text-align: center;
          padding: 1rem;
        }
        
        .success-icon {
          font-size: 3rem;
          color: #4CAF50;
          margin-bottom: 1rem;
        }
        
        /* Footer */
        .footer {
          margin-top: 4rem;
          padding-top: 3rem;
          border-top: 1px solid #eaeaea;
        }
        
        .footer-content {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .footer-logo, .footer-links, .footer-newsletter {
          flex: 1;
          min-width: 200px;
        }
        
        .footer-links ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-links li {
          margin-bottom: 0.5rem;
        }
        
        .footer-links a {
          color: #666;
          text-decoration: none;
        }
        
        .footer-links a:hover {
          color: #2196F3;
        }
        
        .footer-bottom {
          padding-top: 1.5rem;
          border-top: 1px solid #eaeaea;
          text-align: center;
          font-size: 0.875rem;
          color: #666;
        }
        
        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .hero-section {
            padding: 2rem 0;
          }
          
          .columns {
            flex-direction: column;
          }
          
          .kit-showcase-content {
            flex-direction: column;
          }
          
          .expanded-details {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default MeshEdAnnouncement;