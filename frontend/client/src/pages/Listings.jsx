import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { getProducts } from '../services/inventory.service';
import CarCard from '../components/CarCard';

const CONDITIONS = ['', 'new', 'used', 'certified'];
const CATEGORIES = ['', 'sedan', 'suv', 'truck', 'van', 'coupe', 'convertible', 'hatchback'];

const Listings = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', condition: '', category: '', min_price: '', max_price: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const data = await getProducts(params);
      setVehicles(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Our Inventory</h1>
        <p className="text-primary-400">Find your perfect vehicle from our curated collection.</p>
      </div>

      {/* Search + filter bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
          <input
            type="text"
            placeholder="Search by make, model, or name..."
            className="input-field pl-12"
            value={filters.search}
            onChange={(e) => handleFilter('search', e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary px-6">Search</button>
        <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn-outline px-4 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </form>

      {showFilters && (
        <div className="card p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-primary-400 mb-1">Condition</label>
            <select className="input-field" value={filters.condition} onChange={(e) => handleFilter('condition', e.target.value)}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c || 'All'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-primary-400 mb-1">Category</label>
            <select className="input-field" value={filters.category} onChange={(e) => handleFilter('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-primary-400 mb-1">Min Price (GHS)</label>
            <input type="number" className="input-field" placeholder="0" value={filters.min_price} onChange={(e) => handleFilter('min_price', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-primary-400 mb-1">Max Price (GHS)</label>
            <input type="number" className="input-field" placeholder="Any" value={filters.max_price} onChange={(e) => handleFilter('max_price', e.target.value)} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((vehicle) => <CarCard key={vehicle._id} vehicle={vehicle} />)}
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
