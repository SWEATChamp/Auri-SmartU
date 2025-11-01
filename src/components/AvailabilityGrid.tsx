import { Car, BookOpen, Utensils, TrendingUp, TrendingDown } from 'lucide-react';
import type { ParkingLot, LibrarySeat, FoodStall } from '../types';

interface AvailabilityGridProps {
  parkingData: ParkingLot[];
  libraryData: LibrarySeat[];
  foodData: FoodStall[];
}

export function AvailabilityGrid({ parkingData, libraryData, foodData }: AvailabilityGridProps) {
  const totalParkingAvailable = parkingData.reduce((sum, lot) => sum + lot.available_spaces, 0);
  const totalParkingSpaces = parkingData.reduce((sum, lot) => sum + lot.total_spaces, 0);
  const parkingPercentage = totalParkingSpaces > 0 ? (totalParkingAvailable / totalParkingSpaces) * 100 : 0;

  const totalLibrarySeats = libraryData.reduce((sum, area) => sum + area.available_seats, 0);
  const totalLibraryCapacity = libraryData.reduce((sum, area) => sum + area.total_seats, 0);
  const libraryPercentage = totalLibraryCapacity > 0 ? (totalLibrarySeats / totalLibraryCapacity) * 100 : 0;

  const totalFoodSeats = foodData.reduce((sum, stall) => sum + stall.available_seats, 0);
  const avgQueueLength = foodData.length > 0 ? Math.round(foodData.reduce((sum, stall) => sum + stall.queue_length, 0) / foodData.length) : 0;

  const getAvailabilityColor = (percentage: number) => {
    if (percentage > 50) return 'from-green-500 to-emerald-500';
    if (percentage > 20) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getAvailabilityText = (percentage: number) => {
    if (percentage > 50) return 'Good';
    if (percentage > 20) return 'Limited';
    return 'Low';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Car className="text-blue-600" size={24} />
          </div>
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getAvailabilityColor(parkingPercentage)} text-white text-xs font-bold`}>
            {getAvailabilityText(parkingPercentage)}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2">Parking Availability</h3>
        <div className="text-4xl font-bold text-slate-800 mb-2">{totalParkingAvailable}</div>
        <div className="text-sm text-slate-600 mb-3">spaces available</div>

        <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${getAvailabilityColor(parkingPercentage)} transition-all`}
            style={{ width: `${parkingPercentage}%` }}
          ></div>
        </div>

        <div className="space-y-1 text-sm">
          {parkingData.slice(0, 3).map((lot) => (
            <div key={lot.id} className="flex justify-between text-slate-600">
              <span>{lot.zone}</span>
              <span className="font-medium">{lot.available_spaces}/{lot.total_spaces}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-teal-100 p-3 rounded-lg">
            <BookOpen className="text-teal-600" size={24} />
          </div>
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getAvailabilityColor(libraryPercentage)} text-white text-xs font-bold`}>
            {getAvailabilityText(libraryPercentage)}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2">Library Seats</h3>
        <div className="text-4xl font-bold text-slate-800 mb-2">{totalLibrarySeats}</div>
        <div className="text-sm text-slate-600 mb-3">seats available</div>

        <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${getAvailabilityColor(libraryPercentage)} transition-all`}
            style={{ width: `${libraryPercentage}%` }}
          ></div>
        </div>

        <div className="space-y-1 text-sm">
          {libraryData.slice(0, 3).map((area) => (
            <div key={area.id} className="flex justify-between text-slate-600">
              <span>Floor {area.floor} - {area.zone}</span>
              <span className="font-medium">{area.available_seats}/{area.total_seats}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Utensils className="text-orange-600" size={24} />
          </div>
          <div className={`px-3 py-1 rounded-full ${
            avgQueueLength < 10 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'
          } text-white text-xs font-bold`}>
            {avgQueueLength < 10 ? 'Fast' : 'Busy'}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2">Food Stalls</h3>
        <div className="text-4xl font-bold text-slate-800 mb-2">{totalFoodSeats}</div>
        <div className="text-sm text-slate-600 mb-3">seats available</div>

        <div className="mb-3 flex items-center space-x-2 text-sm">
          <span className="text-slate-600">Avg Queue:</span>
          <span className="font-bold text-slate-800">{avgQueueLength} people</span>
          {avgQueueLength < 10 ? (
            <TrendingDown className="text-green-600" size={16} />
          ) : (
            <TrendingUp className="text-red-600" size={16} />
          )}
        </div>

        <div className="space-y-1 text-sm">
          {foodData.slice(0, 3).map((stall) => (
            <div key={stall.id} className="flex justify-between text-slate-600">
              <span className="truncate mr-2">{stall.name}</span>
              <span className="font-medium whitespace-nowrap">Queue: {stall.queue_length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
