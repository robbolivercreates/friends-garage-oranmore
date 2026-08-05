import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
}

export const SEOHead: React.FC<SEOProps> = ({
  title = 'Friends Garage | Trusted Car Servicing & Repairs in Oranmore, Galway',
  description = 'Friends Garage in Deerpark Industrial Estate, Oranmore, Galway provides expert car servicing, brake repairs, diagnostics, tyres, and roadside assistance.',
  canonicalUrl = 'https://friendsgarage.net'
}) => {
  useEffect(() => {
    document.title = title;

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Set JSON-LD Schema
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'AutoRepair',
      'name': 'Friends Garage',
      'image': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=1200',
      'telephone': '+353-91-388-596',
      'email': 'info@friendsgarage.net',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Deerpark Industrial Estate',
        'addressLocality': 'Oranmore',
        'addressRegion': 'Co. Galway',
        'postalCode': 'H91 H31C',
        'addressCountry': 'IE'
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 53.2721,
        'longitude': -8.9284
      },
      'openingHoursSpecification': [
        {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          'opens': '09:00',
          'closes': '19:00'
        }
      ],
      'priceRange': '€€',
      'areaServed': ['Oranmore', 'Galway City', 'Claregalway', 'Athenry', 'Barna']
    };

    let scriptTag = document.getElementById('json-ld-schema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'json-ld-schema';
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schemaData);
  }, [title, description, canonicalUrl]);

  return null;
};
