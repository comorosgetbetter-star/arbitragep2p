import { useState, useEffect } from 'react';

interface CountryData {
  country: string;
  countryCode: string;
  isLoading: boolean;
  error: string | null;
}

const countries = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', dialCode: '+57' },
  { code: 'PE', name: 'Peru', dialCode: '+51' },
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
