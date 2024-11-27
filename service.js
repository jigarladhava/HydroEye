const Service = require('node-windows').Service;

// Create a new service object
const svc = new Service({
  name: 'WebHistoricData',
  description: 'WebHistoricData of Phase-1 and 2',
  script: 'E:\\Jigar\\DLPDatacheck\\server.js',
});

// Listen for the "install" event, which indicates the service is installed
svc.on('install', () => {
  svc.start();
  console.log('Service installed and started successfully.');
});

// Install the service
svc.install();

//svc.uninstall()