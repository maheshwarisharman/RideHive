/**
 * Application environment configuration
 */

export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  campus: {
    name: process.env.EXPO_PUBLIC_CAMPUS_NAME || 'BML Munjal University Main Gate',
    latitude: parseFloat(process.env.EXPO_PUBLIC_CAMPUS_ORIGIN_LAT || '28.24765'),
    longitude: parseFloat(process.env.EXPO_PUBLIC_CAMPUS_ORIGIN_LNG || '76.81395'),
  },
  timeZone: 'Asia/Kolkata',
  allowedEmailDomain: '@bmu.edu.in',
  fare: {
    baseFarePaise: 5000, // ₹50.00 base fare
    perKmPaise: 1400, // ₹14.00 per km
  },
  matching: {
    defaultOriginRadiusM: 1500,
    defaultDestinationRadiusM: 1500,
    defaultRouteCorridorRadiusM: 1000,
    maxTimeWindowMinutes: 60,
  },
};
