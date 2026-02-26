import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { childrenAPI } from '../services/api';
import { CameraIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Button, Input, Select, Textarea, PageHeader } from '../components/ui';

const AddChild = () => {
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    ageInMonths: '',
    gender: '',
    dateOfBirth: '',
    notes: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const calculateAgeInMonths = (dobValue) => {
    if (!dobValue) return '';

    const dob = new Date(dobValue);
    if (Number.isNaN(dob.getTime())) return '';

    const today = new Date();
    let months = (today.getFullYear() - dob.getFullYear()) * 12;
    months += today.getMonth() - dob.getMonth();

    if (today.getDate() < dob.getDate()) {
      months -= 1;
    }

    return Math.max(0, months);
  };

  const handleChange = (e) => {
    if (e.target.name === 'dateOfBirth') {
      const calculatedMonths = calculateAgeInMonths(e.target.value);
      setFormData({
        ...formData,
        dateOfBirth: e.target.value,
        ageInMonths: calculatedMonths === '' ? '' : String(calculatedMonths),
      });
      return;
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.ageInMonths < 12 || formData.ageInMonths > 72) {
      toast.error('Age must be between 12 and 72 months (1-6 years)');
      return;
    }

    setLoading(true);

    try {
      const submitData = { ...formData };
      if (profileImage) {
        submitData.profileImage = profileImage;
      }

      await childrenAPI.create(submitData);
      toast.success('Child profile created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition max-w-2xl mx-auto">
      <PageHeader 
        title="Add Child Profile"
        subtitle="Enter your child's details to begin the autism screening assessment"
      />

      {/* Requirements Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-blue-900 font-medium">Screening Requirements</p>
            <p className="text-xs text-blue-700 mt-1">Child must be between <strong>12-72 months old (1-6 years)</strong> for accurate assessment</p>
          </div>
        </div>
      </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border-8 border-purple-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-200 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    <UserPlusIcon className="h-16 w-16" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-all">
                  <CameraIcon className="h-5 w-5 text-purple-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">Click camera to upload photo (optional)</p>
            </div>

            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter child's full name"
            />

            <Input
              label="Nickname (Optional)"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="Preferred name"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Age (in months)"
                type="number"
                name="ageInMonths"
                value={formData.ageInMonths}
                onChange={handleChange}
                required
                min="12"
                max="72"
                placeholder="e.g., 24"
                readOnly={Boolean(formData.dateOfBirth)}
                className={formData.dateOfBirth ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : ''}
                helpText={
                  formData.dateOfBirth
                    ? 'Auto-calculated from Date of Birth'
                    : 'Between 12 and 72 months (1-6 years)'
                }
              />

              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>

            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              helpText="Selecting a date will auto-calculate age in months"
            />

            <Textarea
              label="Notes (Optional)"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              maxLength="500"
              placeholder="Any additional information..."
            />

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default AddChild;
