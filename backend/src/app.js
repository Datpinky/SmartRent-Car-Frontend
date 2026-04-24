const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
// import routes
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
const showroomRoutes = require('./routes/showroom.route');
const contractRoutes = require('./routes/contract.route');
const vehicleDamageInspectionRoutes = require('./routes/vehicleDamageInspection.route');
// middleware for hand
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

/** Dev + production: thêm origin frontend vào CORS_ORIGINS trong .env (phân tách bằng dấu phẩy) */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ||
  'http://localhost:3000,http://localhost:3001,http://localhost:5000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smartrent-api' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
app.use('/api/showrooms', showroomRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/vehicle-damage-inspections', vehicleDamageInspectionRoutes);
app.use(errorHandler);

module.exports = app;
