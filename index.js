const allowedHostsMiddleware = require("./middleware/allowed-hosts")

const defaultConfig = {
    allowedHosts: [],
    statusUrl: "/status",
}


module.exports = (app, config) => {
    config = config || defaultConfig;

    app.get(config.statusUrl, (req, res) => {
        res.end("ok")
    })

    app.use(allowedHostsMiddleware(config.allowedHosts))
}