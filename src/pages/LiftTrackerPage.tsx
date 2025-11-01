import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Search, ArrowUpDown, Users, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Lift {
  id: string;
  building: string;
  lift_id: string;
  current_floor: number;
  direction: string;
  queue_count: number;
  current_occupancy: number;
  capacity: number;
  estimated_wait_time: number;
}

interface Classroom {
  building: string;
  floor: number;
  room_number: string;
}

export function LiftTrackerPage() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [currentFloor, setCurrentFloor] = useState(1);
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Classroom[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Classroom | null>(null);
  const [recommendedLifts, setRecommendedLifts] = useState<(Lift & { score: number; reasoning: string })[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (destination.trim()) {
      const filtered = classrooms.filter(
        (room) =>
          room.room_number.toLowerCase().includes(destination.toLowerCase()) ||
          room.building.toLowerCase().includes(destination.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [destination, classrooms]);

  const fetchData = async () => {
    const [liftsData, classroomsData] = await Promise.all([
      supabase.from('lifts').select('*').order('building', { ascending: true }),
      supabase.from('classrooms').select('building, floor, room_number').order('building', { ascending: true }),
    ]);

    if (liftsData.data) setLifts(liftsData.data);
    if (classroomsData.data) setClassrooms(classroomsData.data);
    setLoading(false);
  };

  const calculateLiftScore = (lift: Lift, targetFloor: number, targetBuilding: string, currentFloor: number) => {
    if (lift.building !== targetBuilding) {
      return { score: 0, reasoning: 'Different building' };
    }

    let score = 100;
    let reasoning = [];

    const floorDistance = Math.abs(lift.current_floor - currentFloor);
    score -= floorDistance * 5;
    reasoning.push(`${floorDistance} floors away`);

    const occupancyRate = (lift.current_occupancy / lift.capacity) * 100;
    if (occupancyRate > 80) {
      score -= 30;
      reasoning.push('Nearly full');
    } else if (occupancyRate > 50) {
      score -= 15;
      reasoning.push('Moderately occupied');
    } else {
      reasoning.push('Good space available');
    }

    if (lift.queue_count > 5) {
      score -= lift.queue_count * 3;
      reasoning.push(`${lift.queue_count} people waiting`);
    } else if (lift.queue_count > 0) {
      score -= lift.queue_count * 2;
      reasoning.push(`${lift.queue_count} in queue`);
    } else {
      reasoning.push('No queue');
    }

    const isGoingTowardsYou =
      (lift.direction === 'up' && lift.current_floor < currentFloor) ||
      (lift.direction === 'down' && lift.current_floor > currentFloor);

    const isGoingYourDirection =
      (lift.direction === 'up' && targetFloor > currentFloor) ||
      (lift.direction === 'down' && targetFloor < currentFloor);

    if (lift.direction === 'idle') {
      score += 15;
      reasoning.push('Idle and ready');
    } else if (isGoingTowardsYou && isGoingYourDirection) {
      score += 20;
      reasoning.push('Coming your way');
    } else if (!isGoingYourDirection) {
      score -= 10;
      reasoning.push('Wrong direction');
    }

    return { score: Math.max(0, score), reasoning: reasoning.join(', ') };
  };

  const handleSelectDestination = (room: Classroom) => {
    setSelectedDestination(room);
    setDestination(room.room_number);
    setSearchResults([]);

    const liftsInBuilding = lifts.filter((lift) => lift.building === room.building);
    const scoredLifts = liftsInBuilding.map((lift) => {
      const { score, reasoning } = calculateLiftScore(lift, room.floor, room.building, currentFloor);
      return { ...lift, score, reasoning };
    });

    scoredLifts.sort((a, b) => b.score - a.score);
    setRecommendedLifts(scoredLifts);
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === 'up') return <TrendingUp className="text-green-600" size={20} />;
    if (direction === 'down') return <TrendingDown className="text-blue-600" size={20} />;
    return <Minus className="text-slate-400" size={20} />;
  };

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const rate = (occupancy / capacity) * 100;
    if (rate > 80) return 'text-red-600';
    if (rate > 50) return 'text-orange-600';
    return 'text-green-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-500 text-green-800';
    if (score >= 60) return 'bg-blue-100 border-blue-500 text-blue-800';
    if (score >= 40) return 'bg-orange-100 border-orange-500 text-orange-800';
    return 'bg-red-100 border-red-500 text-red-800';
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
      <div className="bg-gradient-to-r from-teal-600 to-green-600 p-6 text-white shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold">Smart Lift Tracker</h1>
            <p className="text-teal-100 text-sm">Find the best lift to reach your destination</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={20} />
              <input
                type="text"
                placeholder="Enter destination (e.g., C721, Library)..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:bg-white/30"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto z-10">
                  {searchResults.map((room, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectDestination(room)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="font-medium text-slate-800">{room.room_number}</div>
                      <div className="text-sm text-slate-600">
                        {room.building} - Floor {room.floor}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Your Current Floor</label>
              <input
                type="number"
                min="1"
                max="20"
                value={currentFloor}
                onChange={(e) => setCurrentFloor(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:bg-white/30"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {recommendedLifts.length > 0 && selectedDestination && (
          <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Best Lifts to {selectedDestination.room_number}
            </h2>
            <p className="text-slate-600 mb-4">
              Going to Floor {selectedDestination.floor} in {selectedDestination.building}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedLifts.map((lift, index) => (
                <div
                  key={lift.id}
                  className={`border-2 rounded-xl p-4 ${getScoreColor(lift.score)} ${
                    index === 0 ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''
                  }`}
                >
                  {index === 0 && (
                    <div className="mb-2 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold inline-block">
                      BEST CHOICE
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold">{lift.lift_id}</h3>
                    {getDirectionIcon(lift.direction)}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span>Current Floor:</span>
                      <span className="font-bold">Floor {lift.current_floor}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Occupancy:</span>
                      <span className={`font-bold ${getOccupancyColor(lift.current_occupancy, lift.capacity)}`}>
                        {lift.current_occupancy}/{lift.capacity} people
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Queue:</span>
                      <span className="font-bold">
                        {lift.queue_count === 0 ? 'None' : `${lift.queue_count} waiting`}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Est. Wait:</span>
                      <span className="font-bold">{lift.estimated_wait_time}s</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-current/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Recommendation Score</span>
                      <span className="text-2xl font-bold">{lift.score}</span>
                    </div>
                    <p className="text-xs opacity-75">{lift.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">All Lifts - Live Status</h2>

          <div className="space-y-4">
            {Object.entries(
              lifts.reduce((acc, lift) => {
                if (!acc[lift.building]) acc[lift.building] = [];
                acc[lift.building].push(lift);
                return acc;
              }, {} as Record<string, Lift[]>)
            ).map(([building, buildingLifts]) => (
              <div key={building} className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-slate-800 mb-3">{building}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {buildingLifts.map((lift) => (
                    <div key={lift.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800">{lift.lift_id}</h4>
                        {getDirectionIcon(lift.direction)}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Floor</span>
                          <span className="font-medium">{lift.current_floor}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <Users size={14} />
                            <span>Inside</span>
                          </span>
                          <span className={`font-medium ${getOccupancyColor(lift.current_occupancy, lift.capacity)}`}>
                            {lift.current_occupancy}/{lift.capacity}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Queue</span>
                          <span className="font-medium">{lift.queue_count}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <Clock size={14} />
                            <span>Wait</span>
                          </span>
                          <span className="font-medium">{lift.estimated_wait_time}s</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">How the Recommendation Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Prioritizes lifts in the same building as your destination</li>
            <li>• Considers current floor distance from your location</li>
            <li>• Accounts for lift occupancy and queue length</li>
            <li>• Factors in lift direction and movement patterns</li>
            <li>• Updates every 10 seconds with live data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
