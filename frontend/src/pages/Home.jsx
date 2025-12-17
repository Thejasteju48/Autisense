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
      title: '5 Interactive Games',
      description: 'Eye contact detection, smile recognition, gesture imitation, repetitive behavior tracking, and copying tasks - all through fun, engaging activities.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Evidence-Based Assessment',
      description: 'Uses validated behavioral markers from M-CHAT-R and clinical autism screening protocols, analyzing eye contact, social responsiveness, and imitation.'
    },
    {
      icon: ChartBarIcon,
      title: 'Comprehensive Reports',
      description: 'Detailed analysis of each interaction with risk scoring (Low/Moderate/High), personalized insights, and professional recommendations.'
    },
    {
      icon: ClockIcon,
      title: 'Just 3 Minutes',
      description: 'Complete screening in one session - 5 games totaling ~3 minutes. No uploads, no questionnaires during play, just natural child interaction.'
    },
    {
      icon: UserGroupIcon,
      title: 'Multi-Child Tracking',
      description: 'Manage profiles for multiple children (ages 12-72 months), compare screening history, and monitor developmental progress over time.'
    },
    {
      icon: CheckCircleIcon,
      title: 'Privacy First',
      description: 'All assessments happen in-browser using webcam. No video uploads required. Your child\'s data stays secure and private.'
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
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Autisense</span>
          </h1>
          <p className="text-2xl text-gray-800 mb-4 leading-relaxed font-semibold">
            An Intelligent Web System for Early Detection of Autism
          </p>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Interactive <strong>3-minute assessment</strong> for children aged 12-72 months. Your child plays 5 engaging games while our AI analyzes key autism markers: eye contact, smiles, gestures, repetitive behaviors, and imitation. Get instant risk assessment and recommendations.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register">
              <button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-lg shadow-xl hover:shadow-2xl transition-all text-lg">
                Start Free Screening
              </button>
            </Link>
            <a href="#how-it-works">
              <button className="bg-white hover:bg-purple-50 text-purple-700 font-bold py-4 px-8 rounded-lg shadow-xl hover:shadow-2xl transition-all text-lg border-2 border-purple-600">
                Learn More
              </button>
            </a>
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
              engaging screening tool that helps parents identify potential early signs of autism in children aged 18 months to 5 years.
            </p>
            <p className="text-lg text-purple-100 mb-6 leading-relaxed">
              Through interactive games designed by developmental specialists, we assess key behavioral markers including 
              eye contact, social responsiveness, gesture recognition, and imitation skills. Our screening process is 
              designed to be comfortable for children while providing parents with valuable insights.
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
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-purple-200 hover:border-purple-400"
              >
                <feature.icon className="h-12 w-12 text-purple-600 mb-4" />
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Interactive Games</h3>
                  <p className="text-gray-700">Your child plays 5 engaging games designed to assess key developmental behaviors naturally.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Review Results</h3>
                  <p className="text-gray-700">Receive a detailed screening report with personalized recommendations and next steps.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                  4
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
            Take the first step in understanding your child's development. Our screening takes just 15-20 minutes.
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
