/* eslint-disable */
const allowedOrigins = [ 
    process.env.CLIENT_DEV_ORIGIN,
    process.env.CLIENT_PRO_ORIGIN,
    "https://www.polarx.hanifahmadov.site",
    "https://polarx.hanifahmadov.site",
    "http://www.polarx.hanifahmadov.site",
    "http://polarx.hanifahmadov.site",
    "52.22.120.131",
]

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsOptions 