/**
 * RelatedServices Component
 * Displays contextual service recommendations for internal linking
 */

import Link from 'next/link';
import { 
  Sparkles, 
  Star, 
  Heart, 
  Calendar, 
  TrendingUp, 
  Moon,
  ArrowRight,
  Eye
} from 'lucide-react';

const iconMap = {
  '/tarot': Sparkles,
  '/birth-chart': Star,
  '/compatibility': Heart,
  '/moon-reading': Moon,
  '/transits': TrendingUp,
  '/forecasts': Calendar,
  '/dashboard': Eye,
  '/services': Sparkles,
};

export default function RelatedServices({ 
  services, 
  title = "Explore Our Services",
  subtitle = "Deepen your spiritual journey with these cosmic tools",
  variant = 'default', // 'default', 'compact', 'inline'
  className = '' 
}) {
  if (!services || services.length === 0) return null;

  const IconForService = (route) => {
    const baseRoute = route.split('?')[0];
    const Icon = iconMap[baseRoute] || Sparkles;
    return <Icon className="w-5 h-5" />;
  };

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {services.map((service, index) => (
          <Link
            key={index}
            href={service.route}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-full hover:bg-purple-200 transition-colors"
          >
            {IconForService(service.route)}
            <span>{service.label}</span>
          </Link>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 ${className}`}>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.route}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-purple-700 text-sm rounded-full shadow-sm hover:shadow-md hover:bg-purple-50 transition-all"
            >
              {IconForService(service.route)}
              <span>{service.label}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <section className={`py-8 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.route}
              className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-purple-200"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-white">{IconForService(service.route)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                    {service.label}
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  {service.description && (
                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Blog-specific related services component
export function BlogRelatedServices({ category, tags, maxServices = 3 }) {
  const { getServicesForCategory, getServicesForTag } = require('@/lib/internal-links/service-map');
  
  const services = new Map();
  
  // Add category-based services
  const categoryServices = getServicesForCategory(category);
  categoryServices.forEach(s => services.set(s.route, s));
  
  // Add tag-based services
  if (tags && Array.isArray(tags)) {
    tags.forEach(tag => {
      const tagService = getServicesForTag(tag);
      if (tagService && !services.has(tagService.route)) {
        services.set(tagService.route, tagService);
      }
    });
  }
  
  const serviceList = Array.from(services.values()).slice(0, maxServices);
  
  if (serviceList.length === 0) {
    // Default fallback services
    serviceList.push(
      { route: '/tarot', label: 'Daily Tarot', description: 'Get your daily spiritual guidance' },
      { route: '/birth-chart', label: 'Free Birth Chart', description: 'Discover your cosmic blueprint' }
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        Continue Your Cosmic Journey
      </h3>
      <div className="space-y-3">
        {serviceList.map((service, index) => (
          <Link
            key={index}
            href={service.route}
            className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-all group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              {(() => {
                const Icon = iconMap[service.route] || Sparkles;
                return <Icon className="w-4 h-4 text-white" />;
              })()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                {service.label}
              </p>
              {service.description && (
                <p className="text-sm text-gray-500">{service.description}</p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// Service page related links component
export function ServiceRelatedLinks({ currentPath }) {
  const { getRelatedServices } = require('@/lib/internal-links/service-map');
  const relatedServices = getRelatedServices(currentPath);
  
  if (!relatedServices || relatedServices.length === 0) return null;
  
  return (
    <div className="mt-12 pt-8 border-t border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">Explore More Cosmic Tools</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {relatedServices.map((service, index) => (
          <Link
            key={index}
            href={service.route}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              {(() => {
                const Icon = iconMap[service.route] || Sparkles;
                return <Icon className="w-5 h-5 text-purple-400" />;
              })()}
              <span className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                {service.label}
              </span>
            </div>
            {service.description && (
              <p className="text-sm text-purple-200">{service.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
