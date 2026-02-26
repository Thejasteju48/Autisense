import { Link } from 'react-router-dom';
import { 
  SparklesIcon, 
  ShieldCheckIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const Home = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: SparklesIcon,
      title: 'Recorded Video Analysis',
      description: 'Behavioral assessment using AI-powered video processing. Upload pre-recorded videos for analysis. Monitors 6 key behavioral indicators with advanced computer vision.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Evidence-Based Assessment',
      description: 'Based on DSM-5 autism diagnostic criteria and M-CHAT-R protocols. Analyzes eye contact, hand stimming, head stimming, hand gestures, social reciprocity, and emotion variation.'
    },
    {
      icon: ChartBarIcon,
      title: 'Professional Reports',
      description: 'Comprehensive risk assessment (Low/Moderate/High) with feature breakdown, confidence scores, and personalized clinical recommendations.'
    },
    {
      icon: ClockIcon,
      title: '2-4 Minutes Assessment',
      description: 'Quick and efficient screening session. Recorded video analysis combined with clinical questionnaire for accurate results.'
    },
    {
      icon: UserGroupIcon,
      title: 'Multi-Child Tracking',
      description: 'Manage profiles for multiple children (ages 12-72 months), compare screening history, and monitor developmental progress over time.'
    },
    {
      icon: CheckCircleIcon,
      title: 'Privacy First',
      description: 'No long-term video storage. Analysis only transmits behavioral signals. Your child\'s privacy is fully protected.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100">
      {/* Public Navbar */}
      <nav className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <SparklesIcon className="h-8 w-8 text-purple-200" />
              <span className="text-xl font-bold text-white">Autisense</span>
            </Link>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => scrollToSection('about')}
                className="px-4 py-2 rounded-lg text-purple-100 hover:bg-white/10 transition-all font-medium"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="px-4 py-2 rounded-lg text-purple-100 hover:bg-white/10 transition-all font-medium"
              >
                Features
              </button>
              <Link to="/login"
                className="ml-4 px-6 py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-lg font-bold transition-all shadow-lg"
              >
                Start Screening
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-purple-400/40 blur-3xl" />
        <div className="absolute top-10 right-0 h-96 w-96 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
                AI-powered screening • Recorded video
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mt-6 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Autisense</span>
                <span className="block text-4xl md:text-5xl text-gray-900 mt-3">Early Autism Insight, Faster</span>
              </h1>
              <p className="text-2xl text-gray-800 mb-4 leading-relaxed font-semibold">
                An Intelligent Web System for Early Detection of Autism
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-2xl">
                Professional <strong>video behavior assessment combined with clinical questionnaire</strong> for children aged 12-72 months. Our AI analyzes recorded video to detect 6 key autism markers: eye contact, hand stimming, head stimming, hand gestures, social reciprocity, and emotion variation. Parents complete a 20-question questionnaire based on DSM-5 criteria. Results combine both assessments (60% questionnaire + 40% video) for comprehensive risk evaluation. Get instant risk assessment with clinical recommendations.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all text-lg">
                    Start Free Screening
                  </button>
                </Link>
                <a href="#how-it-works">
                  <button className="bg-white/90 hover:bg-purple-50 text-purple-700 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg border border-purple-200">
                    Learn More
                  </button>
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full bg-white/80 border border-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
                  6 behavioral markers
                </span>
                <span className="inline-flex items-center rounded-full bg-white/80 border border-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
                  2-4 min typical analysis
                </span>
                <span className="inline-flex items-center rounded-full bg-white/80 border border-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
                  No video storage
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 opacity-70 blur-xl" />
              <div className="rounded-3xl bg-gradient-to-br from-white/95 to-purple-50/80 border border-purple-100 shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recorded Video Assessment</h3>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">Secure & Private</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-white/90 p-4 shadow-sm">
                    <span className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">1</span>
                    <div>
                      <p className="font-semibold text-gray-900">Upload recorded video</p>
                      <p className="text-sm text-gray-600">Provide a recorded session for analysis.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
                    <span className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">2</span>
                    <div>
                      <p className="font-semibold text-gray-900">Complete questionnaire</p>
                      <p className="text-sm text-gray-600">Answer 20 clinical questions about your child's behavior and development (60% of assessment).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-white/90 p-4 shadow-sm">
                    <span className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">3</span>
                    <div>
                      <p className="font-semibold text-gray-900">Get instant report</p>
                      <p className="text-sm text-gray-600">Receive combined assessment with risk level, behavior analysis, and personalized recommendations.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-purple-100 bg-white/80 p-3">
                    <p className="text-sm font-semibold text-gray-900">Recorded upload</p>
                    <p className="text-xs text-gray-600">Video + questionnaire</p>
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-white/80 p-3">
                    <p className="text-sm font-semibold text-gray-900">Dual assessment</p>
                    <p className="text-xs text-gray-600">60% Q + 40% video</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-gradient-to-r from-purple-600 to-indigo-600 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6 text-center">About Our Platform</h2>
            <p className="text-lg text-purple-100 mb-6 leading-relaxed">
              Early identification of autism spectrum disorder (ASD) is crucial for ensuring children receive timely 
              interventions that can significantly improve developmental outcomes. Our platform provides an accessible, 
              professional screening system that helps parents identify potential early signs of autism in children aged 12 months to 6 years.
            </p>
            <p className="text-lg text-purple-100 mb-6 leading-relaxed">
              Our comprehensive screening combines two proven assessment methods. Through advanced recorded video analysis powered by MediaPipe AI, we assess 6 key behavioral markers including 
              eye contact, repetitive movements, gestures, social reciprocity, and emotion variation (40% of assessment). This is combined with a clinical questionnaire 
              completed by parents with 20 carefully-designed questions based on DSM-5 criteria (60% of assessment). This dual-method approach provides accurate, evidence-based risk evaluation.
            </p>
            <div className="bg-white border-l-4 border-purple-300 p-6 rounded-r-lg">
              <p className="text-purple-900 font-semibold">
                <strong>Important:</strong> This tool is designed for screening purposes only and is not a diagnostic tool. 
                A positive screening result indicates the need for further evaluation by a qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Key Features</h2>
            <p className="text-lg text-gray-600 mt-3">Clinical-grade analysis, designed to be fast, private, and parent-friendly.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/90 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-purple-100 hover:border-purple-300"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mb-4 shadow-md">
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gradient-to-br from-purple-100 to-indigo-100 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">How It Works</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your Account</h3>
                  <p className="text-gray-700">Sign up and add your child's profile with basic information.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Recorded Video Assessment</h3>
                  <p className="text-gray-700">Upload a recorded session for analysis. Typical processing takes 2-4 minutes.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Parent Questionnaire</h3>
                  <p className="text-gray-700">Answer 20 clinically-designed yes/no questions about your child's behavior and development. This represents 60% of the final risk assessment.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Review Combined Results</h3>
                  <p className="text-gray-700">Receive a detailed screening report combining video analysis (40%) and questionnaire assessment (60%) for comprehensive risk evaluation.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  5
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Take Action</h3>
                  <p className="text-gray-700">Connect with healthcare professionals and access resources for further evaluation if needed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Take the first step in understanding your child's development. Our screening takes just 15-20 minutes: 
            upload a recorded video, complete a brief questionnaire, and receive instant risk assessment.
          </p>
          <Link to="/register">
            <button className="bg-white hover:bg-purple-50 text-purple-700 font-bold py-4 px-10 rounded-lg shadow-2xl hover:shadow-3xl transition-all text-lg">
              Begin Free Screening
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-purple-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <SparklesIcon className="h-6 w-6 text-purple-400" />
                <span className="text-xl font-bold text-white">Autism Screening</span>
              </div>
              <p className="text-purple-200">
                Evidence-based autism screening through interactive assessments.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="hover:text-purple-400 transition-colors">About</a></li>
                <li><a href="#features" className="hover:text-purple-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-purple-400 transition-colors">How It Works</a></li>
                <li><Link to="/login" className="hover:text-purple-400 transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Disclaimer</h3>
              <p className="text-purple-200 text-sm">
                This screening tool is not a substitute for professional medical advice, diagnosis, or treatment. 
                Always seek the advice of your physician or other qualified health provider.
              </p>
            </div>
          </div>
          <div className="border-t border-purple-700 mt-8 pt-8 text-center text-purple-300 text-sm">
            <p>&copy; 2025 Autisense. An Intelligent Web System for Early Detection of Autism. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
