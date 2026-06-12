import React, { useState, useEffect } from 'react';
import api from '../api';
import CarCard from '../components/CarCard';

const Listings = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Browse Our Inventory</h1>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((vehicle) => (
            <CarCard key={vehicle._id} vehicle={vehicle} />
          ))}
          {vehicles.length === 0 && (
            <div className="col-span-full text-center py-20 text-primary-400">
              No vehicles found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Listings;
