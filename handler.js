
const privateBC  = require('./privateChain.js');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

const validator = require('validator');



//map to store user info of requestValidation with timestamp
//Remove once either signature validation complete or timestamp is more than allowed limit
let blockchain = new privateBC.Blockchain();

var UserValidationRequestDataMap = new Map();

//map to store user info of store address with Valid signatures with timestamp
//add into this map once the signature is validated and remove once starRegister done for the same
//only one time use and one time store
var  ValidSignatureDataMap  = new Map();


class requestValidationResponse{
	constructor(address,isSig){
     var reqValRes = UserValidationRequestDataMap.get(address);
     if(reqValRes) {
        var currentTime = (new Date().getTime().toString().slice(0,-3) - reqValRes.requestTimeStamp); 
        if((reqValRes.validationWindow - currentTime) > 0) {
          console.log('same user within 300 window');
          reqValRes.validationWindow = reqValRes.validationWindow - currentTime;
          this.address = address;
          this.requestTimeStamp = reqValRes.requestTimeStamp;
          this.message=reqValRes.message;
          this.validationWindow = reqValRes.validationWindow;
          UserValidationRequestDataMap.set(address,this);
        }
        else { //time expired so it is new one so create a new one
         this.address = address;
         // UTC timestamp
         this.requestTimeStamp = new Date().getTime().toString().slice(0,-3);
         //constant validation Window
         this.message = address + ":"+this.requestTimeStamp +":starRegistry";
         UserValidationRequestDataMap.set(address,this);
         console.log(UserValidationRequestDataMap.size);
         if(isSig)
         this.messageSignature = false;
         this.validationWindow = 300;
        }
     }
     else { 
       this.address = address;
       // UTC timestamp
       this.requestTimeStamp = new Date().getTime().toString().slice(0,-3);
       //constant validation Window
       this.message = address + ":"+this.requestTimeStamp +":starRegistry";
       UserValidationRequestDataMap.set(address,this);
       console.log(UserValidationRequestDataMap.size);
       if(isSig)
       this.messageSignature = false;
       this.validationWindow = 300;
    }
  }
};


class sigValidationResponse{
	constructor(address,isValid){
          this.registerStar = false;
          var requestInfo = UserValidationRequestDataMap.get(address,true);
          if(requestInfo){
            var currentTime = (new Date().getTime().toString().slice(0,-3) - requestInfo.requestTimeStamp); 
            if((requestInfo.validationWindow - currentTime) < 0) {
            this.registerStar = false;
            UserValidationRequestDataMap.delete(address);
            }
            else{
              requestInfo.validationWindow = requestInfo.validationWindow - currentTime;    
              requestInfo.messageSignature = isValid;
              this.status = requestInfo;
              if(isValid){ 
                this.registerStar = true;
                ValidSignatureDataMap.set(address,true);
                UserValidationRequestDataMap.delete(address);
              
              }
            }
         }
         else{
           this.registerStar = false;
         }
      }
};
// Add the route handlers TO-DO add await for addBlock
var handlers = {
  addBlock: async function (request, reply) {
    console.log('In the block.post handler with this: ' 
    	+ JSON.stringify(request.payload));
   // call addBlock with data request.payload.data to addBlock and return the block id or height from the same 
   var address = request.payload.address;
   console.log(request.payload.address + '\n');
   console.log(request.payload.star.dec + '\n'); 
   console.log(request.payload.star.ra +'\n'); 
   console.log(request.payload.star.story+'\n'); 
   if(!request.payload.address || !request.payload.star.dec || !request.payload.star.ra || !request.payload.star.story){
       return reply.response('Not Allowed please provide  proper paramers to register star').type('application/json');

   }
   if(!validator.isByteLength(request.payload.star.story,0,500) || !validator.isAscii(request.payload.star.story)){
      return reply.response('Not Allowed please check and provide proper story requirements to register star').type('application/json');
   }  
  //first check if the time is allowed and then call this else reject the request
  // once added is done os before resolve need to remove the map info for the current address as it may lead to overflow
   if(ValidSignatureDataMap.get(address)){
     return (new Promise(function(resolve,reject){
     // blockchain.addBlock(new Block(request.payload.data));
      blockchain.addBlock(new privateBC.Block(request.payload.address,request.payload.star.dec,request.payload.star.ra,request.payload.star.story)).then(function(b){console.log(b);
      ValidSignatureDataMap.delete(address); //delete the address as only one star register per request time
       
      resolve(reply.response(b).type('application/json'));
      });
      }));
   } 
   else{

     return reply.response('A user cannot register more than one star at a time').type('application/json');

   }
 },

  sigValidation: async function (request, reply) {
    console.log('In the sigValidation handler with this: ' 
    	+ JSON.stringify(request.payload.address));
    var address = request.payload.address;
    let signature = request.payload.signature;
    
    console.log(UserValidationRequestDataMap.size);
    let mapInfo = UserValidationRequestDataMap.get(address);
    let validateResult = false;
    if(mapInfo){
      console.log(signature);
      console.log(UserValidationRequestDataMap.get(address).message);
      validateResult = bitcoinMessage.verify(UserValidationRequestDataMap.get(address).message, address, signature);
      console.log(validateResult);
      let data = new sigValidationResponse(address,validateResult); 
      // call addBlock with data request.payload.data to addBlock and return the block id or height from the same 
       return reply.response(data).type('application/json');
    }
    else{
      let data = new sigValidationResponse(address,validateResult); 

      // call addBlock with data request.payload.data to addBlock and return the block id or height from the same 
      return reply.response('Signature Validation Failed! Follow proper sequence for validation!');
    }
    
  },

  requestValidation: function (request, reply) {
    console.log('In the requestValidation handler with this: ' 
    	+ JSON.stringify(request.payload.address));
    var address = request.payload.address;
    var data = new requestValidationResponse(address,false); 
    // call addBlock with data request.payload.data to addBlock and return the block id or height from the same 
     return reply.response(data).type('application/json');
  },

  getForAddress: async function(request, reply) {
  console.log('In the getForAddress function with this: ' 
      + JSON.stringify(request.params));
  var address = request.params.address;
  console.log('the address is ===>' + address);

  var block = await privateBC.getBlockWithAddress(address);
  console.log('get Address result' + JSON.stringify(block).toString());
  return reply.response(block).type('application/json');

  },

  getForHash: async function(request, reply) {
  console.log('In the getForHash function with this: ' 
      + JSON.stringify(request.params));
  var hash = request.params.hash;
  var block = await privateBC.getBlockWithHash(hash);
  console.log('the hash is ===>' + hash);
  console.log('get Hash' + JSON.stringify(block).toString());
  return reply.response(block).type('application/json');
  },

  getForHeight:async  function (request, reply) {
    console.log('In the block.get function with this: ' 
      + JSON.stringify(request.params));
    var id = request.params.height; 

    console.log('the height is =' + id);
    var block = await blockchain.getBlock(id);

    console.log('first' + JSON.stringify(block).toString());
    return reply.response(block).type('application/json');
  }
};

module.exports.handlers = handlers;
module.exports.requestValidationResponse = requestValidationResponse;
module.exports.sigValidationResponse = sigValidationResponse;
