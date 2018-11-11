'use strict';
//*** add the simpleJs file**//
/* ===== simpleBlock file ===================================
|  author : Atul Kumar(atullh@gmail.com)
|  =============================================================*/


//**End simple js file*//

const Handlers  = require('./handler.js');
const Joi = require('joi');

const Hapi=require('hapi');

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});
//let blockchain ;

server.route([

/* TO-DO later */
   {
    path: '/requestValidation',
    method: 'POST',
    config: {
    handler:Handlers.handlers.requestValidation,
    validate: {
      payload:{
        address: Joi.string().required(),
      }
    }
  }
  },
//*/
  { path: '/block',  method: 'POST', handler: Handlers.handlers.addBlock},
  //{ path: '/requestValidation',  method: 'POST', handler: Handlers.handlers.requestValidation},
  { path: '/message-signature/validate',  method: 'POST', handler: Handlers.handlers.sigValidation},
  { path: '/stars/address:{address}', method: 'GET',    handler: Handlers.handlers.getForAddress },
  { path: '/stars/hash:{hash}', method: 'GET',    handler: Handlers.handlers.getForHash },
  { path: '/block/{height}', method: 'GET',    handler: Handlers.handlers.getForHeight },
]);


// Start the server
async function start() {

    try {
        await server.start();
        //blockchain = new privateBC.Blockchain(); //ensure the genesis is done as soon as server starts
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();

