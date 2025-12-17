import { useState } from 'react';
import MagicFriendMirror from '../components/games/MagicFriendMirror';

/**
 * TEST PAGE - Game 1: Calling Friend
 * 
 * Direct test of name-calling and animations
 * No auth, no screening setup required
 */
const TestGame1 = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [childName, setChildName] = useState('Thejas');

  const handleComplete = (frames) => {
    console.log('Game completed with', frames.length, 'frames');
    alert(`Game 1 complete! Captured ${frames.length} frames`);
    setTestStarted(false);
  };

  if (!testStarted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f0f0',
        padding: '20px'
      }}>
        <h1 style={{ marginBottom: '20px', color: '#333' }}>
          🎮 Test Game 1: Calling Friend
        </h1>
        
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '18px', color: '#555' }}>
            Child's Name:
          </label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            style={{
              fontSize: '20px',
              padding: '10px 15px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              width: '300px',
              marginBottom: '20px'
            }}
            placeholder="Enter child's name"
          />
          
          <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#856404' }}>
              <strong>What to test:</strong><br/>
              ✅ Name called every 5 seconds with audio<br/>
              ✅ Bouncing character with expressions<br/>
              ✅ Floating toys (balloons, bears, etc.)<br/>
              ✅ Waving hand animation<br/>
              ✅ Duration: 35 seconds
            </p>
          </div>
        </div>

        <button
          onClick={() => setTestStarted(true)}
          style={{
            fontSize: '24px',
            padding: '20px 40px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
          }}
        >
          START TEST
        </button>
      </div>
    );
  }

  return (
    <MagicFriendMirror
      childName={childName}
      screeningId="test-123"
      onComplete={handleComplete}
    />
  );
};

export default TestGame1;
