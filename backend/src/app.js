const cors = require('cors');
const express = require('express');
const morgan = require('morgan');

require('dotenv').config();

const authRoutes = require('./routes/auth.route');
const uploadRoutes = require('./routes/upload.route');
const vehicleRoutes = require('./routes/vehicle.route');
const vehicleLocationRoutes = require('./routes/vehicleLocation.routes');
const userLocationRoutes = require('./routes/userLocation.route');
const contactUsRoutes = require('./routes/contactUs.route');
const bookingRoutes = require('./routes/booking.route');
const paymentRoutes = require('./routes/payment.route');
const mapRoutes = require('./routes/map.route');
const reviewRoutes = require('./routes/review.route');
const favoriteRoutes = require('./routes/favorite.route');
const profileRoutes = require('./routes/profile.route');
const adminRoutes = require('./routes/admin.route');
const notificationRoutes = require('./routes/notification.route');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = Array.from(
  new Set(
    [
      process.env.CORS_ORIGINS || '',
      process.env.FRONTEND_ORIGIN || '',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
    ]
      .join(',')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('src/public'));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smartrent-api' });
});

app.use('/api/uploads', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicle_location', vehicleLocationRoutes);
app.use('/api/user_location', userLocationRoutes);
app.use('/api/contact_us', contactUsRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use(errorHandler);

module.exports = app;
