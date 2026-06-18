import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingCart, Gauge, Settings, Palette, Calendar, Tag, Check } from 'lucide-react';
import { getProductById } from '../services/inventory.service';
import { useCart } from '../context/CartContext';
import { formatCurrency, formatMileage } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getProductById(id)
      .then(setVehicle)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  // API returns `id`, not `_id`
  const inCart = vehicle && cartItems.some((i) => i.productId === vehicle.id);
  const images = vehicle?.images || [];

  const handleAddToCart = () => {
    if (!vehicle) return;
    addToCart(vehicle);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 text-primary-400">
        <p className="text-red-400 mb-4">{error || 'Vehicle not found.'}</p>
        <button onClick={() => navigate('/listings')} className="btn-outline">Back to Listings</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-400 hover:text-white mb-6 text-sm">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image gallery */}
        <div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-primary-900 mb-4">
            <img
              src={images[imgIdx]?.url || vehicle.thumbnail || 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-primary-950/70 rounded-full text-white hover:bg-primary-950"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary-950/70 rounded-full text-white hover:bg-primary-950"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            <div className="absolute top-3 left-3 bg-primary-950/80 px-3 py-1 rounded-full text-xs font-bold text-white capitalize">
              {vehicle.condition}
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-accent' : 'border-primary-800'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-xs font-medium text-accent uppercase tracking-wide">{vehicle.category}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{vehicle.make} {vehicle.model}</h1>
          <p className="text-primary-400 mb-4">{vehicle.name}</p>

          <div className="text-4xl font-bold text-accent mb-6">
            {formatCurrency(vehicle.price, vehicle.currency)}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-primary-900 rounded-xl p-3 flex items-center gap-3 border border-primary-800">
              <Calendar className="h-5 w-5 text-primary-400 flex-shrink-0" />
              <div><p className="text-xs text-primary-500">Year</p><p className="text-sm font-medium text-white">{vehicle.year}</p></div>
            </div>
            <div className="bg-primary-900 rounded-xl p-3 flex items-center gap-3 border border-primary-800">
              <Gauge className="h-5 w-5 text-primary-400 flex-shrink-0" />
              <div><p className="text-xs text-primary-500">Mileage</p><p className="text-sm font-medium text-white">{formatMileage(vehicle.mileage)}</p></div>
            </div>
            <div className="bg-primary-900 rounded-xl p-3 flex items-center gap-3 border border-primary-800">
              <Settings className="h-5 w-5 text-primary-400 flex-shrink-0" />
              <div><p className="text-xs text-primary-500">Condition</p><p className="text-sm font-medium text-white capitalize">{vehicle.condition}</p></div>
            </div>
            <div className="bg-primary-900 rounded-xl p-3 flex items-center gap-3 border border-primary-800">
              <Palette className="h-5 w-5 text-primary-400 flex-shrink-0" />
              <div><p className="text-xs text-primary-500">Colour</p><p className="text-sm font-medium text-white capitalize">{vehicle.colour || '—'}</p></div>
            </div>
          </div>

          {vehicle.description && (
            <p className="text-primary-300 text-sm mb-6 leading-relaxed">{vehicle.description}</p>
          )}

          {vehicle.features?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-primary-300 mb-2">Features</h3>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((f) => (
                  <span key={f} className="flex items-center gap-1 bg-primary-800/60 text-primary-200 text-xs px-3 py-1 rounded-full border border-primary-700">
                    <Tag className="h-3 w-3" /> {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-3">
            {vehicle.availability === 'available' ? (
              <button
                onClick={handleAddToCart}
                disabled={inCart || added}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {added ? (
                  <><Check className="h-5 w-5" /> Added to Cart</>
                ) : inCart ? (
                  'Already in Cart'
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
                )}
              </button>
            ) : (
              <div className="bg-primary-800/40 border border-primary-700 rounded-xl px-4 py-3 text-center text-primary-400 text-sm capitalize">
                {vehicle.availability === 'sold' ? 'This vehicle has been sold' : 'Currently unavailable'}
              </div>
            )}
            <button onClick={() => navigate('/cart')} className="btn-outline w-full">View Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetail;
