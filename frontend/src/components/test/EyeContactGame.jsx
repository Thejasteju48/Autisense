import { useState, useRef, useEffect } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

/**
 * STANDALONE EYE CONTACT DETECTION TEST COMPONENT
 * 
 * PURPOSE: Test MediaPipe FaceMesh eye contact detection before production use
 * 
 * FEATURES:
 * - Camera access via getUserMedia
 * - MediaPipe FaceMesh running in browser
 * - Real-time eye contact detection
 * - Audio prompt "Hi! Look at me!"
 * - Console logging for debugging
 * 
 * DETECTION LOGIC:
 * 1. Eye Aspect Ratio (EAR) - determines if eyes are open
 * 2. Face orientation - determines if looking forward
 * 3. Combined = "EYE CONTACT" or "NO EYE CONTACT"
 */

const EyeContactGame = () => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  
  // ============================================================
  // REFS - Direct DOM access needed for MediaPipe
  // ============================================================
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);

  // ============================================================
  // MEDIAPIPE FACE MESH LANDMARKS
  // These are the specific landmark indices we need
  // ============================================================
  const LANDMARKS = {
    // Left eye landmarks (6 points forming eye contour)
    LEFT_EYE: {
      TOP: 159,
      BOTTOM: 145,
      LEFT: 33,
      RIGHT: 133,
      TOP_INNER: 158,
      BOTTOM_INNER: 153
    },
    // Right eye landmarks (6 points forming eye contour)
    RIGHT_EYE: {
      TOP: 386,
      BOTTOM: 374,
      LEFT: 362,
      RIGHT: 263,
      TOP_INNER: 385,
      BOTTOM_INNER: 380
    },
    // Face orientation landmarks
    NOSE_TIP: 1,
    LEFT_EYE_CENTER: 33,
    RIGHT_EYE_CENTER: 263
  };

  // ============================================================
  // AUDIO PLAYBACK
  // Play "Hi! Look at me!" using Web Speech API
  // ============================================================
  const playAudio = () => {
    console.log('🔊 Playing audio prompt...');
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Hi! Look at me!');
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      utterance.onstart = () => console.log('✓ Audio started');
      utterance.onend = () => console.log('✓ Audio ended');
      utterance.onerror = (e) => console.error('❌ Audio error:', e);
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('❌ Speech synthesis not supported');
    }
  };

  // ============================================================
  // EYE ASPECT RATIO (EAR) CALCULATION
  // Determines if eye is open or closed
  // 
  // Formula: EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
  // Where p1-p6 are the 6 eye landmarks
  // 
  // Threshold: EAR > 0.2 means eye is OPEN
  // ============================================================
  const calculateEAR = (eye, landmarks) => {
    // Get landmark coordinates
    const p1 = landmarks[eye.LEFT];
    const p2 = landmarks[eye.TOP];
    const p3 = landmarks[eye.TOP_INNER];
    const p4 = landmarks[eye.RIGHT];
    const p5 = landmarks[eye.BOTTOM_INNER];
    const p6 = landmarks[eye.BOTTOM];

    // Calculate Euclidean distances
    const vertical1 = Math.sqrt(
      Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2)
    );
    const horizontal = Math.sqrt(
      Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2)
    );

    // EAR formula
    const ear = (vertical1 + vertical2) / (2.0 * horizontal);
    
    return ear;
  };

  // ============================================================
  // FACE ORIENTATION CHECK
  // Determines if face is looking forward (frontal)
  // 
  // Method: Compare nose position relative to eyes
  // If nose is centered between eyes = frontal face
  // 
  // Threshold: alignment > 0.85 means FRONTAL
  // ============================================================
  const isFaceFrontal = (landmarks) => {
    const nose = landmarks[LANDMARKS.NOSE_TIP];
    const leftEye = landmarks[LANDMARKS.LEFT_EYE_CENTER];
    const rightEye = landmarks[LANDMARKS.RIGHT_EYE_CENTER];

    // Calculate horizontal center between eyes
    const eyeCenter = (leftEye.x + rightEye.x) / 2;
    
    // Calculate how far nose is from center (0 = perfect center)
    const noseOffset = Math.abs(nose.x - eyeCenter);
    
    // Calculate eye distance (face width reference)
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    
    // Alignment score: 1.0 = perfect frontal, 0.0 = profile
    const alignment = 1.0 - (noseOffset / eyeDistance);
    
    console.log(`📐 Face alignment: ${alignment.toFixed(2)}`);
    
    return alignment > 0.85;
  };

  // ============================================================
  // EYE CONTACT DETECTION
  // Main logic: Combines EAR + face orientation
  // ============================================================
  const detectEyeContact = (landmarks) => {
    // Calculate EAR for both eyes
    const leftEAR = calculateEAR(LANDMARKS.LEFT_EYE, landmarks);
    const rightEAR = calculateEAR(LANDMARKS.RIGHT_EYE, landmarks);
    const avgEAR = (leftEAR + rightEAR) / 2;

    // Check if eyes are open (EAR threshold)
    const eyesOpen = avgEAR > 0.2;
    
    // Check if face is frontal
    const isFrontal = isFaceFrontal(landmarks);

    // Log detailed metrics
    console.log(`👁️ Left EAR: ${leftEAR.toFixed(3)}, Right EAR: ${rightEAR.toFixed(3)}, Avg: ${avgEAR.toFixed(3)}`);
    console.log(`👀 Eyes open: ${eyesOpen}, Face frontal: ${isFrontal}`);

    // FINAL DETERMINATION
    if (eyesOpen && isFrontal) {
      console.log('✅ EYE CONTACT');
      return true;
    } else {
      console.log('❌ NO EYE CONTACT');
      return false;
    }
  };

  // ============================================================
  // MEDIAPIPE RESULTS CALLBACK
  // Called for each video frame processed by FaceMesh
  // ============================================================
  const onFaceMeshResults = (results) => {
    // Get canvas context for drawing
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Check if face detected
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setFaceDetected(true);
      
      // Get first face landmarks (assuming single person)
      const landmarks = results.multiFaceLandmarks[0];
      
      // PERFORM EYE CONTACT DETECTION
      detectEyeContact(landmarks);

      // Draw landmarks for visual feedback (optional)
      drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
    } else {
      setFaceDetected(false);
      console.log('⚠️ No face detected');
    }
  };

  // ============================================================
  // DRAW LANDMARKS ON CANVAS
  // Visual feedback to see what MediaPipe detects
  // ============================================================
  const drawLandmarks = (ctx, landmarks, width, height) => {
    // Draw eye landmarks in green
    ctx.fillStyle = '#00ff00';
    
    const eyeLandmarks = [
      ...Object.values(LANDMARKS.LEFT_EYE),
      ...Object.values(LANDMARKS.RIGHT_EYE)
    ];

    eyeLandmarks.forEach(index => {
      const point = landmarks[index];
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw nose in red
    ctx.fillStyle = '#ff0000';
    const nose = landmarks[LANDMARKS.NOSE_TIP];
    ctx.beginPath();
    ctx.arc(nose.x * width, nose.y * height, 4, 0, 2 * Math.PI);
    ctx.fill();
  };

  // ============================================================
  // INITIALIZE MEDIAPIPE FACE MESH
  // Set up FaceMesh model and camera
  // ============================================================
  const initializeFaceMesh = async () => {
    console.log('🚀 Initializing MediaPipe FaceMesh...');

    // Create FaceMesh instance
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    // Configure FaceMesh
    faceMesh.setOptions({
      maxNumFaces: 1,              // Single person only
      refineLandmarks: true,       // Better eye detection
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // Set results callback
    faceMesh.onResults(onFaceMeshResults);

    // Store reference
    faceMeshRef.current = faceMesh;

    console.log('✓ FaceMesh initialized');
  };

  // ============================================================
  // START CAMERA
  // Request camera access and start streaming
  // ============================================================
  const startCamera = async () => {
    console.log('📹 Starting camera...');

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user' // Front camera
        },
        audio: false
      });

      // Set video source
      const video = videoRef.current;
      video.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // Set canvas size to match video
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log('✓ Camera started');
      setCameraReady(true);

      // Initialize camera for MediaPipe
      const camera = new Camera(video, {
        onFrame: async () => {
          if (faceMeshRef.current) {
            await faceMeshRef.current.send({ image: video });
          }
        },
        width: 640,
        height: 480
      });

      cameraRef.current = camera;
      camera.start();

      console.log('✓ MediaPipe camera loop started');

    } catch (error) {
      console.error('❌ Camera error:', error);
      alert('Camera access denied or not available');
    }
  };

  // ============================================================
  // START GAME
  // Main entry point when button clicked
  // ============================================================
  const handleStartGame = async () => {
    console.log('🎮 Starting game...');
    
    setIsPlaying(true);

    // Step 1: Initialize FaceMesh
    await initializeFaceMesh();

    // Step 2: Start camera
    await startCamera();

    // Step 3: Play audio prompt
    setTimeout(() => {
      playAudio();
    }, 500); // Small delay to ensure camera is ready
  };

  // ============================================================
  // CLEANUP
  // Stop camera and FaceMesh when component unmounts
  // ============================================================
  useEffect(() => {
    return () => {
      // Stop camera
      if (cameraRef.current) {
        cameraRef.current.stop();
      }

      // Stop video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

      // Clear speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      console.log('🧹 Cleanup complete');
    };
  }, []);

  // ============================================================
  // RENDER
  // ============================================================
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
      
      {/* Title */}
      <h1 style={{ marginBottom: '20px', color: '#333' }}>
        👁️ Eye Contact Detection Test
      </h1>

      {/* Start Button - Only show before game starts */}
      {!isPlaying && (
        <button
          onClick={handleStartGame}
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
          START GAME
        </button>
      )}

      {/* Game Area - Show after game starts */}
      {isPlaying && (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          
          {/* Camera Preview */}
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              style={{
                width: '640px',
                height: '480px',
                border: '3px solid #333',
                borderRadius: '10px',
                transform: 'scaleX(-1)' // Mirror effect
              }}
            />
            
            {/* Status Indicators */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '10px',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              <div>📹 Camera: {cameraReady ? '✓ Ready' : '⏳ Starting...'}</div>
              <div>👤 Face: {faceDetected ? '✓ Detected' : '❌ Not detected'}</div>
            </div>

            {/* Hidden video element - MediaPipe needs this */}
            <video
              ref={videoRef}
              style={{ display: 'none' }}
              playsInline
            />
          </div>

          {/* Cartoon Face */}
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '200px' }}>
              😊
            </div>
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '18px', color: '#666' }}>
              Look at me!
            </p>
          </div>

        </div>
      )}

      {/* Instructions */}
      {isPlaying && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#333', marginBottom: '10px' }}>📝 Instructions</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Open the browser console (F12) to see detailed detection logs.
            <br />
            Look at the cartoon face to trigger "EYE CONTACT".
            <br />
            Look away to trigger "NO EYE CONTACT".
          </p>
        </div>
      )}

    </div>
  );
};

export default EyeContactGame;
