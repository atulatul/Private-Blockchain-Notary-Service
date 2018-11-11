
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

// Add data to levelDB with key/value pair
async function addLevelDBData(key,value){
  db.put(key, value, function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
}

// Get BlockHash data from levelDB with key
async function getLevelDBDataHash(key,b){
return (new Promise(function(resolve,reject){
  db.get(key, function(err, value) {
    if (err) {console.log('Not found!', err);resolve(0);}
    if(value){b.previousBlockHash=JSON.parse(value).hash;resolve(b);}
  })
}));
}
// Get Block from Level DB
async function getLevelDBData(key,b){
return (new Promise(function(resolve,reject){
  db.get(key, function(err, value) {
    if (err) {console.log('Not found!', err);resolve(0);}
    if(value){/*console.log('Value = ' + value);*/b=JSON.parse(value);resolve(b);}
  })
}));
}
// Add data to levelDB with value

function addDataToLevelDB(value,value1) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
          //console.log('Block Object for add' + i +'value='+value);
          //value1.totalBlocks++;
          value1.isGenesisDone=true;
          //console.log('Block #' + i +'totalBlocks='+value1.totalBlocks);
          addLevelDBData(i, value);
        });
}

//Get initial Block count during each init so that we can build on existing chain
function initChain(value){
let i=0;
return (new Promise(function(resolve,reject){
    db.createReadStream().on('data', function(data) {
          value.isGenesisDone=true;
          i++;
        }).on('error', function(err) { }).on('close', function() {
            //console.log('total blocks='+ i); 
            if(i>0)
              value.totalBlocks = i-1;
            //console.log('total Blocks after init value='+value.totalBlocks);
            resolve(value);
        });
}));
}

//Get the block based on requet hash value for that we have go through all block till it exhause or we find the hash value
function getBlockWithHash(hValue){

return (new Promise(function(resolve,reject){
    db.createReadStream().on('data', function(data) {
          let block = JSON.parse(data.value);
          if(block.hash===hValue) {
            console.log('requested['+ hValue + ']' + '.... found ==>['+ block.hash + ']' );

            let bufStr = Buffer.from(block.body.star.story, 'hex');
            //with buffer, you can convert it into hex with following code
            block.body.star.storyDecoded = bufStr.toString('utf8');
            
            resolve(block); 
          }
        }).on('error', function(err) { }).on('close', function() {
            resolve(0);
        });
}));
}

//Get the block based on requested address value for that we have go through all block till it exhause or we find the hash value
function getBlockWithAddress(address){

return (new Promise(function(resolve,reject){

    var block = [];
    db.createReadStream().on('data', function(data) {
          let tempBlock = JSON.parse(data.value);
          if(tempBlock.body.address===address) {
            console.log(' push on array requested['+ address + ']' + '.... found ==>['+ tempBlock.body.address+ ']' );

            let bufStr = Buffer.from(tempBlock.body.star.story, 'hex');
            tempBlock.body.star.storyDecoded = bufStr.toString('utf8');

            block.push(tempBlock);
            //resolve(block); 
          }
        }).on('error', function(err) { }).on('close', function() {
            console.log('resolving with...'+ JSON.stringify(block).toString());
            resolve(block);
        });
    }));
}

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/



const SHA256 = require('crypto-js/sha256');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Star{
   constructor(dec,ra,story,isLookup){
   this.dec = dec;
   this.ra = ra;
      //converting string into buffer
   let bufStr = Buffer.from(story, 'utf8');
   //with buffer, you can convert it into hex with following code
   this.story = bufStr.toString('hex');
   console.log(this.story);
/*
   if(isLookup){
     let bufStr = Buffer.from(this.story, 'hex');
     //with buffer, you can convert it into hex with following code
     this.storyDecoded = bufStr.toString('utf8');
     console.log(this.storyDecoded);
   }
*/
  }
}

class Starbody{
      constructor(address,dec,ra,story,isLookup){
        this.address = address;
        this.star = new Star(dec,ra,story);
      }
}

class Block{
	constructor(address,dec,ra,story){
     this.hash = "",
     this.height = 0,
     this.body = new Starbody(address,dec,ra,story),
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this.totalBlocks=0;
    this.isGenesisDone = false;
    this.previousBlockHash = "";
    initChain(this).then(function(value){ 
    console.log('Total Blocks now in db = ' + value.totalBlocks);
    if(!value.isGenesisDone){ 
      console.log('add Geneisis Now as value of total blocks <1');
      value.addBlock(new Block('NA','dec 0 0','ra 0h 0m 0s','story : First Block in Chain - Genesis Block'));
    }
    });
  }

  // Add new block
  addBlock(newBlock){
   let  curr = this;
    return (new Promise(function(resolve,reject){

    if(curr.isGenesisDone){
      getLevelDBDataHash(curr.totalBlocks,curr).then(function(b){
      b.totalBlocks++; //increase now total block to next after getting previous block hash
          // Block height
      newBlock.height =b.totalBlocks; //this.chain.length;
      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      // previous block hash

      newBlock.previousBlockHash= b.previousBlockHash;
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      let blockString = JSON.stringify(newBlock).toString();
      console.log('going to add block with string val =' + blockString);
      addDataToLevelDB(blockString,b);  //add to levelDB after block all attrubutes are complete 
      resolve(blockString);

      });
     } 
     else{
       // Block height
       newBlock.height =curr.totalBlocks; //this.chain.length;
       // UTC timestamp
       newBlock.time = new Date().getTime().toString().slice(0,-3);
       // previous block hash
       newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
       let genBlockString = JSON.stringify(newBlock).toString();
       //console.log('going to add block with string val =' + genBlockString);
       addDataToLevelDB(genBlockString,curr);  //add to levelDB after block all attrubutes are complete 
       resolve(genBlockString);
     }

    }));

  }

  // Get block height
    getBlockHeight(){
      return this.totalBlocks;
    }

    // get block
      async getBlock(blockHeight){

     //var b;
     //await getLevelDBData(blockHeight,b);
     //console.log(JSON.stringify(b));
      // return object as a single string

      return (new Promise(function(resolve,reject){

         
      db.get(blockHeight, function(err, value) {
      if (err) {console.log('Not found!', err);resolve(0);}
      if(value){console.log('got value ' + value);
        let block = JSON.parse(value);
        let bufStr = Buffer.from(block.body.star.story, 'hex');
        block.body.star.storyDecoded = bufStr.toString('utf8');
        resolve(block);

      }
      })
    }));

/*        
      let b;
      getLevelDBData(blockHeight,b).then(function(b){ console.log(JSON.stringify(b).toString());return JSON.parse(JSON.stringify(b));});
*/  
  }

    // validate block
    validateBlock(blockHeight){
      let b;
      getLevelDBData(blockHeight,b).then(function(b){
        // get block object
        if(b){
          let block = JSON.parse(JSON.stringify(b));
          // get block hash
          let blockHash = block.hash;
          // remove block hash to test block integrity
          block.hash = '';
          // generate block hash
          let validBlockHash = SHA256(JSON.stringify(block)).toString();
          // Compare
          if (blockHash===validBlockHash) {
            return true;
          } else {
            console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
            return false;
          }
        }
        });
    }

   // Validate blockchain
    validateChain(){

      if(this.totalBlocks <1){return console.log('Only Genesis Block! No validation require as it has to check its own hash use validate Block instead of validateChain()');}
      let errorLog = [];
      let b;
      let i=0;
      let totalLen = this.totalBlocks;
      let delay = 200;
      let interval = setInterval(function(){
      
        // validate block
        getLevelDBData(i,b).then(function(b){
        if(b){
          let block = JSON.parse(JSON.stringify(b));
          let blockHash = block.hash;
          block.hash = '';
          let validBlockHash = SHA256(JSON.stringify(block)).toString();
          if (blockHash===validBlockHash) {
          } else {
            console.log('here error2');errorLog.push(i);
            console.log('Block #'+i+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          }
        }
        });
             
        let currBlock; 
        let nextBlock; 
        let blockHash ="";
        let previousHash ="";
        getLevelDBData(i,currBlock).then(function(currBlock){
          if(currBlock){
            blockHash = currBlock.hash;   

           }
        });
        getLevelDBData(i+1,nextBlock).then(function(nextBlock){
          if(nextBlock){previousHash = nextBlock.previousBlockHash; 
            // compare blocks hash link
            if (blockHash!==previousHash) {
            console.log('Block previous hash #'+' invalid previous hash:\n'+blockHash+'<>'+previousHash);
            console.log('Updating error log;');
            errorLog.push(i);
          }
        }
      });  
      i++;
      if (i >= totalLen) {
        getLevelDBData(totalLen,b).then(function(b){
        if(b){
          let block = JSON.parse(JSON.stringify(b));
          let blockHash1 = block.hash;
          block.hash = '';
          let validBlockHash = SHA256(JSON.stringify(block)).toString();
          if (blockHash1===validBlockHash) { 
          } else {
            console.log('here error1');errorLog.push(i);
            console.log('Block #'+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          }
	  if (errorLog.length>0) {
	    console.log('Block errors = ' + errorLog.length);
	    console.log('Blocks: '+errorLog);
	    } else {
	      console.log('No errors detected');
	    }
        }
        });   
//       */
        
        clearInterval(interval);
      }
     }, delay);
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.getLevelDBDataHash = getLevelDBDataHash;
module.exports.getLevelDBData = getLevelDBData;
module.exports.addLevelDBData = addLevelDBData;
module.exports.addDataToLevelDB = addDataToLevelDB;
module.exports.getBlockWithHash = getBlockWithHash;
module.exports.getBlockWithAddress = getBlockWithAddress;

