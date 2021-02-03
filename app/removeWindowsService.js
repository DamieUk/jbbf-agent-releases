var Service = require('node-windows').Service;
var path = require('path');

var svc = new Service({
  name:'JBBFAgentService',
  description: 'Service for execution of jbbf scrips',
  workingDirectory: path.resolve('C:/Program Files', 'JBBFAgentService'),
  script: path.resolve('C:/Program Files', 'JBBFAgentService', 'main.prod.js'),
  nodeOptions: [
    '--harmony'
  ]
});

svc.on('uninstall',function(){
  console.info('JBBFAgentService has been uninstalled.')
});

svc.uninstall();
