var Service = require('node-windows').Service;
var path = require('path');

console.log(path.resolve('.', 'main.prod.js'))

var svc = new Service({
  name:'JBBFAgentService',
  description: 'Service for execution of jbbf scrips',
  workingDirectory: path.resolve('C:/Program Files', 'JBBFAgentService'),
  script: path.resolve('.', 'main.prod.js'),
});

svc.on('install',function(){
  svc.start();
});

svc.install();
