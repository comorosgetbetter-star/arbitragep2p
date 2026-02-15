import { useState, useEffect } from 'react';

interface CountryData {
  country: string;
  countryCode: string;
  isLoading: boolean;
  error: string | null;
}

const countries = [
  { code: 'US', name: 'United States', dialCode: '+1', phoneDigits: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', phoneDigits: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', phoneDigits: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', phoneDigits: 9 },
  { code: 'DE', name: 'Germany', dialCode: '+49', phoneDigits: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', phoneDigits: 9 },
  { code: 'ES', name: 'Spain', dialCode: '+34', phoneDigits: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', phoneDigits: 10 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', phoneDigits: 9 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', phoneDigits: 11 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', phoneDigits: 10 },
  { code: 'IN', name: 'India', dialCode: '+91', phoneDigits: 10 },
  { code: 'JP', name: 'Japan', dialCode: '+81', phoneDigits: 10 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', phoneDigits: 10 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', phoneDigits: 8 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', phoneDigits: 9 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', phoneDigits: 10 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', phoneDigits: 9 },
  { code: 'KE', name: 'Kenya', dialCode: '+254', phoneDigits: 9 },
  { code: 'GH', name: 'Ghana', dialCode: '+233', phoneDigits: 9 },
  { code: 'PH', name: 'Philippines', dialCode: '+63', phoneDigits: 10 },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', phoneDigits: 11 },
  { code: 'TH', name: 'Thailand', dialCode: '+66', phoneDigits: 9 },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', phoneDigits: 10 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', phoneDigits: 10 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', phoneDigits: 10 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', phoneDigits: 10 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', phoneDigits: 10 },
  { code: 'RU', name: 'Russia', dialCode: '+7', phoneDigits: 10 },
  { code: 'PL', name: 'Poland', dialCode: '+48', phoneDigits: 9 },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', phoneDigits: 9 },
  { code: 'AR', name: 'Argentina', dialCode: '+54', phoneDigits: 10 },
  { code: 'CL', name: 'Chile', dialCode: '+56', phoneDigits: 9 },
  { code: 'CO', name: 'Colombia', dialCode: '+57', phoneDigits: 10 },
  { code: 'PE', name: 'Peru', dialCode: '+51', phoneDigits: 9 },
];

export const useCountryDetection = (): CountryData & { countries: typeof countries } => {
  const [data, setData] = useState<CountryData>({
    country: '',
    countryCode: '',
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Using a free IP geolocation API
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed to detect location');
        
        const result = await response.json();
        const detectedCountry = countries.find(c => c.code === result.country_code);
        
        setData({
          country: detectedCountry?.name || result.country_name || 'United States',
          countryCode: result.country_code || 'US',
          isLoading: false,
          error: null,
        });
      } catch (error) {
        // Default to US if detection fails
        setData({
          country: 'United States',
          countryCode: 'US',
          isLoading: false,
          error: null,
        });
      }
    };

    detectCountry();
  }, []);

  return { ...data, countries };
};
