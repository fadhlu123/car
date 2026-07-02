import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Calendar, Car as CarIcon, HeadphonesIcon, ArrowRight, Heart, Users, Settings, Gauge, CheckCircle2, Gift, Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getProducts } from '../services/inventory.service';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const [featuredCars, setFeaturedCars] = useState([]);
  const heroRef = useRef(null);
  const heroImgRef = useRef(null);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const data = await getProducts();
        setFeaturedCars(data.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch featured cars:', error);
      }
    };
    fetchCars();
  }, []);

  // Hero reveal + scroll-linked parallax, driven by GSAP and kept in sync with
  // Lenis's virtual scroll position (see useLenis.js) rather than native scroll
  // events, so the effect can't desync from what the user actually sees.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroImgRef.current,
        { scale: 1.15, opacity: 0 },
        { scale: 1, opacity: 0.6, duration: 1.8, ease: 'power3.out' }
      );
      // Logged-in users scroll inside AppLayout's own pane (#app-scroll-container),
      // not the window — point ScrollTrigger at whichever is actually scrolling.
      const scroller = document.getElementById('app-scroll-container') || window;

      gsap.to(heroImgRef.current, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          scroller,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full bg-primary-950 text-white font-sans">
      {/* Hero Section */}
      <div ref={heroRef} className="relative isolate pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden bg-primary-950">
        {/* GSAP-driven reveal + scroll parallax */}
        <div className="absolute inset-0 z-0">
          <img
            ref={heroImgRef}
            src="https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="absolute top-0 right-0 w-full lg:w-3/4 h-full object-cover mix-blend-screen origin-right"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)' }}
          />
        </div>

        {/* Moving Light Sweep Reflection */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="w-[150%] h-[200%] bg-linear-to-r from-transparent via-white/10 to-transparent -translate-y-1/4 animate-light-sweep mix-blend-overlay"></div>
        </div>

        {/* Ambient Fog / Smoke */}
        <div className="absolute bottom-0 right-0 w-full lg:w-1/2 h-2/3 bg-gradient-radial from-primary-400/10 via-transparent to-transparent opacity-50 blur-3xl animate-smoke pointer-events-none"></div>
        <div className="absolute top-1/4 right-1/4 w-full lg:w-1/2 h-1/2 bg-gradient-radial from-accent/5 via-transparent to-transparent opacity-30 blur-2xl animate-smoke pointer-events-none" style={{ animationDelay: '2s' }}></div>

        {/* Particles */}
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-accent/40 blur-[1px] animate-particle-float"></div>
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-white/20 blur-[2px] animate-particle-float" style={{ animationDelay: '1.5s', animationDuration: '5s' }}></div>
        <div className="absolute top-1/3 right-1/2 w-1.5 h-1.5 rounded-full bg-accent/60 blur-[1px] animate-particle-float" style={{ animationDelay: '3s' }}></div>

        {/* Overlays */}
        <div className="absolute inset-0 z-0 bg-linear-to-r from-primary-950 via-primary-950/90 to-transparent"></div>
        <div className="absolute inset-0 z-0 bg-linear-to-t from-primary-950 via-transparent to-transparent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter leading-none"
            >
              PREMIUM CARS.<br/>
              <span className="text-accent">GREAT CHOICES.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-lg text-primary-300 mb-10"
            >
              Premium cars. Flexible buying options.<br/>
              Your journey, your way.
            </motion.p>
            
            {/* Search Box */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8, type: 'spring', stiffness: 100 }}
              className="glass p-6 rounded-2xl shadow-2xl max-w-sm mb-12"
            >
              <h3 className="font-medium text-lg mb-6 text-white">Find Your Perfect Car</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-primary-400 mb-1">Make</label>
                  <select className="w-full bg-primary-900 border border-primary-800 rounded-lg px-4 py-3 outline-none focus:border-accent text-sm text-white">
                    <option>Any Make</option>
                    <option>Tesla</option>
                    <option>BMW</option>
                    <option>Mercedes-Benz</option>
                    <option>Audi</option>
                  </select>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs text-primary-400 mb-1">Condition</label>
                    <select className="w-full bg-primary-900 border border-primary-800 rounded-lg px-4 py-3 outline-none focus:border-accent text-sm text-white">
                      <option>Any</option>
                      <option>New</option>
                      <option>Used</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-primary-400 mb-1">Max Price</label>
                    <select className="w-full bg-primary-900 border border-primary-800 rounded-lg px-4 py-3 outline-none focus:border-accent text-sm text-white">
                      <option>No Max</option>
                      <option>$50,000</option>
                      <option>$100,000</option>
                    </select>
                  </div>
                </div>
                <Link to="/listings" className="w-full btn-primary py-4 mt-2 flex justify-center items-center rounded-xl text-lg font-bold group relative overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Search Cars <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 shadow-[0_0_20px_rgba(220,38,38,0)] group-hover:shadow-[0_0_25px_rgba(220,38,38,0.8)] transition-shadow duration-300 rounded-xl"></div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 border border-primary-800 bg-primary-900/50 rounded-2xl hover:border-accent transition-colors">
            <ShieldCheck className="w-8 h-8 text-accent mb-4" />
            <h4 className="font-bold text-white mb-2">Best Price Guarantee</h4>
            <p className="text-sm text-primary-400">Get the best rates every time.</p>
          </div>
          <div className="p-6 border border-primary-800 bg-primary-900/50 rounded-2xl hover:border-accent transition-colors">
            <Calendar className="w-8 h-8 text-accent mb-4" />
            <h4 className="font-bold text-white mb-2">Flexible Bookings</h4>
            <p className="text-sm text-primary-400">Modify or cancel anytime.</p>
          </div>
          <div className="p-6 border border-primary-800 bg-primary-900/50 rounded-2xl hover:border-accent transition-colors">
            <CarIcon className="w-8 h-8 text-accent mb-4" />
            <h4 className="font-bold text-white mb-2">Wide Range of Cars</h4>
            <p className="text-sm text-primary-400">From economy to luxury vehicles.</p>
          </div>
          <div className="p-6 border border-primary-800 bg-primary-900/50 rounded-2xl hover:border-accent transition-colors">
            <HeadphonesIcon className="w-8 h-8 text-accent mb-4" />
            <h4 className="font-bold text-white mb-2">24/7 Customer Support</h4>
            <p className="text-sm text-primary-400">We're here to help you anytime.</p>
          </div>
        </div>
      </motion.div>

      {/* Popular Choices */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      >
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-accent text-sm font-bold uppercase tracking-wider mb-2">Explore</p>
            <h2 className="text-3xl font-bold text-white">Popular Choices</h2>
          </div>
          <Link to="/listings" className="flex items-center text-sm font-medium text-white hover:text-accent transition-colors group">
            View all cars <div className="ml-2 bg-accent rounded-full p-1 text-primary-950 group-hover:translate-x-1 transition-transform"><ArrowRight className="w-4 h-4"/></div>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCars.map((car, index) => (
            <motion.div 
              key={car._id} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10, rotateX: 2, rotateY: -2, zIndex: 10 }}
              style={{ perspective: 1000 }}
              className="card p-4 group bg-primary-900 border-primary-800 hover:border-accent transition-colors hover:shadow-[0_20px_40px_rgba(220,38,38,0.15)]"
            >
              <div className="relative aspect-16/10 overflow-hidden rounded-lg mb-4 bg-primary-950">
                <motion.img 
                  whileHover={{ scale: 1.15 }}
                  transition={{ duration: 0.6 }}
                  src={car.images?.[0] || 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80'} 
                  alt={car.model} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <button className="absolute top-3 right-3 p-2 bg-primary-950/50 backdrop-blur rounded-full text-white hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-lg text-white mb-1">{car.brand} {car.model}</h3>
              <p className="text-xs text-primary-400 mb-4">{car.condition}</p>
              
              <div className="flex items-center justify-between text-xs text-primary-300 mb-4">
                <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> 5 Seats</span>
                <span className="flex items-center"><Settings className="w-3 h-3 mr-1" /> {car.transmission}</span>
                <span className="flex items-center"><Gauge className="w-3 h-3 mr-1" /> {car.fuelType}</span>
              </div>
              
              <div className="pt-4 border-t border-primary-800 flex justify-between items-center">
                <div className="text-xl font-bold text-accent">${car.price.toLocaleString()}</div>
                <Link to={`/listings/${car._id}`} className="text-sm font-medium hover:text-accent">Details</Link>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Why Choose Us */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-accent text-sm font-bold uppercase tracking-wider mb-2">Why Choose AUTO MAJID?</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
              We make it simple<br/>to hit the road.
            </h2>
            <ul className="space-y-4">
              <li className="flex items-center text-primary-200">
                <CheckCircle2 className="w-5 h-5 text-accent mr-3" /> No hidden fees
              </li>
              <li className="flex items-center text-primary-200">
                <CheckCircle2 className="w-5 h-5 text-accent mr-3" /> Easy booking process
              </li>
              <li className="flex items-center text-primary-200">
                <CheckCircle2 className="w-5 h-5 text-accent mr-3" /> Clean & well-maintained cars
              </li>
              <li className="flex items-center text-primary-200">
                <CheckCircle2 className="w-5 h-5 text-accent mr-3" /> Loyalty rewards & exclusive deals
              </li>
            </ul>
          </div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-accent rounded-3xl transform translate-x-4 translate-y-4 opacity-20"></div>
            <img src="https://images.unsplash.com/photo-1522709895105-ce3ecfc5f60d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Happy driving" className="rounded-3xl relative z-10 w-full h-full object-cover aspect-4/3 shadow-2xl" />
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-8 -left-8 glass p-6 rounded-2xl z-20 max-w-xs shadow-xl"
            >
              <p className="text-2xl text-accent font-serif mb-2">"</p>
              <p className="text-sm text-primary-200 mb-4">AUTO MAJID made our buying experience unforgettable. Great car, great service, great price!</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-800 mr-3 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt="User" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">James T.</p>
                  <p className="text-xs text-primary-400">Car Enthusiast</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Rewards Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mb-20"
      >
        <div className="bg-linear-to-r from-primary-900 to-[#104d44] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between border border-primary-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center mb-6 md:mb-0">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center md:mr-6 mb-4 md:mb-0 border border-accent/30 shrink-0 transform rotate-3 group-hover:rotate-12 transition-transform duration-500">
              <Gift className="w-8 h-8 text-accent" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Join AUTO MAJID Rewards</h3>
              <p className="text-primary-300">Earn points, unlock perks, and enjoy exclusive member benefits.</p>
            </div>
          </div>
          <Link to="/register" className="relative z-10 btn-primary py-4 px-8 rounded-full whitespace-nowrap flex items-center hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all">
            Join Now <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-10">
          <div className="flex flex-col items-center justify-center text-center">
            <CarIcon className="w-8 h-8 text-accent mb-3" />
            <h4 className="font-bold text-2xl text-white mb-1">10,000+</h4>
            <p className="text-sm text-primary-400">Happy Customers</p>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <MapPin className="w-8 h-8 text-accent mb-3" />
            <h4 className="font-bold text-2xl text-white mb-1">150+</h4>
            <p className="text-sm text-primary-400">Locations Nationwide</p>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <ShieldCheck className="w-8 h-8 text-accent mb-3" />
            <h4 className="font-bold text-2xl text-white mb-1">5,000+</h4>
            <p className="text-sm text-primary-400">Cars in Inventory</p>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <Star className="w-8 h-8 text-accent mb-3" />
            <h4 className="font-bold text-2xl text-white mb-1">4.9/5</h4>
            <p className="text-sm text-primary-400">Customer Rating</p>
          </div>
        </div>
      </motion.div>
      
    </div>
  );
};

export default Home;
