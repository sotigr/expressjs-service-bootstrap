const allowedHostsMiddleware = require("./middleware/allowed-hosts")
const bodyParser = require('body-parser')

const defaultConfig = {
    allowedHosts: [],
    statusUrl: "/status",
}


module.exports = (app, config) => {
    config = config || defaultConfig;

    app.get(config.statusUrl || defaultConfig.statusUrl, (req, res) => {
        res.end("ok")
    })

    app.use(bodyParser.json())

    app.use(allowedHostsMiddleware(config.allowedHosts))
}