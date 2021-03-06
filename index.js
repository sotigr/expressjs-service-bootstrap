const allowedHostsMiddleware = require("./middleware/allowed-hosts")
const rabbitmqMiddleware = require("./middleware/rabbitmq")
const bodyParser = require('body-parser') 

const defaultConfig = {
    allowedHosts: [],
    statusUrl: "/status",
    rabbitmq: null
}


module.exports = async (app, config) => {
    if (!config) config = {};
    config = {
        ...defaultConfig,
        ...config
    }

    app.get(config.statusUrl, (req, res) => {
        res.end("ok")
    })
   
    app.use(bodyParser.json())

    app.use(allowedHostsMiddleware(config.allowedHosts))
    
    let rabbitmqMw
    if (config.rabbitmq) {
        rabbitmqMw = await rabbitmqMiddleware(config.rabbitmq)
        app.use(rabbitmqMw.middleware)
    }

    return {
        rabbitmq: config.rabbitmq? rabbitmqMw.rabbitmq: null
    }
}