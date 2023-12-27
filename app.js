const path = require('path');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRouters');
const userRouter = require('./routes/userRouters');
const reviewRouter = require('./routes/reviewRouters');
const viewRouter = require('./routes/viewRouters');
const globalErrorHandler = require('./Controllers/errorController');
const AppError = require('./Utils/appError');
const cookieParser = require('cookie-parser');
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


/// 1) Global Middlewares
//set security HTTP Header
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'http://127.0.0.1:8000', 'ws://localhost:42877/']
      }
    }
  }));
//Development Logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}
// app.use(morgan('tiny')); //it basically us to print req object on console.

//Body parser, reading data from body into req.body
app.use(express.json({limit : '10kb'}));
app.use(cookieParser());
//Data sanitization against NoSql query injection
app.use(mongoSanitize()); //it will basically remove all the dollar signs or other signs which could be malicious
//from the req body and query

//Data sanitization against xss
app.use(xss()); //it prevents from converting html sent in the request to avoid malicious activity.

//Prevent Parameter Pollution
app.use(hpp({
    whitelist : [
      'duration',
      'ratingsQuantity',
      'rantingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
}
));

//serving static files as routes.
app.use(express.static(path.join(__dirname, 'public')));
//is any static file name is hit which doesn't match any of the specified routers(url) then it will 
//go to the above mentioned location and will search for the file there and send the same as res object


app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

//Limit requests from same API.
const limiter = rateLimit({
    max : 100,
    windowMs : 60 * 60 * 1000,
    message : 'Too many Requests!! Please try after some time.'
});

app.use('/api', limiter);

//3) Routes


app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews',reviewRouter);
//This is called mounting because it is kind of something like we are mounting routes inside router

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this Server!!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;


