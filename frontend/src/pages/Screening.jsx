import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { screeningAPI } from '../services/api';

const Screening = () => {
  const { childId } = useParams();
  const [step, setStep] = useState(1); // 1: Start, 2: Video, 3: Audio, 4: Questionnaire, 5: Processing
  const [screening, setScreening] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [questionnaire, setQuestionnaire] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  const startScreening = async () => {
    setLoading(true);
    try {
      const response = await screeningAPI.start(childId);
      setScreening(response.data.data.screening);
      setQuestionnaire(response.data.data.questionnaire);
      setStep(2);
      toast.success('Screening started!');
    } catch (error) {
      toast.error('Failed to start screening');
    } finally {
      setLoading(false);
    }
  };

  const uploadVideo = async () => {
    if (!videoFile) {
      toast.error('Please select a video');
      return;
    }
    setLoading(true);
    try {
      await screeningAPI.analyzeVideo(screening._id, videoFile);
      toast.success('Video analyzed!');
      setStep(3);
    } catch (error) {
      toast.error('Video analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const uploadAudio = async () => {
    if (!audioFile) {
      toast.error('Please select audio');
      return;
    }
    setLoading(true);
    try {
      await screeningAPI.analyzeAudio(screening._id, audioFile);
      toast.success('Audio analyzed!');
      setStep(4);
    } catch (error) {
      toast.error('Audio analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const submitQuestionnaire = async () => {
    const responseArray = Object.entries(responses).map(([questionId, answer]) => ({
      questionId: parseInt(questionId),
      answer
    }));
    
    setLoading(true);
    try {
      await screeningAPI.submitQuestionnaire(screening._id, responseArray);
      await screeningAPI.complete(screening._id);
      toast.success('Screening completed!');
      window.location.href = `/screening/${screening._id}/results`;
    } catch (error) {
      toast.error('Failed to complete screening');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition max-w-4xl mx-auto">
      <div className="card">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Autism Screening</h2>
            <span className="text-sm text-gray-500">Step {step}/4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${(step / 4) * 100}%` }}></div>
          </div>
        </div>

        {step === 1 && (
          <div className="text-center py-8">
            <h3 className="text-xl font-bold mb-4">Ready to Start?</h3>
            <p className="text-gray-600 mb-6">This screening will include video analysis, audio analysis, and a questionnaire.</p>
            <button onClick={startScreening} disabled={loading} className="btn-primary">{loading ? 'Starting...' : 'Start Screening'}</button>
          </div>
        )}

        {step === 2 && (
          <div className="py-8">
            <h3 className="text-xl font-bold mb-4">Upload Video</h3>
            <p className="text-gray-600 mb-4">Upload a video of your child (2-5 minutes recommended)</p>
            <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} className="input-field mb-4" />
            <button onClick={uploadVideo} disabled={loading || !videoFile} className="btn-primary">{loading ? 'Analyzing...' : 'Analyze Video'}</button>
          </div>
        )}

        {step === 3 && (
          <div className="py-8">
            <h3 className="text-xl font-bold mb-4">Upload Audio</h3>
            <p className="text-gray-600 mb-4">Upload audio of your child speaking or making sounds</p>
            <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} className="input-field mb-4" />
            <button onClick={uploadAudio} disabled={loading || !audioFile} className="btn-primary">{loading ? 'Analyzing...' : 'Analyze Audio'}</button>
          </div>
        )}

        {step === 4 && (
          <div className="py-8">
            <h3 className="text-xl font-bold mb-4">Questionnaire</h3>
            <div className="space-y-4">
              {questionnaire.map((q) => (
                <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-2">{q.question}</p>
                  <div className="flex space-x-4">
                    <button onClick={() => setResponses({...responses, [q.id]: true})} className={`px-4 py-2 rounded-lg ${responses[q.id] === true ? 'bg-primary-500 text-white' : 'bg-white border'}`}>Yes</button>
                    <button onClick={() => setResponses({...responses, [q.id]: false})} className={`px-4 py-2 rounded-lg ${responses[q.id] === false ? 'bg-primary-500 text-white' : 'bg-white border'}`}>No</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={submitQuestionnaire} disabled={loading || Object.keys(responses).length < questionnaire.length} className="btn-primary mt-6">{loading ? 'Submitting...' : 'Complete Screening'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Screening;
