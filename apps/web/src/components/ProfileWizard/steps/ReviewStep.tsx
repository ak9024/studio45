import { useEffect } from 'react';
import { Check, Edit, User, Phone, Mail, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../ui/Button';

type ProfileItem = {
  label: string;
  value: string | undefined;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
};

interface ReviewStepProps {
  formData: {
    name: string;
    phone: string;
    company: string;
    location?: string;
  };
  onValidationChange: (isValid: boolean) => void;
  onEditStep: (stepIndex: number) => void;
}

export const ReviewStep = ({ formData, onValidationChange, onEditStep }: ReviewStepProps) => {
  const { user } = useAuth();

  useEffect(() => {
    // Review step is always valid
    onValidationChange(true);
  }, [onValidationChange]);

  const getProfileCompletionScore = () => {
    const fields = [
      { key: 'name', value: formData.name, weight: 3 }, // Name is most important
      { key: 'phone', value: formData.phone, weight: 2 },
      { key: 'company', value: formData.company, weight: 2 },
      { key: 'location', value: formData.location, weight: 1 },
    ];

    const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
    const completedWeight = fields.reduce((sum, field) => {
      return sum + (field.value?.trim() ? field.weight : 0);
    }, 0);

    return Math.round((completedWeight / totalWeight) * 100);
  };

  const getCompletionLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'green', message: 'Outstanding! Your profile is comprehensive.' };
    if (score >= 75) return { level: 'Great', color: 'blue', message: 'Well done! Your profile looks professional.' };
    if (score >= 50) return { level: 'Good', color: 'yellow', message: 'Good start! Consider adding more details.' };
    return { level: 'Basic', color: 'gray', message: 'Basic profile. Add more info to stand out.' };
  };

  const score = getProfileCompletionScore();
  const completion = getCompletionLevel(score);

  const profileSections: Array<{
    title: string;
    stepIndex: number;
    icon: any;
    items: ProfileItem[];
  }> = [
    {
      title: 'Personal Information',
      stepIndex: 0,
      icon: User,
      items: [
        { label: 'Full Name', value: formData.name, required: true },
      ]
    },
    {
      title: 'Contact Details',
      stepIndex: 1,
      icon: Phone,
      items: [
        { label: 'Phone Number', value: formData.phone, placeholder: 'Not provided' },
        { label: 'Company', value: formData.company, placeholder: 'Not provided' },
        { label: 'Location', value: formData.location, placeholder: 'Coming soon' },
      ]
    },
    {
      title: 'Account Information',
      stepIndex: 2,
      icon: Mail,
      items: [
        { label: 'Email Address', value: user?.email, readonly: true },
        { label: 'User Roles', value: user?.roles?.join(', '), readonly: true, placeholder: 'No roles assigned' },
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Completion Header */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 mb-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Profile Review
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Review your information before completing your profile
          </p>
        </div>

        {/* Completion Score */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Profile Completion
            </span>
            <span className={`text-sm font-bold ${
              completion.color === 'green' ? 'text-green-600 dark:text-green-400' :
              completion.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
              completion.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-gray-600 dark:text-gray-400'
            }`}>
              {score}% • {completion.level}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${
                completion.color === 'green' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                completion.color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                completion.color === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                'bg-gradient-to-r from-gray-400 to-gray-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {completion.message}
          </p>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="space-y-6">
        {profileSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          const hasContent = section.items.some(item => item.value?.trim());
          
          return (
            <div
              key={sectionIndex}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Section Header */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      hasContent 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        hasContent 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {section.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {hasContent ? 'Information provided' : 'No information provided'}
                      </p>
                    </div>
                  </div>
                  
                  {!section.items.every(item => item.readonly === true) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditStep(section.stepIndex)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {item.label}
                        {item.required === true && <span className="text-red-500 ml-1">*</span>}
                        {item.readonly === true && <span className="text-gray-400 ml-1">(read-only)</span>}
                      </label>
                      
                      <div className={`px-4 py-3 rounded-lg border ${
                        item.value?.trim()
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}>
                        {item.value?.trim() ? (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {item.value}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 italic">
                            {item.placeholder || 'Not provided'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Benefits */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Complete Your Profile to Unlock:
            </h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Enhanced team collaboration and discoverability
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Personalized experience and recommendations
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Better account security and recovery options
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Professional appearance to colleagues and clients
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Final Message */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Ready to complete your profile? Click "Complete Profile" below to save all your information.
        </p>
      </div>
    </div>
  );
};