import { useState, useEffect } from 'react';

export default function AWSWars() {
  const [gameState, setGameState] = useState({
    day: 1,
    cash_on_hand: 1000,
    spent_monthly: 0,
    uptime_percentage: 100.0,
    current_region: 'us-east-1',
    current_scene: 'hub',
    infrastructure: [],
    lessons_learned: [],
  });

  const [notification, setNotification] = useState(null);
  const [eventOutcome, setEventOutcome] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const scenes = {
    hub: {
      title: 'AWS Command Center',
      text: 'What do you want to do?',
      choices: [
        { id: 'market', label: 'Deploy Infrastructure', cost: 0 },
        { id: 'travel', label: 'Travel to Another Region', cost: 0 },
        { id: 'manage', label: 'View Infrastructure Status', cost: 0 },
      ],
    },
    travel: {
      title: 'Choose AWS Region',
      text: 'Where do you want to deploy?',
      choices: [
        { id: 'us-east-1', label: 'us-east-1 (N. Virginia) - CHEAP, HIGH TRAFFIC', cost: 0, region: true },
        { id: 'us-west-2', label: 'us-west-2 (Oregon) - MODERATE COST', cost: 0, region: true },
        { id: 'eu-west-1', label: 'eu-west-1 (Ireland) - GDPR COMPLIANT', cost: 0, region: true },
        { id: 'ap-southeast-1', label: 'ap-southeast-1 (Singapore) - EXPENSIVE', cost: 0, region: true },
        { id: 'hub', label: '← Back to Hub', cost: 0 },
      ],
    },
    market: {
      title: 'AWS Service Market',
      text: 'What infrastructure do you want to deploy?',
      choices: [
        { id: 's3', label: 'S3 + CloudFront (Static)', cost: 15, infra: 'S3+CloudFront', smart: true },
        { id: 'lambda', label: 'Lambda Function (Serverless)', cost: 5, infra: 'Lambda', smart: true },
        { id: 'ec2', label: 'EC2 t3.micro (Single Server)', cost: 45, infra: 'EC2 t3.micro' },
        { id: 'rds', label: 'RDS PostgreSQL Database', cost: 75, infra: 'RDS PostgreSQL' },
        { id: 'cache', label: 'ElastiCache Redis', cost: 50, infra: 'ElastiCache', expensive: true },
        { id: 'hub', label: '← Back to Hub', cost: 0 },
      ],
    },
    manage: {
      title: 'Infrastructure Management',
      text: 'Your currently deployed infrastructure.',
      choices: [
        { id: 'hub', label: '← Back to Hub', cost: 0 },
      ],
    },
    event_ddos: {
      title: '🚨 DDoS ATTACK!',
      text: 'Your site is under massive DDoS attack! 500K requests/second!',
      event: true,
      choices: [
        { id: 'hub', label: 'Continue', cost: 0 },
      ],
    },
    event_outage: {
      title: '⚠️ AWS REGIONAL OUTAGE',
      text: 'Your current region is experiencing a major outage!',
      choices: [
        { id: 'failover', label: 'Emergency multi-region failover ($200)', cost: 200, uptime: 5 },
        { id: 'wait', label: 'Wait it out (lose uptime)', cost: 0, uptime: -15 },
      ],
    },
    event_viral: {
      title: '🔥 VIRAL MOMENT',
      text: 'Your app went viral! 2M users in 24 hours!',
      event: true,
      choices: [
        { id: 'hub', label: 'Continue', cost: 0 },
      ],
    },
    event_security: {
      title: '🔒 SECURITY BREACH',
      text: 'Your S3 bucket was PUBLIC! Customer data leaked!',
      choices: [
        { id: 'patch', label: 'Emergency patch + legal fees ($150)', cost: 150 },
        { id: 'lawsuit', label: 'Ignore it (VERY RISKY)', cost: 0 },
      ],
    },
    event_lawsuit: {
      title: '⚖️ CLASS ACTION LAWSUIT',
      text: 'You ignored the breach. Now you\'re being sued. GAME OVER.',
      gameover: true,
      choices: [
        { id: 'restart', label: 'Restart Game', cost: 0 },
      ],
    },
  };

  const currentScene = scenes[gameState.current_scene];

  useEffect(() => {
    if (gameState.cash_on_hand < 0) {
      setGameOver(true);
      showNotification('BANKRUPTCY! Game Over.');
      return;
    }

    if (gameState.day > 30) {
      setGameOver(true);
      showNotification(`Game Complete! Final Score: ${Math.floor(gameState.cash_on_hand + gameState.uptime_percentage * 10)}`);
      return;
    }

    if (currentScene?.event && gameState.infrastructure.length > 0) {
      handleAutoEvent();
    }

    if (gameState.day > 3 && Math.random() < 0.3 && gameState.current_scene === 'hub') {
      const events = ['event_ddos', 'event_viral', 'event_outage', 'event_security'];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setTimeout(() => {
        setGameState(prev => ({ ...prev, current_scene: randomEvent }));
      }, 500);
    }
  }, [gameState.current_scene, gameState.day]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAutoEvent = () => {
    const primaryInfra = gameState.infrastructure[0]?.name;
    const outcomes = {
      event_ddos: {
        'S3+CloudFront': { text: 'CloudFront absorbed the attack! Expensive bandwidth.', uptime: 0, cost: 50 },
        'Lambda': { text: 'Lambda scaled but the bill... oh god...', uptime: -5, cost: 80 },
        'EC2 t3.micro': { text: 'EC2 crashed HARD. Site down 3 hours!', uptime: -25, cost: 0 },
      },
      event_viral: {
        'S3+CloudFront': { text: 'Scaled perfectly! Users happy!', uptime: 0, cost: 200 },
        'Lambda': { text: 'Handled it! But the Lambda bill is INSANE.', uptime: 0, cost: 400 },
        'EC2 t3.micro': { text: 'COMPLETE MELTDOWN. Site down 8 hours.', uptime: -40, cost: 0 },
      },
    };

    const outcome = outcomes[gameState.current_scene]?.[primaryInfra];
    if (outcome) {
      setEventOutcome(outcome.text);
      setGameState(prev => ({
        ...prev,
        uptime_percentage: Math.max(0, Math.min(100, prev.uptime_percentage + outcome.uptime)),
        cash_on_hand: prev.cash_on_hand - outcome.cost,
        spent_monthly: prev.spent_monthly + outcome.cost,
      }));
      showNotification(outcome.text);
    }
  };

  const handleChoice = (choice) => {
    if (choice.id === 'restart') {
      window.location.reload();
      return;
    }

    if (choice.cost > gameState.cash_on_hand) {
      showNotification(`Not enough cash! Need $${choice.cost}, have $${gameState.cash_on_hand}`);
      return;
    }

    setEventOutcome(null);

    if (choice.region) {
      setGameState(prev => ({
        ...prev,
        current_region: choice.id,
        current_scene: 'hub',
        day: prev.day + 1,
      }));
      showNotification(`Traveled to ${choice.id}`);
      return;
    }

    if (choice.infra) {
      const newInfra = {
        name: choice.infra,
        cost: choice.cost,
        region: gameState.current_region,
        day: gameState.day,
      };
      setGameState(prev => ({
        ...prev,
        infrastructure: [...prev.infrastructure, newInfra],
        cash_on_hand: prev.cash_on_hand - choice.cost,
        spent_monthly: prev.spent_monthly + choice.cost,
        current_scene: 'hub',
        day: prev.day + 1,
      }));
      showNotification(`Deployed ${choice.infra} in ${gameState.current_region}`);
      return;
    }

    if (choice.id === 'failover' || choice.id === 'wait') {
      setGameState(prev => ({
        ...prev,
        cash_on_hand: prev.cash_on_hand - choice.cost,
        uptime_percentage: Math.max(0, Math.min(100, prev.uptime_percentage + (choice.uptime || 0))),
        current_scene: 'hub',
        day: prev.day + 1,
      }));
      return;
    }

    if (choice.id === 'patch') {
      setGameState(prev => ({
        ...prev,
        cash_on_hand: prev.cash_on_hand - choice.cost,
        current_scene: 'hub',
        day: prev.day + 1,
      }));
      return;
    }

    if (choice.id === 'lawsuit') {
      setGameState(prev => ({ ...prev, current_scene: 'event_lawsuit' }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      current_scene: choice.id,
      day: choice.cost > 0 ? prev.day + 1 : prev.day,
    }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0e0a 0%, #0d120d 100%)',
      color: '#33ff33',
      fontFamily: '"Courier New", monospace',
      padding: '20px',
      position: 'relative',
      overflow: 'auto',
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', fontSize: '10px', opacity: 0.6, marginBottom: '15px', textShadow: '0 0 8px #33ff33' }}>
          AWS WARS  ·  CLOUD INFRASTRUCTURE TYCOON
        </div>

        <div style={{
          border: '1px solid #2d5f2d',
          background: 'rgba(13, 18, 13, 0.8)',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: 'inset 0 0 3px rgba(51, 255, 51, 0.1)',
        }}>
          <div style={{ fontSize: '10px', color: '#66aa66', marginBottom: '5px' }}>
            DAY {gameState.day}/30 - {gameState.current_region.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', textShadow: '0 0 8px #33ff33' }}>
            {currentScene?.title}
          </div>
          <div style={{ fontSize: '11px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderLeft: '3px solid #33ff33' }}>
            {currentScene?.text}
          </div>
        </div>

        {eventOutcome && (
          <div style={{
            padding: '15px',
            marginBottom: '15px',
            background: 'rgba(0,0,0,0.5)',
            borderLeft: '4px solid #ffaa33',
            border: '1px solid #2d5f2d',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>EVENT OUTCOME</div>
            <div style={{ fontSize: '11px' }}>{eventOutcome}</div>
          </div>
        )}

        {gameState.current_scene === 'manage' && gameState.infrastructure.length > 0 && (
          <div style={{
            border: '1px solid #2d5f2d',
            background: 'rgba(13, 18, 13, 0.8)',
            padding: '15px',
            marginBottom: '15px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>Deployed Infrastructure</div>
            {gameState.infrastructure.map((infra, idx) => (
              <div key={idx} style={{
                fontSize: '10px',
                marginBottom: '5px',
                padding: '5px',
                borderLeft: '2px solid #66cccc',
                paddingLeft: '8px',
              }}>
                <strong>{infra.name}</strong> | ${infra.cost}/mo | {infra.region} | Day {infra.day}
              </div>
            ))}
          </div>
        )}

        {gameState.current_scene === 'manage' && gameState.infrastructure.length === 0 && (
          <div style={{
            border: '1px solid #2d5f2d',
            background: 'rgba(13, 18, 13, 0.8)',
            padding: '15px',
            marginBottom: '15px',
            fontSize: '11px',
            opacity: 0.6,
          }}>
            No infrastructure deployed yet.
          </div>
        )}

        <div style={{
          border: '1px solid #2d5f2d',
          background: 'rgba(13, 18, 13, 0.8)',
          padding: '15px',
          marginBottom: '15px',
        }}>
          {currentScene?.choices.map((choice) => {
            const canAfford = choice.cost <= gameState.cash_on_hand;
            return (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                disabled={!canAfford && choice.cost > 0}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px',
                  marginBottom: '8px',
                  background: 'rgba(13, 18, 13, 0.6)',
                  border: '2px solid #33ff33',
                  color: '#33ff33',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  cursor: canAfford || choice.cost === 0 ? 'pointer' : 'not-allowed',
                  opacity: canAfford || choice.cost === 0 ? 1 : 0.3,
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#ffaa33' }}>${choice.cost}/mo</div>
                <div style={{ marginTop: '4px' }}>{choice.label}</div>
                {choice.smart && <div style={{ fontSize: '9px', marginTop: '3px', color: '#33ff33' }}>[AI: SMART]</div>}
                {choice.expensive && <div style={{ fontSize: '9px', marginTop: '3px', color: '#ff9933' }}>[AI: EXPENSIVE]</div>}
                {!canAfford && choice.cost > 0 && (
                  <div style={{ color: '#ff3333', fontSize: '9px', marginTop: '3px' }}>INSUFFICIENT FUNDS</div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          fontSize: '10px',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid #2d5f2d',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#66aa66' }}>DAY:</span>
            <span style={{ fontWeight: 'bold' }}>{gameState.day}/30</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#66aa66' }}>CASH:</span>
            <span style={{ fontWeight: 'bold', color: gameState.cash_on_hand < 100 ? '#ff3333' : '#33ff33' }}>
              ${gameState.cash_on_hand}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#66aa66' }}>REGION:</span>
            <span style={{ fontWeight: 'bold' }}>{gameState.current_region}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#66aa66' }}>COST:</span>
            <span style={{ fontWeight: 'bold' }}>${gameState.spent_monthly}/mo</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#66aa66' }}>UPTIME:</span>
            <span style={{ fontWeight: 'bold', color: gameState.uptime_percentage >= 99 ? '#33ff33' : '#ff3333' }}>
              {gameState.uptime_percentage.toFixed(1)}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#66aa66' }}>INFRA:</span>
            <span style={{ fontWeight: 'bold' }}>{gameState.infrastructure.length}</span>
          </div>
        </div>

        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            background: 'rgba(13, 18, 13, 0.95)',
            border: '2px solid #33ff33',
            zIndex: 1000,
            maxWidth: '300px',
            boxShadow: '0 0 20px rgba(51, 255, 51, 0.5)',
            fontSize: '11px',
          }}>
            {notification}
          </div>
        )}

        {(gameOver || currentScene?.gameover) && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '30px',
            background: 'rgba(13, 18, 13, 0.98)',
            border: '3px solid #ff3333',
            zIndex: 2000,
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(255, 51, 51, 0.5)',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
              {gameState.cash_on_hand < 0 || currentScene?.gameover ? 'GAME OVER' : 'MISSION COMPLETE'}
            </div>
            <div style={{ marginBottom: '10px' }}>Days Survived: {gameState.day}</div>
            <div style={{ marginBottom: '10px' }}>Final Cash: ${gameState.cash_on_hand}</div>
            <div style={{ marginBottom: '10px' }}>Uptime: {gameState.uptime_percentage.toFixed(1)}%</div>
            <div style={{ marginBottom: '20px' }}>Infrastructure: {gameState.infrastructure.length}</div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#33ff33',
                color: '#0a0e0a',
                border: 'none',
                fontFamily: '"Courier New", monospace',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}