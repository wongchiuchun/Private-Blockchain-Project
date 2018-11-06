const level = require('level');
const chainDB = './blockchaindata';
const db = level(chainDB);
const Boom = require('boom');

//level DB functions implemented

// Add data to levelDB with key/value pair
function addLevelDBData(key,value){
  return new Promise(function (resolve, reject){
    db.put(key, value, function(err) {
    if (err) {
      return console.log('Block ' + key + ' submission failed', err);
      reject(err);
    }else{
      resolve(value);
    }
  });
});
}

// Get data from levelDB with key
function getLevelDBData(key){
  return new Promise(function (resolve, reject){
  db.get(key, function(err, value) {
    if (err){
      return console.log('Not found!', err);
      reject(err);
    }else{
      resolve(value);
    }
  });
});
}


const SHA256 = require('crypto-js/sha256');


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}


// Create Genesis Block

let gblock = new Block("Genesis block");


/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

//this is now also the controller
class Blockchain{

  constructor(server){
    this.server = server;
    this.createGenesisBlock();
    this.getBlockByIndex();
    this.postNewBlock();
    }


    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/block/{index}"
     */
  getBlockByIndex() {
        this.server.route({
            method: 'GET',
            path: '/block/{index}',
            handler: async (request, h) => {
              //check to see if index is in range or valid. If not throw an error message
                  if (! (await this.getBlockHeight() > request.params.index && request.params.index >= 0)){
                    throw Boom.badRequest("Index error! Block index not in the block range. Please enter a valid Block Index and try again")
                  }
                  else{
                    //call the get block function using the request index
                    return JSON.parse(await this.getBlock(request.params.index));}
            }
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     */
     //tested error handling - boom has already picked up any empty value as bad request 400
  postNewBlock() {
        let self = this;
        this.server.route({
            method: 'POST',
            path: '/block',
            handler: async (request, h) => {
              //check if there is any input data for block and add block only if there is
              if (request.payload.data && request.payload.data!==""){
                //create new block
                await this.addBlock(new Block(request.payload.data));
                //get block height first
                let unadjheight = await this.getBlockHeight();
                //adjust the height
                let index = unadjheight - 1
                //return the latest block info
                return JSON.parse(await this.getBlock(index));
              }else{
                throw Boom.badRequest("Please input block data in the data field")
              }
            }
      });
    }

  async createGenesisBlock(){
    let height = await this.getBlockHeight();

    if (height === 0) {
    //change genesis block time
    gblock.time = new Date().getTime().toString().slice(0,-3);
    //work out genesis block hash
    gblock.hash = SHA256(JSON.stringify(gblock)).toString();
    // wait for the genesis block to be added
    await addLevelDBData(0, JSON.stringify(gblock).toString());
    // confirm genesis block has been added
    console.log("genesis block has been created")
  };
}



  // Add new block
  async addBlock(newBlock){
    // check if there is already a genesis block
      let height = await this.getBlockHeight();

      if (height === 0) {
      //change genesis block time
      gblock.time = new Date().getTime().toString().slice(0,-3);
      //work out genesis block hash
      gblock.hash = SHA256(JSON.stringify(gblock)).toString();
      // wait for the genesis block to be added
      await addLevelDBData(0, JSON.stringify(gblock).toString());
      // confirm genesis block has been added
      console.log("genesis block has been created")
    }else{

      newBlock.height = height;
    // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);
    // get previous block data in the form of an object
      let phash = await getLevelDBData(newBlock.height-1);
    // parse that object and get the hash data then assign it to previous hash
      newBlock.previousBlockHash = JSON.parse(phash).hash;

    // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // wait for the block to be added to chain
      await addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString());
    // print confirmation that it has been added
      console.log(`Block ${newBlock.body} has been added to the chain`);
};
  }



  // Get block height
  getBlockHeight() {
    return new Promise(function(resolve, reject){
      let i = 0;
      db.createReadStream().on('data', function(data) {
            i++;
          }).on('error', function(err) {
              return console.log('Unable to read data stream!', err);
              reject(err)
          }).on('close', function() {
              resolve(i)
          });
    });
    }

    // get block
  getBlock(blockHeight){
      // return object as a single string
      return getLevelDBData(blockHeight);
    }

    // validate block
  async validateBlock(blockHeight){
      // get block object
      let rawBlock = await this.getBlock(blockHeight).then((result)=>{return result});
      // get block hash
      let block = JSON.parse(rawBlock);

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

    // Validate blockchain
    validateChain(){
      let errorLog = [];
      let self = this;
      db.createKeyStream().on('data', async function(data) {
          //get block height
          let height = await self.getBlockHeight();
          // get result from validate block, validate each block
          let fresult = await self.validateBlock(data).then((result)=>{return result});
          // if result is false, add the blockheight to errlog
          if (fresult === false){
            errorLog.push(data);
          }
          //check if data has a next block, prepare to validate the chain
          if (data<height-1){
              //get current block info
              let rawBlock = await self.getBlock(data).then((result)=>{return result});
              // parse it
              let block = JSON.parse(rawBlock);
              //get its hash
              let blockHash = block.hash;
              //get next block info
              let nextRawBlock = await self.getBlock(parseInt(data)+1).then((result)=>{return result})
              // parse it
              let nextblock = JSON.parse(nextRawBlock);
              //get next block previous hash
              let previousHash = nextblock.previousBlockHash;
              //compare the hash of current block with previousHash of next block, if doesn't match, add to errlog
              if (blockHash!==previousHash) {
                errorLog.push(data);
              };
            }
          }).on('error', function(err) {
              return console.log('Unable to read data stream!', err)
          //once all done, check if there is any error in the errorLog
          }).on('close', function() {
              return errorLog;
          });
        if (errorLog.length>0) {
          console.log('Block errors = ' + errorLog.length);
          console.log('Blocks: '+errorLog);
        } else {
          console.log('No errors detected');
        };
      }

}

/**
 * Exporting the BlockController class
 * @param {*} server
 */
module.exports = (server) => { return new Blockchain(server);}
