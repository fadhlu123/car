require('dotenv').config();
const connectDB = require('./config/db');
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const vehicles = [
  {
    brand: 'Tesla',
    model: 'Model Y Long Range',
    year: 2024,
    price: 49990,
    mileage: 0,
    fuelType: 'Electric',
    transmission: 'Automatic',
    engineSize: 'Dual Motor',
    color: 'Pearl White',
    condition: 'New',
    description: 'Experience the future of driving with the Tesla Model Y. Unmatched range, autopilot capabilities, and a sleek minimalist interior.',
    availabilityStatus: 'Available',
    images: ['https://images.unsplash.com/photo-1617788138017-80ad40651399?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80']
  },
  {
    brand: 'BMW',
    model: 'M4 Competition',
    year: 2023,
    price: 82500,
    mileage: 4500,
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    engineSize: '3.0L Twin-Turbo V6',
    color: 'Isle of Man Green',
    condition: 'Used',
    description: 'The pinnacle of BMW performance. The M4 Competition delivers breathtaking acceleration and track-ready dynamics wrapped in luxury.',
    availabilityStatus: 'Available',
    images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80']
  },
  {
    brand: 'Mercedes-Benz',
    model: 'G-Class G63 AMG',
    year: 2024,
    price: 179000,
    mileage: 120,
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    engineSize: '4.0L V8 Biturbo',
    color: 'Obsidian Black',
    condition: 'New',
    description: 'Iconic design meets uncompromised off-road capability and handcrafted luxury in the legendary G-Wagon.',
    availabilityStatus: 'Available',
    images: ['https://images.unsplash.com/photo-1520031441872-265e4ff70366?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80']
  },
  {
    brand: 'Audi',
    model: 'RS e-tron GT',
    year: 2024,
    price: 147100,
    mileage: 0,
    fuelType: 'Electric',
    transmission: 'Automatic',
    engineSize: 'Dual Motor',
    color: 'Tactical Green',
    condition: 'New',
    description: 'Audi’s all-electric grand tourer combines striking proportions with blistering acceleration and cutting-edge tech.',
    availabilityStatus: 'Available',
    images: ['https://images.unsplash.com/photo-1614200187524-dc4b892acf16?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80']
  }
];

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    // Only simple deleteMany works with mock db if we implemented it.
    // Actually, mock db doesn't have deleteMany implemented. Let's just create if not exists.
    
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@automajid.com' });
    if (!adminExists) {
      console.log('Creating admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await User.create({
        name: 'Admin User',
        email: 'admin@automajid.com',
        password: hashedPassword,
        role: 'admin'
      });
    }

    // Insert Vehicles
    console.log('Inserting vehicles...');
    for (const vehicle of vehicles) {
       const exists = await Vehicle.findOne({ brand: vehicle.brand, model: vehicle.model });
       if (!exists) {
          await Vehicle.create(vehicle);
       }
    }

    console.log('Data seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
