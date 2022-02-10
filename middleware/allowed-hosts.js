module.exports = (hosts) => {
    return (req, res, next) => {
        const res401 = () => {
            res.statusCode = 401
            res.end("Unauthorized")
        }
        if (!Array.isArray(hosts)) {
            res401() 
            return
        }
        if (hosts.includes("*")) {
            next()
            return
        }
    
        let host = req.get('host').replace(/:.*/gi, "")
        
        if (hosts.includes(host)) {
            next()
        } else {
            res.statusCode = 401
            res.end("Unauthorized")
        }
    }
}