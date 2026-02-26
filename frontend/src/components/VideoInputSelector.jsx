import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CloudArrowUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * Video Input Selector Component
 * Recorded-video-only upload flow
 */
const VideoInputSelector = ({ onSelect }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    {
      id: 'pre-recorded',
      title: 'Upload Video',
      description: 'Upload a pre-recorded video file',
      icon: CloudArrowUpIcon,
      color: 'green',
      requirements: [
        'MP4, WebM, or AVI format',
        'Duration: 1-5 minutes',
        'Maximum file size: 500MB'
      ]
    }
  ];

  const handleSelect = (optionId) => {
    setSelectedOption(optionId);
    onSelect(optionId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Video Analysis Setup
        </h2>
        <p className="text-lg text-gray-600">
          Upload a recorded video for behavioral analysis
        </p>
      </div>

      <div className="grid md:grid-cols-1 gap-6">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedOption === option.id;
          
          return (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative cursor-pointer rounded-2xl border-2 p-6 transition-all
                ${isSelected 
                  ? `border-${option.color}-500 bg-${option.color}-50 shadow-lg` 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
              `}
              onClick={() => handleSelect(option.id)}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4"
                >
                  <div className={`bg-${option.color}-500 text-white rounded-full p-1`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </motion.div>
              )}

              {/* Icon */}
              <div className={`
                inline-flex p-3 rounded-xl mb-4
                ${isSelected ? `bg-${option.color}-500` : `bg-${option.color}-100`}
              `}>
                <Icon className={`
                  w-8 h-8
                  ${isSelected ? 'text-white' : `text-${option.color}-600`}
                `} />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {option.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {option.description}
              </p>

              {/* Requirements */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="font-medium">Requirements:</span>
                </div>
                <ul className="space-y-1">
                  {option.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className={`text-${option.color}-500 mt-0.5`}>•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div className="flex gap-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Important Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Ensure the child's face is clearly visible throughout the video</li>
              <li>Maintain good lighting conditions for better analysis accuracy</li>
              <li>Keep the camera stable and at eye level with the child</li>
              <li>Allow natural behavior - avoid prompting or directing the child</li>
              <li>Longer videos (3-4 minutes) provide more accurate results</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoInputSelector;
