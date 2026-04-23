const express = require('express');
var morgan = require('morgan');
// import routes
const authRoutes = require('./routes/auth.route');
const uploadRoutes = require('./routes/upload.route');
const vehicleRoutes = require('./routes/vehicle.route')
const vehicleLocationRoutes = require('./routes/vehicleLocation.routes')
const contactUsRoutes = require('./routes/contactUs.route')
const bookingRoutes = require('./routes/booking.route')
const paymentRoutes = require('./routes/payment.route')
const mapRoutes = require('./routes/map.route')
require('dotenv').config();
const userLocationRoutes = require('./routes/userLocation.route');
const reviewRoutes = require('./routes/review.route');
const favoriteRoutes = require('./routes/favorite.route');
// middleware for hand
const { handleCors } = require('./middlewares/cors.middleware');
const errorHandler = require('./middlewares/errorHandler');
const app = express();


//// Stop forwarding events
// events.close()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(handleCors);

app.use(express.static("src/public"));

const profileRoutes = require('./routes/profile.route')

app.use(morgan('dev'));
app.use('/api/uploads', handleCors, uploadRoutes);
app.use('/api/auth', handleCors, authRoutes);
app.use('/api/profile', handleCors, profileRoutes);
app.use('/api/vehicles', handleCors, vehicleRoutes);
app.use('/api/vehicle_location', handleCors, vehicleLocationRoutes);
app.use('/api/user_location', handleCors, userLocationRoutes);
app.use('/api/contact_us', handleCors, contactUsRoutes);
app.use('/api/booking/', handleCors, bookingRoutes)
app.use('/api/payment/', handleCors, paymentRoutes)
app.use('/api/map', handleCors, mapRoutes);
app.use('/api/reviews', handleCors, reviewRoutes);
app.use('/api/favorites', handleCors, favoriteRoutes);
app.use(errorHandler);



module.exports = app;
