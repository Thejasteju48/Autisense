# API Usage Examples

## Authentication Examples

### Register New User
```javascript
// Using fetch
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phoneNumber: '+1234567890'
  })
});

const data = await response.json();
console.log(data.data.token); // Save this token
```

### Login
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});

const data = await response.json();
localStorage.setItem('token', data.data.token);
```

---

## Child Management Examples

### Add Child with Profile Image
```javascript
const formData = new FormData();
formData.append('name', 'Emma Smith');
formData.append('nickname', 'Emmy');
formData.append('ageInMonths', '36');
formData.append('gender', 'female');
formData.append('profileImage', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/children', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
```

### Get All Children
```javascript
const response = await fetch('http://localhost:5000/api/children', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data.children);
```

---

## Screening Flow Example

### Complete Screening Flow
```javascript
// 1. Start Screening
const startResponse = await fetch('http://localhost:5000/api/screenings/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    childId: 'child_id_here'
  })
});

const { screening, questionnaire } = (await startResponse.json()).data;

// 2. Upload and Analyze Video
const videoFormData = new FormData();
videoFormData.append('video', videoFile);

await fetch(`http://localhost:5000/api/screenings/${screening._id}/video`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: videoFormData
});

// 3. Upload and Analyze Audio
const audioFormData = new FormData();
audioFormData.append('audio', audioFile);

await fetch(`http://localhost:5000/api/screenings/${screening._id}/audio`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: audioFormData
});

// 4. Submit Questionnaire
const responses = [
  { questionId: 1, answer: true },
  { questionId: 2, answer: false },
  // ... all 10 questions
];

await fetch(`http://localhost:5000/api/screenings/${screening._id}/questionnaire`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ responses })
});

// 5. Complete Screening
const completeResponse = await fetch(`http://localhost:5000/api/screenings/${screening._id}/complete`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const results = await completeResponse.json();
console.log('Final Score:', results.data.screening.finalScore);
console.log('Risk Level:', results.data.screening.riskLevel);
```

---

## ML Service Direct Usage

### Analyze Video Directly
```python
import requests

url = 'http://localhost:8000/analyze/video'
files = {'video': open('sample_video.mp4', 'rb')}

response = requests.post(url, files=files)
features = response.json()

print(f"Eye Contact: {features['eyeContactRatio']}")
print(f"Gestures: {features['gestureFrequency']}")
print(f"Repetitive: {features['repetitiveBehaviorRatio']}")
print(f"Smiles: {features['smileFrequency']}")
```

### Analyze Audio Directly
```python
import requests

url = 'http://localhost:8000/analyze/audio'
files = {'audio': open('sample_audio.wav', 'rb')}

response = requests.post(url, files=files)
features = response.json()

print(f"Vocal Activity: {features['vocalActivityRatio']}")
print(f"Energy Level: {features['energyLevel']}")
```

### Get Autism Prediction
```python
import requests

url = 'http://localhost:8000/predict/autism'
data = {
    "videoFeatures": {
        "eyeContactRatio": 0.45,
        "gestureFrequency": 3.2,
        "repetitiveBehaviorRatio": 0.35,
        "smileFrequency": 2.1
    },
    "audioFeatures": {
        "vocalActivityRatio": 0.30,
        "energyLevel": 0.04
    },
    "questionnaireScore": 0.6
}

response = requests.post(url, json=data)
prediction = response.json()

print(f"Autism Probability: {prediction['autismProbability']}%")
print(f"Risk Level: {prediction['riskLevel']}")
print(f"Summary: {prediction['interpretation']['summary']}")
```

---

## Game Session Example

### Record Game Session
```javascript
const response = await fetch('http://localhost:5000/api/games/session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    childId: 'child_id_here',
    gameType: 'eye-contact',
    gameName: 'Follow the Friend',
    performance: {
      score: 85,
      accuracy: 80,
      completionRate: 100,
      timeSpent: 120,
      attempts: 1,
      correctResponses: 8,
      incorrectResponses: 2
    },
    observations: {
      eyeContactDuration: 45,
      responseTime: 2.5,
      engagementLevel: 'high'
    },
    duration: 120
  })
});
```

### Get Game Statistics
```javascript
const response = await fetch(`http://localhost:5000/api/games/child/${childId}/stats`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const stats = await response.json();
console.log('Total Sessions:', stats.data.overall.totalSessions);
console.log('Average Score:', stats.data.overall.averageScore);
```

---

## Error Handling Example

```javascript
async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}

// Usage
try {
  const data = await makeRequest('http://localhost:5000/api/children', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log(data);
} catch (error) {
  alert('Failed to fetch children: ' + error.message);
}
```

---

## Using Axios (Recommended)

```javascript
import axios from 'axios';

// Create instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage
const children = await api.get('/children');
const screening = await api.post('/screenings/start', { childId });
```
