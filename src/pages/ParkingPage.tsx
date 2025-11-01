import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Car, CheckCircle, AlertCircle, MapPin } from 'lucide-react';

interface ParkingLot {
  id: string;
  zone: string;
  total_spaces: number;
  available_spaces: number;
  last_updated: string;
  university_id: string;
}

export function ParkingPage() {
  const navigate = useNavigate();
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedLot, setRecommendedLot] = useState<ParkingLot | null>(null);

  useEffect(() => {
    fetchParkingData();
    const interval = setInterval(fetchParkingData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchParkingData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .single();

    if (profile) {
      const { data } = await supabase
        .from('parking_lots')
        .select('*')
        .eq('university_id', profile.university_id)
        .order('zone');

      if (data) {
        setParkingLots(data);
        const best = data.reduce((prev, current) => {
          const prevRate = prev.available_spaces / prev.total_spaces;
          const currentRate = current.available_spaces / current.total_spaces;
          return currentRate > prevRate ? current : prev;
        });
        setRecommendedLot(best);
      }
    }
    setLoading(false);
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const rate = (available / total) * 100;
    if (rate > 50) return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 text-green-900';
    if (rate > 25) return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 text-yellow-900';
    if (rate > 0) return 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-400 text-orange-900';
    return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400 text-red-900';
  };

  const getAvailabilityBadge = (available: number, total: number) => {
    const rate = (available / total) * 100;
    if (rate > 50) return { text: 'Plenty Available', color: 'bg-green-500', icon: <CheckCircle size={16} /> };
    if (rate > 25) return { text: 'Moderate', color: 'bg-yellow-500', icon: <AlertCircle size={16} /> };
    if (rate > 0) return { text: 'Limited', color: 'bg-orange-500', icon: <AlertCircle size={16} /> };
    return { text: 'Full', color: 'bg-red-500', icon: <AlertCircle size={16} /> };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Parking Availability</h1>
            <p className="text-blue-100">Find the best parking spots on campus in real-time</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {recommendedLot && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Car size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Recommended Parking</h2>
                  <p className="text-green-100">Best availability right now</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-b-2xl shadow-xl border-x border-b border-slate-200 p-6">
              <div className={`border-3 rounded-2xl p-6 ${getAvailabilityColor(recommendedLot.available_spaces, recommendedLot.total_spaces)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <MapPin size={28} className="opacity-70" />
                    <h3 className="text-2xl font-bold">{recommendedLot.zone}</h3>
                  </div>
                  <div className="px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 rounded-full text-xs font-bold inline-flex items-center space-x-1">
                    <span>⭐</span>
                    <span>BEST CHOICE</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="text-sm font-medium opacity-75 mb-1">Available Spaces</div>
                    <div className="text-4xl font-bold">{recommendedLot.available_spaces}</div>
                  </div>
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="text-sm font-medium opacity-75 mb-1">Total Capacity</div>
                    <div className="text-4xl font-bold">{recommendedLot.total_spaces}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <span className="font-semibold">Occupancy Rate</span>
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-32 bg-white/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${((recommendedLot.total_spaces - recommendedLot.available_spaces) / recommendedLot.total_spaces) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xl font-bold">
                      {Math.round(((recommendedLot.total_spaces - recommendedLot.available_spaces) / recommendedLot.total_spaces) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>All Parking Zones</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parkingLots.map((lot) => {
              const badge = getAvailabilityBadge(lot.available_spaces, lot.total_spaces);
              const occupancyRate = ((lot.total_spaces - lot.available_spaces) / lot.total_spaces) * 100;

              return (
                <div
                  key={lot.id}
                  className={`border-2 rounded-2xl p-5 transition-all hover:shadow-lg ${getAvailabilityColor(lot.available_spaces, lot.total_spaces)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin size={20} className="opacity-70" />
                      <h3 className="text-lg font-bold">{lot.zone}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} text-white flex items-center space-x-1`}>
                      {badge.icon}
                      <span>{badge.text}</span>
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Available</span>
                      <span className="text-3xl font-bold">{lot.available_spaces}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium opacity-75">Total Spaces</span>
                      <span className="font-bold">{lot.total_spaces}</span>
                    </div>

                    <div className="pt-3 border-t border-current/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium">Occupancy</span>
                        <span className="text-lg font-bold">{Math.round(occupancyRate)}%</span>
                      </div>
                      <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${badge.color} transition-all duration-500`}
                          style={{ width: `${occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs opacity-70 text-center pt-3 border-t border-current/20">
                    Updated: {new Date(lot.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">Parking Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <span>Green zones have over 50% availability - best choice for guaranteed parking</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <span>Check the recommended zone for the best availability in real-time</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <span>Arrive early during peak hours for better parking options</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
              <span>Data updates every 15 seconds for accurate availability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
