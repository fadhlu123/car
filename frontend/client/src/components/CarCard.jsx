import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Gauge, Heart, Users } from 'lucide-react';
import { formatCurrency } from '../utils/format.utils';

const CarCard = ({ vehicle }) => {
  return (
    <div className="card p-4 group bg-primary-900 border border-primary-800 hover:border-accent transition-colors shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg mb-4 bg-primary-950">
        <img
          src={vehicle.images?.[0]?.url || 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-primary-950/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm border border-primary-800">
          {vehicle.condition}
        </div>
        <button className="absolute top-3 right-3 p-2 bg-primary-950/50 backdrop-blur rounded-full text-white hover:text-red-500 transition-colors border border-primary-800">
          <Heart className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-grow flex flex-col">
        <h3 className="font-bold text-xl text-white mb-1">{vehicle.make} {vehicle.model}</h3>
        <p className="text-sm text-primary-400 mb-4">{vehicle.year}</p>

        <div className="flex items-center justify-between text-xs text-primary-300 mb-6 bg-primary-950/50 p-3 rounded-lg border border-primary-800/50">
          <span className="flex flex-col items-center"><Users className="w-4 h-4 mb-1 text-primary-400" /> 5 Seats</span>
          <span className="flex flex-col items-center"><Settings className="w-4 h-4 mb-1 text-primary-400" /> {vehicle.transmission}</span>
          <span className="flex flex-col items-center"><Gauge className="w-4 h-4 mb-1 text-primary-400" /> {vehicle.fuelType}</span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-primary-800 flex justify-between items-center">
          <div className="text-2xl font-bold text-accent">
            {formatCurrency(vehicle.price)}
          </div>
          <Link to={`/listings/${vehicle._id}`} className="bg-primary-800 hover:bg-accent hover:text-primary-950 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
