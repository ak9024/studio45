import { useState, useEffect } from 'react';
import { Phone, Building2, MapPin, Globe } from 'lucide-react';
import { Input } from '../../ui/Input';

interface ContactStepProps {
  formData: {
    phone: string;
    company: string;
    location?: string;
    timezone?: string;
  };
  errors: {
    phone?: string;
    company?: string;
    location?: string;
  };
  onChange: (field: string, value: string) => void;
  onValidationChange: (isValid: boolean) => void;
}

const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const phoneRegex = /[^\d]/g;
  let phone = value.replace(phoneRegex, '');
  
  // Handle Indonesian mobile numbers starting with 62 (country code)
  if (phone.startsWith('62') && phone.length > 2) {
    phone = '0' + phone.slice(2); // Convert +62 to 0
  }
  
  const phoneLength = phone.length;
  
  // Format Indonesian mobile numbers (0XXX-XXXX-XXXX)
  if (phoneLength <= 4) return phone;
  if (phoneLength <= 8) {
    return `${phone.slice(0, 4)}-${phone.slice(4)}`;
  }
  if (phoneLength <= 12) {
    return `${phone.slice(0, 4)}-${phone.slice(4, 8)}-${phone.slice(8)}`;
  }
  
  // Limit to 12 digits for Indonesian numbers
  return `${phone.slice(0, 4)}-${phone.slice(4, 8)}-${phone.slice(8, 12)}`;
};

export const ContactStep = ({
  formData,
  errors,
  onChange,
  onValidationChange
}: ContactStepProps) => {
  const [phoneValue, setPhoneValue] = useState(formData.phone || '');
  const [companyValue, setCompanyValue] = useState(formData.company || '');
  const [locationValue, setLocationValue] = useState(formData.location || '');
  const [phoneError, setPhoneError] = useState<string | undefined>(errors.phone);
  const [companyError, setCompanyError] = useState<string | undefined>(errors.company);

  useEffect(() => {
    setPhoneValue(formData.phone || '');
    setCompanyValue(formData.company || '');
    setLocationValue(formData.location || '');
  }, [formData]);

  useEffect(() => {
    setPhoneError(errors.phone);
    setCompanyError(errors.company);
  }, [errors]);

  const validatePhone = (value: string): string | undefined => {
    if (!value.trim()) return undefined; // Optional field
    
    const cleanPhone = value.replace(/[^\d]/g, '');
    
    // Indonesian mobile numbers: 08XX-XXXX-XXXX (10-12 digits total)
    // Valid prefixes: 081, 082, 083, 085, 087, 088, 089, etc.
    const indonesianMobileRegex = /^08\d{8,10}$/;
    const formattedRegex = /^08\d{2}-\d{4}-\d{4}$/;
    
    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    
    if (cleanPhone.length > 13) {
      return 'Phone number cannot exceed 13 digits';
    }
    
    // Check if it's a valid Indonesian mobile number
    if (cleanPhone.length >= 10) {
      if (!indonesianMobileRegex.test(cleanPhone) && !formattedRegex.test(value)) {
        return 'Please enter a valid Indonesian mobile number (08XX-XXXX-XXXX)';
      }
    }
    
    return undefined;
  };

  const validateCompany = (value: string): string | undefined => {
    if (!value.trim()) return undefined; // Optional field
    
    if (value.trim().length > 255) {
      return 'Company name must be less than 255 characters';
    }
    
    return undefined;
  };

  const handlePhoneChange = (value: string) => {
    const formattedPhone = formatPhoneNumber(value);
    setPhoneValue(formattedPhone);
    
    const error = validatePhone(formattedPhone);
    setPhoneError(error);
    
    // Since this step is optional, always validate as true
    onValidationChange(true);
    onChange('phone', formattedPhone);
  };

  const handleCompanyChange = (value: string) => {
    setCompanyValue(value);
    
    const error = validateCompany(value);
    setCompanyError(error);
    
    // Since this step is optional, always validate as true
    onValidationChange(true);
    onChange('company', value);
  };

  const handleLocationChange = (value: string) => {
    setLocationValue(value);
    onChange('location', value);
  };

  const getCompletionPercentage = (): number => {
    const fields = [phoneValue, companyValue, locationValue];
    const filledFields = fields.filter(field => field.trim().length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Contact Information
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getCompletionPercentage()}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          All fields are optional, but completing them helps colleagues connect with you
        </p>
      </div>

      {/* Contact Form */}
      <div className="space-y-6">
        {/* Phone Number */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Phone Number</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your contact number (optional)</p>
            </div>
          </div>
          
          <Input
            id="phone"
            type="tel"
            value={phoneValue}
            onChange={(e) => handlePhoneChange(e.target.value)}
            error={phoneError}
            placeholder="0821-1234-5678"
            maxLength={15}
            className="text-lg"
            aria-describedby="phone-help"
          />
          
          <p id="phone-help" className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Format: 08XX-XXXX-XXXX • Indonesian mobile number for account notifications
          </p>
        </div>

        {/* Company */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Company</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Organization you work for (optional)</p>
            </div>
          </div>
          
          <Input
            id="company"
            type="text"
            value={companyValue}
            onChange={(e) => handleCompanyChange(e.target.value)}
            error={companyError}
            placeholder="Acme Corporation"
            maxLength={255}
            className="text-lg"
            aria-describedby="company-help"
          />
          
          <p id="company-help" className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Helps others identify your professional affiliation
          </p>
        </div>

        {/* Location (Future Enhancement) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 opacity-75">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Location</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your city or region (coming soon)</p>
            </div>
          </div>
          
          <Input
            id="location"
            type="text"
            value={locationValue}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder="San Francisco, CA"
            disabled
            className="text-lg"
            aria-describedby="location-help"
          />
          
          <p id="location-help" className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Coming soon - Location-based features and timezone detection
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Why provide contact information?
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Enhanced account security and recovery options</li>
              <li>• Better team collaboration and communication</li>
              <li>• Personalized experience based on your organization</li>
              <li>• Optional but recommended for professional use</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          🔒 Your contact information is private and secure. We never share your details with third parties.
        </p>
      </div>
    </div>
  );
};