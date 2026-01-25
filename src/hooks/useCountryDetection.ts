import { useState, useEffect } from 'react';

interface CountryData {
  country: string;
  countryCode: string;
  isLoading: boolean;
  error: string | null;
}

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'EG', name: 'Egypt' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RU', name: 'Russia' },
  { code: 'PL', name: 'Poland' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
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
