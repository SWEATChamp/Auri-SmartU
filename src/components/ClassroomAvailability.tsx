import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, X, MapPin, Users, Wifi, Monitor, Wind, Beaker } from 'lucide-react';
import type { Classroom } from '../types';

interface ClassroomAvailabilityProps {
  onClose: () => void;
}

export function ClassroomAvailability({ onClose }: ClassroomAvailabilityProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [filteredClassrooms, setFilteredClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);

  useEffect(() => {
    fetchClassrooms();
    const interval = setInterval(fetchClassrooms, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterClassroomData();
  }, [classrooms, searchTerm, filterBuilding, showAvailableOnly]);

  const fetchClassrooms = async () => {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .order('building', { ascending: true })
      .order('room_number', { ascending: true });

    if (data) {
      setClassrooms(data);
    }
    setLoading(false);
  };

  const filterClassroomData = () => {
    let filtered = [...classrooms];

    if (showAvailableOnly) {
      filtered = filtered.filter((room) => room.is_available);
    }

    if (filterBuilding !== 'all') {
      filtered = filtered.filter((room) => room.building === filterBuilding);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (room) =>
          room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.building.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClassrooms(filtered);
  };

  const buildings = Array.from(new Set(classrooms.map((room) => room.building)));

  const getFacilityIcon = (facility: string) => {
    const lower = facility.toLowerCase();
    if (lower.includes('projector') || lower.includes('monitor')) return <Monitor size={16} />;
    if (lower.includes('air') || lower.includes('conditioning')) return <Wind size={16} />;
    if (lower.includes('lab') || lower.includes('equipment')) return <Beaker size={16} />;
    if (lower.includes('wifi')) return <Wifi size={16} />;
    return null;
  };

  const getAvailabilityColor = (isAvailable: boolean) => {
    return isAvailable
      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
      : 'bg-gradient-to-r from-red-500 to-rose-500';
  };

  const formatAvailableUntil = (dateString: string | null) => {
    if (!dateString) return 'All day';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Classroom Availability</h2>
              <p className="text-blue-100 text-sm">Find empty classrooms and lecture halls</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={20} />
              <input
                type="text"
                placeholder="Search room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:bg-white/30"
              />
            </div>

            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:bg-white/30"
            >
              <option value="all">All Buildings</option>
              {buildings.map((building) => (
                <option key={building} value={building} className="text-slate-800">
                  {building}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-3 px-4 py-2 bg-white/20 border border-white/30 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
              <span className="font-medium">Available Only</span>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredClassrooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-2">
                <MapPin size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No classrooms found</h3>
              <p className="text-slate-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClassrooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <MapPin className="text-blue-600" size={18} />
                        <h3 className="font-bold text-slate-800">{room.room_number}</h3>
                      </div>
                      <p className="text-sm text-slate-600">{room.building}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getAvailabilityColor(
                        room.is_available
                      )}`}
                    >
                      {room.is_available ? 'Available' : 'Occupied'}
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Users size={16} />
                        <span>Capacity</span>
                      </div>
                      <span className="font-medium text-slate-800">{room.capacity} seats</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Floor</span>
                      <span className="font-medium text-slate-800">{room.floor}</span>
                    </div>

                    {!room.is_available && room.available_until && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Free at</span>
                        <span className="font-medium text-orange-600">
                          {formatAvailableUntil(room.available_until)}
                        </span>
                      </div>
                    )}
                  </div>

                  {room.facilities && Array.isArray(room.facilities) && room.facilities.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">Facilities</p>
                      <div className="flex flex-wrap gap-2">
                        {room.facilities.map((facility, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1 px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-700"
                          >
                            {getFacilityIcon(facility)}
                            <span>{facility}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              Showing {filteredClassrooms.length} of {classrooms.length} classrooms
            </span>
            <span className="text-xs">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
