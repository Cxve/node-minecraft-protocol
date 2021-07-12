'use strict'

const Server = require('./server')
const NodeRSA = require('node-rsa')
const Plugins = {
  handshake: require('./server/handshake'),
  keepalive: require('./server/keepalive'),
  login: require('./server/login'),
  ping: require('./server/ping')
}

module.exports = createServer

function createServer (options = {}) {
  const {
    host = undefined, // undefined means listen to all available ipv4 and ipv6 adresses
    // (see https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback for details)
    'server-port': serverPort,
    port = serverPort || 25565,
    motd = 'A Minecraft server',
    'max-players': maxPlayersOld = 20,
    maxPlayers: maxPlayersNew = 20,
    version,
    favicon,
    customPackets,
    plugins = ["handshake", "keepalive", "login", "ping"]
  } = options

  const maxPlayers = options['max-players'] !== undefined ? maxPlayersOld : maxPlayersNew

  const optVersion = version === undefined || version === false ? require('./version').defaultVersion : version

  const mcData = require('minecraft-data')(optVersion)
  if (!mcData) throw new Error(`unsupported protocol version: ${optVersion}`)
  const mcversion = mcData.version
  const hideErrors = options.hideErrors || false

  const server = new Server(mcversion.minecraftVersion, customPackets, hideErrors)
  server.mcversion = mcversion
  server.motd = motd
  server.maxPlayers = maxPlayers
  server.playerCount = 0
  server.onlineModeExceptions = {}
  server.favicon = favicon
  server.serverKey = new NodeRSA({ b: 1024 })

  server.on('connection', function (client) {
    //plugins.forEach(plugin => plugin(client, server, options))
    plugins.forEach(plugin => {
      if (Plugins.hasOwnProperty(plugin)) Plugins[plugin](client, server, options);
    });
  })
  server.listen(port, host)
  return server
}
