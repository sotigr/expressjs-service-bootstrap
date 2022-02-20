const amqp = require("amqplib");

const emptyMiddleware = (req, res, next) => next()

const defaultConfig = {
    url: undefined,
    queues: [],
    disableConsumers: false,
    disableProviders: false
}

function sleep(timeout) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout);
    })
}

function ensureConnection(url) {
    return new Promise(async (resolve, reject) => {
        let c = 0
        while (c < 5) {
            console.log("Waiting for rabbitmq")
            try {
                const connection = await amqp.connect(url) 
                resolve(connection)
                return;
            } catch (ex) { console.log(ex.message) }
            await sleep(3000)
            c++
        }
        reject()
    })
}

module.exports = async function (config) {
    if (!config) config = {};
    config = { ...defaultConfig, ...config }
    if (!config.url) {
        console.error("ERROR: Please specify the connection url of the rabbitmq server");
        return emptyMiddleware
    }
    if (config.queues.length == 0) {
        console.error("ERROR: Please specify queues you want to listen to");
        return emptyMiddleware
    }

    const connection =   await ensureConnection(config.url)

    const channels = []
    const listeners = {}
  
    let channelSend = null
    if (!config.disableProviders) {
        channelSend = await connection.createChannel();
        channels.push(channelSend)
    }

    if (!config.disableConsumers) {
        for (let queue of config.queues) {
            const channel = await connection.createChannel();
            await channel.assertQueue(queue);
            channels.push(channel)

            channel.consume(queue, async message => {
                const received = JSON.parse(message.content.toString());

                let eventListeners = listeners[queue];

                let promises = []
                try {
                    for (let listener of eventListeners) {
                        promises.push(listener(received))
                    }
                    await Promise.all(promises)

                    channel.ack(message);
                } catch (ex) {
                    console.log(`Error while executing events bound to the "${queue}" queue`)
                }

            })

        }
    }

    const rabbitmq = {
        connection,
        channels,
        trigger: config.disableProviders ? async () => { } : async (queue, message) => {
            await channelSend.sendToQueue(queue, Buffer.from(JSON.stringify(message)))
        },
        on: config.disableConsumers ? async () => { } : (queue, callback) => {
            if (!Array.isArray(listeners[queue])) {
                listeners[queue] = []
            }
            listeners[queue].push(callback)
        }
    }

    return {
        middleware: (req, res, next) => {
            req.rabbitmq = rabbitmq
            next()
        },
        rabbitmq
    }
}