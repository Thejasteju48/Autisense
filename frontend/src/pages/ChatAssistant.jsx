import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { chatAPI } from '../services/api';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'kn', label: 'Kannada' },
];

const formatMessage = (text) => {
  const sections = ['Explanation:', 'What it means:', 'Recommended actions:', 'Suggested next steps:'];
  const parts = [];
  let cursor = text || '';

  sections.forEach((heading, idx) => {
    const start = cursor.indexOf(heading);
    if (start === -1) return;

    const nextHeading = sections[idx + 1];
    const end = nextHeading ? cursor.indexOf(nextHeading, start + heading.length) : cursor.length;
    const content = cursor.slice(start + heading.length, end === -1 ? cursor.length : end).trim();

    let normalizedHeading = heading.replace(':', '');
    if (normalizedHeading === 'Suggested next steps') normalizedHeading = 'Recommended actions';
    parts.push({ heading: normalizedHeading, content });
  });

  if (!parts.length) {
    return [{ heading: 'Response', content: text || '' }];
  }

  return parts;
};

const ChatAssistant = () => {
  const { screeningId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const load = async () => {
      try {
        const [historyRes, suggestionsRes] = await Promise.all([
          chatAPI.getHistory(screeningId),
          chatAPI.getSuggestions(),
        ]);

        setMessages(historyRes?.data?.data?.messages || []);
        setSuggestions(suggestionsRes?.data?.data?.suggestions || []);
      } catch (error) {
        console.error('Failed to load chat data:', error);
        toast.error('Failed to load assistant chat');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [screeningId]);

  const canSend = useMemo(() => question.trim().length > 0 && !sending, [question, sending]);

  const sendQuestion = async (value) => {
    const q = String(value || '').trim();
    if (!q) return;

    const optimisticUserMessage = {
      role: 'user',
      text: q,
      createdAt: new Date().toISOString(),
      language,
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setQuestion('');
    setSending(true);

    try {
      const response = await chatAPI.sendMessage(screeningId, { question: q, language });
      const assistantText = response?.data?.data?.answer || 'No response generated.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: assistantText,
          createdAt: new Date().toISOString(),
          language,
        },
      ]);
    } catch (error) {
      console.error('Failed to send question:', error);
      toast.error('Failed to get assistant response');
    } finally {
      setSending(false);
    }
  };

  const handleUploadReport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only');
      return;
    }

    setUploading(true);
    try {
      const res = await chatAPI.uploadReport(screeningId, file);
      const indexing = res?.data?.data?.indexing;

      if (indexing && indexing.success === false) {
        const msg = indexing.error ? `Report uploaded, but indexing failed: ${indexing.error}` : 'Report uploaded, but indexing failed.';
        toast.error(msg);
      } else {
        toast.success('Medical report uploaded for assistant context');
      }
    } catch (error) {
      console.error('Failed to upload report:', error);
      toast.error('Failed to upload medical report');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Autism Support Assistant</p>
              <h1 className="text-2xl font-bold text-gray-900">Parent Guidance Chat</h1>
            </div>
            <div className="flex items-center gap-3">
              <label className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
                {uploading ? 'Uploading...' : 'Upload Medical Report (PDF)'}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleUploadReport}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
              <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-700">
                Back
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-b bg-white">
            <p className="text-sm text-gray-600 mb-2">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendQuestion(s)}
                  disabled={sending}
                  className="px-3 py-1.5 text-sm rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-6 space-y-4 max-h-[55vh] overflow-y-auto bg-slate-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Ask your first question about results, report, or next steps.</div>
            ) : messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl rounded-xl px-4 py-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="space-y-2">
                      {formatMessage(msg.text).map((part, idx) => (
                        <div key={`${part.heading}-${idx}`}>
                          <p className="font-bold text-sm">{part.heading}</p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{part.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t bg-white">
            <div className="flex gap-3">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                placeholder="Ask about results, report findings, next steps, or how to use the web app..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={() => sendQuestion(question)}
                disabled={!canSend}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatAssistant;
