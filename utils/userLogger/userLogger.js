const { createLogger, transports, format } = require('winston')
require('winston-mongodb')

const userLogger = createLogger({
    transports: [
        new transports.Console({
            level: "info",
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.Console({
            level: "error",
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.File({
            filename: 'logs/userLog/userLog.log',
            level: "info",
            maxsize: 5242880,
            format: format.combine(
                format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
                format.align(),
                format.printf(info => `level ${info.level}: ${info.timestamp} ${info.message}`)
            ),
        }),
        new transports.MongoDB({
            level: "info",
            db: process.env.DB_URL,
            options: {
                useUnifiedTopology: true,
            },
            collection: 'userLogs',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})

module.exports = userLogger
