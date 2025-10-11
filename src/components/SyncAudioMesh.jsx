import React, { useState, useEffect, useRef } from 'react';

const SyncAudioMesh = () => {
  // State Management
  const [peerId, setPeerId] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [connections, setConnections] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('initializing');
  const [audioFile, setAudioFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [syncOffset, setSyncOffset] = useState(0);
  const [syncQuality, setSyncQuality] = useState('unknown');
  const [latencyMs, setLatencyMs] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [audioVisualizerData, setAudioVisualizerData] = useState(Array(32).fill(0));
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const peerRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const connectionsMapRef = useRef(new Map());
  const animationFrameRef = useRef(null);
  const visualizerFrameRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const loadAttemptedRef = useRef(false);

  /**
   * Load PeerJS dynamically with fallback CDNs
   */
  const loadPeerJS = () => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Peer) {
        console.log('✓ PeerJS already available');
        resolve(window.Peer);
        return;
      }

      console.log('⚡ Loading PeerJS from CDN...');

      const cdnUrls = [
        'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js',
        'https://cdn.jsdelivr.net/npm/peerjs@1.5.2/dist/peerjs.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js'
      ];

      let attemptIndex = 0;

      const tryLoad = () => {
        if (attemptIndex >= cdnUrls.length) {
          reject(new Error('Failed to load PeerJS from all CDN sources'));
          return;
        }

        const script = document.createElement('script');
        script.src = cdnUrls[attemptIndex];
        script.async = true;

        const timeout = setTimeout(() => {
          console.warn(`Timeout loading from CDN ${attemptIndex + 1}, trying next...`);
          document.head.removeChild(script);
          attemptIndex++;
          tryLoad();
        }, 8000);

        script.onload = () => {
          clearTimeout(timeout);
          if (window.Peer) {
            console.log(`✓ PeerJS loaded from CDN ${attemptIndex + 1}`);
            resolve(window.Peer);
          } else {
            console.warn(`Script loaded but Peer not available, trying next CDN...`);
            attemptIndex++;
            tryLoad();
          }
        };

        script.onerror = () => {
          clearTimeout(timeout);
          console.warn(`Failed to load from CDN ${attemptIndex + 1}, trying next...`);
          document.head.removeChild(script);
          attemptIndex++;
          tryLoad();
        };

        document.head.appendChild(script);
      };

      tryLoad();
    });
  };

  /**
   * Initialize everything
   */
  useEffect(() => {
    if (loadAttemptedRef.current) return;
    loadAttemptedRef.current = true;

    const init = async () => {
      try {
        setStatusMessage('Loading network libraries...');
        await loadPeerJS();
        setIsLoading(false);
        setStatusMessage('Initializing network...');
        setTimeout(() => {
          initializePeer();
        }, 100);
      } catch (error) {
        console.error('Initialization error:', error);
        setErrorMessage('Failed to load network libraries. Check your internet connection.');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      cleanup();
    };
  }, []);

  const initializePeer = () => {
    if (!window.Peer || peerRef.current) return;

    try {
      const peer = new window.Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      peer.on('open', (id) => {
        setPeerId(id);
        setConnectionStatus('ready');
        setStatusMessage('Connected to mesh network!');
        setDeviceName(`Device-${id.substring(0, 4)}`);
      });

      peer.on('connection', (conn) => {
        setupConnection(conn);
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        setErrorMessage(`Network error: ${err.type}`);
      });

      peer.on('disconnected', () => {
        setStatusMessage('Disconnected - reconnecting...');
        setTimeout(() => {
          if (peerRef.current && !peerRef.current.destroyed) {
            peerRef.current.reconnect();
          }
        }, 3000);
      });

      peerRef.current = peer;
      initializeAudioContext();

    } catch (err) {
      console.error('Failed to initialize peer:', err);
      setErrorMessage('Failed to initialize peer connection');
    }
  };

  const initializeAudioContext = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error('Audio context error:', err);
      setErrorMessage('Failed to initialize audio system');
    }
  };

  const setupConnection = (conn) => {
    conn.on('open', () => {
      connectionsMapRef.current.set(conn.peer, conn);
      setConnections(Array.from(connectionsMapRef.current.values()));
      setStatusMessage(`Connected to peer: ${conn.peer.substring(0, 8)}...`);
      
      conn.send({
        type: 'handshake',
        peerId: peerId,
        deviceName: deviceName,
        isLeader: isLeader,
        timestamp: Date.now()
      });
    });

    conn.on('data', (data) => {
      handleIncomingData(data, conn);
    });

    conn.on('close', () => {
      connectionsMapRef.current.delete(conn.peer);
      setConnections(Array.from(connectionsMapRef.current.values()));
      setStatusMessage(`Peer disconnected: ${conn.peer.substring(0, 8)}...`);
    });
  };

  const handleIncomingData = async (data, conn) => {
    const receiveTime = Date.now();
    
    try {
      switch (data.type) {
        case 'handshake':
          setLatencyMs(receiveTime - data.timestamp);
          break;

        case 'audio':
          setStatusMessage('Receiving audio...');
          const arrayBuffer = data.buffer;
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          audioBufferRef.current = audioBuffer;
          setDuration(audioBuffer.duration);
          setAudioFile({ name: data.fileName, size: arrayBuffer.byteLength });
          setStatusMessage(`Audio received: ${data.fileName}`);
          break;

        case 'play':
          playAudioAtTime(data.startTime, data.offset || 0);
          setStatusMessage('Playing synchronized audio');
          break;

        case 'pause':
          pauseAudio();
          break;

        case 'stop':
          stopAudio();
          break;

        case 'sync':
          const localTime = audioContextRef.current.currentTime;
          const offset = data.currentTime - (localTime - startTimeRef.current);
          setSyncOffset(offset);
          break;

        case 'volume':
          setVolume(data.volume);
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = data.volume;
          }
          break;

        case 'ping':
          conn.send({ type: 'pong', timestamp: data.timestamp });
          break;

        case 'pong':
          const latency = Date.now() - data.timestamp;
          setLatencyMs(latency);
          setSyncQuality(latency < 20 ? 'excellent' : latency < 50 ? 'good' : 'fair');
          break;
      }
    } catch (err) {
      console.error('Error handling data:', err);
    }
  };

  const becomeLeader = () => {
    setIsLeader(true);
    setStatusMessage('You are now the leader');
  };

  const becomeFollower = () => {
    setIsLeader(false);
    setAudioFile(null);
    setStatusMessage('You are now a follower');
  };

  const connectToPeer = () => {
    if (!remotePeerId.trim()) {
      setErrorMessage('Please enter a peer ID');
      return;
    }

    try {
      const conn = peerRef.current.connect(remotePeerId.trim());
      setupConnection(conn);
      setRemotePeerId('');
      setStatusMessage('Connecting...');
    } catch (err) {
      setErrorMessage('Failed to connect');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatusMessage('Loading audio...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      audioBufferRef.current = audioBuffer;
      setAudioFile({ name: file.name, size: file.size });
      setDuration(audioBuffer.duration);
      setStatusMessage(`Loaded: ${file.name}`);

      // Broadcast to followers
      connectionsMapRef.current.forEach((conn) => {
        conn.send({
          type: 'audio',
          buffer: arrayBuffer,
          fileName: file.name
        });
      });
    } catch (err) {
      setErrorMessage('Failed to load audio file');
    }
  };

  const playAudioAtTime = (startTime, offset = 0) => {
    if (!audioBufferRef.current) return;

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(gainNodeRef.current);
    
    const now = audioContextRef.current.currentTime;
    const delay = Math.max(0, startTime - now);
    const playOffset = offset + Math.max(0, now - startTime);
    
    source.start(audioContextRef.current.currentTime + delay, playOffset);
    sourceNodeRef.current = source;
    startTimeRef.current = startTime;
    setIsPlaying(true);

    startTimeTracking();
    startVisualizer();

    source.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      stopVisualizer();
    };
  };

  const play = () => {
    if (!audioBufferRef.current) {
      setErrorMessage('No audio loaded');
      return;
    }

    const startTime = audioContextRef.current.currentTime + 0.15;
    const offset = pausedAtRef.current;

    playAudioAtTime(startTime, offset);

    if (isLeader) {
      connectionsMapRef.current.forEach((conn) => {
        conn.send({
          type: 'play',
          startTime: startTime,
          offset: offset
        });
      });
    }
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
    }
    
    pausedAtRef.current = currentTime;
    setIsPlaying(false);
    stopVisualizer();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const pause = () => {
    pauseAudio();
    if (isLeader) {
      connectionsMapRef.current.forEach((conn) => {
        conn.send({ type: 'pause' });
      });
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
    }
    
    pausedAtRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    stopVisualizer();
  };

  const stop = () => {
    stopAudio();
    if (isLeader) {
      connectionsMapRef.current.forEach((conn) => {
        conn.send({ type: 'stop' });
      });
    }
  };

  const startTimeTracking = () => {
    const updateTime = () => {
      if (sourceNodeRef.current && isPlaying) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current + pausedAtRef.current;
        setCurrentTime(Math.min(elapsed, duration));
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };
    updateTime();
  };

  const startVisualizer = () => {
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateVisualizer = () => {
      if (!isPlaying) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const bars = 32;
      const samplesPerBar = Math.floor(dataArray.length / bars);
      const visualData = [];
      
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) {
          sum += dataArray[i * samplesPerBar + j];
        }
        visualData.push(sum / samplesPerBar / 255);
      }
      
      setAudioVisualizerData(visualData);
      visualizerFrameRef.current = requestAnimationFrame(updateVisualizer);
    };
    
    updateVisualizer();
  };

  const stopVisualizer = () => {
    if (visualizerFrameRef.current) {
      cancelAnimationFrame(visualizerFrameRef.current);
    }
    setAudioVisualizerData(Array(32).fill(0));
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    }
    
    if (isLeader) {
      connectionsMapRef.current.forEach((conn) => {
        conn.send({ type: 'volume', volume: newVolume });
      });
    }
  };

  const cleanup = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (visualizerFrameRef.current) {
      cancelAnimationFrame(visualizerFrameRef.current);
    }
    
    connectionsMapRef.current.clear();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setStatusMessage('Peer ID copied!');
    }).catch(() => {
      setErrorMessage('Failed to copy');
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <h2>Loading Audio Mesh</h2>
          <p style={{ opacity: 0.8, marginTop: '10px' }}>{statusMessage}</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px',
      color: 'white'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
            🎵 Audio Mesh
          </h1>
          <p style={{ opacity: 0.9 }}>Synchronized distributed playback</p>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(245, 87, 108, 0.2)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '15px',
            borderLeft: '4px solid #f5576c'
          }}>
            {errorMessage}
            <button
              onClick={() => setErrorMessage('')}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {statusMessage && !errorMessage && (
          <div style={{
            background: 'rgba(74, 222, 128, 0.2)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '15px',
            borderLeft: '4px solid #4ade80'
          }}>
            {statusMessage}
          </div>
        )}

        {/* Device Identity */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: '20px',
            fontWeight: '600',
            fontSize: '0.9rem',
            marginBottom: '20px',
            background: isLeader 
              ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
          }}>
            {isLeader ? '👑 Leader' : '👥 Follower'}
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '12px',
            borderRadius: '10px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            marginBottom: '10px'
          }}>
            <strong>Your ID:</strong> {peerId || 'Connecting...'}
          </div>

          <button
            onClick={() => copyToClipboard(peerId)}
            disabled={!peerId}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              color: 'white',
              cursor: peerId ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              marginBottom: '15px',
              opacity: peerId ? 1 : 0.5
            }}
          >
            📋 Copy ID
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isLeader ? (
              <button
                onClick={becomeLeader}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Become Leader
              </button>
            ) : (
              <button
                onClick={becomeFollower}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Become Follower
              </button>
            )}
          </div>

          {isLeader && (
            <div style={{ marginTop: '20px' }}>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              />
              {audioFile && (
                <div style={{ marginTop: '10px', opacity: 0.8, fontSize: '0.9rem' }}>
                  📀 {audioFile.name} ({formatBytes(audioFile.size)})
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connection */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Connect to Peers</h3>
          
          <input
            type="text"
            placeholder="Enter peer ID"
            value={remotePeerId}
            onChange={(e) => setRemotePeerId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && connectToPeer()}
            style={{
              width: '100%',
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '1rem',
              marginBottom: '10px'
            }}
          />
          
          <button
            onClick={connectToPeer}
            style={{
              width: '100%',
              padding: '15px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Connect
          </button>

          {connections.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>
                Connected Peers ({connections.length})
              </h4>
              {connections.map((conn) => (
                <div
                  key={conn.peer}
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#4ade80'
                  }}></div>
                  <span>{conn.peer.substring(0, 12)}...</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Playback */}
        {audioBufferRef.current && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            
            {/* Visualizer */}
            <div style={{
              height: '80px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '3px',
              padding: '10px'
            }}>
              {audioVisualizerData.map((value, i) => (
                <div
                  key={i}
                  style={{
                    width: '4px',
                    height: `${Math.max(2, value * 60)}px`,
                    background: 'white',
                    borderRadius: '2px',
                    transition: 'height 0.1s'
                  }}
                ></div>
              ))}
            </div>

            <div style={{
              textAlign: 'center',
              padding: '20px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '5px' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Latency: {latencyMs}ms | Quality: {syncQuality}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                🔊 Volume: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                disabled={!isLeader}
                style={{ width: '100%' }}
              />
            </div>

            {isLeader && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={play}
                  disabled={isPlaying}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: isPlaying ? 'rgba(255, 255, 255, 0.3)' : 'white',
                    color: isPlaying ? 'white' : '#667eea',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: isPlaying ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    opacity: isPlaying ? 0.5 : 1
                  }}
                >
                  ▶️ Play
                </button>
                <button
                  onClick={pause}
                  disabled={!isPlaying}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: !isPlaying ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    opacity: !isPlaying ? 0.5 : 1
                  }}
                >
                  ⏸️ Pause
                </button>
                <button
                  onClick={stop}
                  disabled={!isPlaying && currentTime === 0}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: '#f5576c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: (!isPlaying && currentTime === 0) ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    opacity: (!isPlaying && currentTime === 0) ? 0.5 : 1
                  }}
                >
                  ⏹️ Stop
                </button>
              </div>
            )}

            {!isLeader && (
              <div style={{
                textAlign: 'center',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '10px',
                fontSize: '0.9rem'
              }}>
                Playback controlled by leader
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '0.85rem',
          opacity: 0.8
        }}>
          <strong>How to use:</strong>
          <ol style={{ marginLeft: '20px', marginTop: '10px', lineHeight: '1.6' }}>
            <li>One device becomes the leader</li>
            <li>Leader selects an audio file</li>
            <li>Other devices connect using the peer ID</li>
            <li>Leader controls playback for all</li>
          </ol>
        </div>

      </div>

      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          height: 6px;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
        }
        
        input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
};

export default SyncAudioMesh;