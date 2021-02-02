var Service = require('node-windows').Service;
var path = require('path');

var svc = new Service({
  name:'JBBFAgentService',
  description: 'JBBFAgentService test service',
  script: path.resolve('app', 'main.prod.js'),
});


svc.on('install',function(){
  svc.start();
});

svc.install();
