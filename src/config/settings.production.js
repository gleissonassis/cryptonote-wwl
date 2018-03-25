module.exports = {
    mongoUrl : util.format('mongodb://%s/%s', process.env.DB_SERVER, process.env.DB_NAME),
    servicePort : process.env.PORT,
    isMongoDebug : false

    //jwt config is configurated on settings.private.js
    //mailOptions is configurated on settings.private.js
};
