import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, UtensilsCrossed, CheckCircle, AlertCircle, Users, MapPin } from 'lucide-react';

interface FoodStall {
  id: string;
  name: string;
  location: string;
  total_seats: number;
  available_seats: number;
  queue_length: number;
  last_updated: string;
  university_id: string;
}

export function CanteenSeatsPage() {
  const navigate = useNavigate();
  const [foodStalls, setFoodStalls] = useState<FoodStall[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedStall, setRecommendedStall] = useState<FoodStall | null>(null);

  useEffect(() => {
    fetchCanteenData();
    const interval = setInterval(fetchCanteenData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchCanteenData = async () => {
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
        .from('food_stalls')
        .select('*')
        .eq('university_id', profile.university_id)
        .order('name');

      if (data) {
        setFoodStalls(data);
        const best = data.reduce((prev, current) => {
          const prevScore = (prev.available_seats / prev.total_seats) * 100 - prev.queue_length * 5;
          const currentScore = (current.available_seats / current.total_seats) * 100 - current.queue_length * 5;
          return currentScore > prevScore ? current : prev;
        });
        setRecommendedStall(best);
      }
    }
    setLoading(false);
  };

  const getAvailabilityColor = (available: number, total: number, queueLength: number) => {
    const rate = (available / total) * 100;
    if (rate > 50 && queueLength < 3) return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 text-green-900';
    if (rate > 25 && queueLength < 5) return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 text-yellow-900';
    if (rate > 0) return 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-400 text-orange-900';
    return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400 text-red-900';
  };

  const getAvailabilityBadge = (available: number, total: number, queueLength: number) => {
    const rate = (available / total) * 100;
    if (rate > 50 && queueLength < 3) return { text: 'Great Choice', color: 'bg-green-500', icon: <CheckCircle size={16} /> };
    if (rate > 25 && queueLength < 5) return { text: 'Good', color: 'bg-yellow-500', icon: <AlertCircle size={16} /> };
    if (rate > 0) return { text: 'Busy', color: 'bg-orange-500', icon: <AlertCircle size={16} /> };
    return { text: 'Very Busy', color: 'bg-red-500', icon: <AlertCircle size={16} /> };
  };

  const getQueueColor = (queueLength: number) => {
    if (queueLength === 0) return 'text-green-600';
    if (queueLength < 3) return 'text-yellow-600';
    if (queueLength < 5) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Canteen & Food Courts</h1>
            <p className="text-rose-100">Find the best spots to dine with available seats</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {recommendedStall && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <UtensilsCrossed size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Recommended Dining Spot</h2>
                  <p className="text-green-100">Best availability and shortest queue</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-b-2xl shadow-xl border-x border-b border-slate-200 p-6">
              <div className={`border-3 rounded-2xl p-6 ${getAvailabilityColor(recommendedStall.available_seats, recommendedStall.total_seats, recommendedStall.queue_length)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{recommendedStall.name}</h3>
                    <p className="text-sm opacity-75 flex items-center space-x-1">
                      <MapPin size={14} />
                      <span>{recommendedStall.location}</span>
                    </p>
                  </div>
                  <div className="px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 rounded-full text-xs font-bold inline-flex items-center space-x-1">
                    <span>⭐</span>
                    <span>BEST CHOICE</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="text-sm font-medium opacity-75 mb-1">Available</div>
                    <div className="text-3xl font-bold">{recommendedStall.available_seats}</div>
                  </div>
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="text-sm font-medium opacity-75 mb-1">Total Seats</div>
                    <div className="text-3xl font-bold">{recommendedStall.total_seats}</div>
                  </div>
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="text-sm font-medium opacity-75 mb-1">Queue</div>
                    <div className={`text-3xl font-bold ${getQueueColor(recommendedStall.queue_length)}`}>
                      {recommendedStall.queue_length === 0 ? 'None' : recommendedStall.queue_length}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <span className="font-semibold">Occupancy Rate</span>
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-32 bg-white/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${((recommendedStall.total_seats - recommendedStall.available_seats) / recommendedStall.total_seats) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xl font-bold">
                      {Math.round(((recommendedStall.total_seats - recommendedStall.available_seats) / recommendedStall.total_seats) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
            <span>All Dining Locations</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foodStalls.map((stall) => {
              const badge = getAvailabilityBadge(stall.available_seats, stall.total_seats, stall.queue_length);
              const occupancyRate = ((stall.total_seats - stall.available_seats) / stall.total_seats) * 100;

              return (
                <div
                  key={stall.id}
                  className={`border-2 rounded-2xl p-5 transition-all hover:shadow-lg ${getAvailabilityColor(stall.available_seats, stall.total_seats, stall.queue_length)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <UtensilsCrossed size={20} className="opacity-70" />
                      <h3 className="text-lg font-bold">{stall.name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} text-white flex items-center space-x-1`}>
                      {badge.icon}
                      <span>{badge.text}</span>
                    </span>
                  </div>

                  <p className="text-sm opacity-75 mb-4 flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{stall.location}</span>
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Available Seats</span>
                      <span className="text-2xl font-bold">{stall.available_seats}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium opacity-75">Total Capacity</span>
                      <span className="font-bold">{stall.total_seats}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium opacity-75 flex items-center space-x-1">
                        <Users size={14} />
                        <span>Queue Length</span>
                      </span>
                      <span className={`font-bold text-lg ${getQueueColor(stall.queue_length)}`}>
                        {stall.queue_length === 0 ? 'No Queue' : `${stall.queue_length} waiting`}
                      </span>
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
                    Updated: {new Date(stall.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl">
          <h3 className="font-bold text-rose-900 mb-3 text-lg">Dining Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-rose-800">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <span>Green zones have plenty of seats and minimal queues</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <span>Avoid peak lunch hours (12-1 PM) for shorter wait times</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <span>Check the recommended spot for the best overall experience</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
              <span>Real-time updates every 15 seconds for accurate data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
