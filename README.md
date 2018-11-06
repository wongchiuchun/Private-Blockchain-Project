# Blockchain Data

Blockchain has the potential to change the way that the world approaches data. Develop Blockchain skills by understanding the data model behind Blockchain by developing your own simplified private blockchain.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Install all project dependencies using the package.json file
```
npm install
```

## Node.js framework

This project uses the Hapi.js framework. You can get more information about the framework here https://hapijs.com/

## API Endpoints

1: getBlockByIndex()
   URL: '/block/{index}'
   Method: 'GET'
   URL Params: index = [integer] (e.g.'/block/0')
   Note: Index should be within the range of available data, else an error message will return

2: postNewBlock()
   URL: '/block'
   Method: 'POST'
   Data Params: {data: [alphanumeric]}
   Note: You should enter the data you want to use in the new block to create in payload.data



## Testing of Blockchain and Database Code

To test code:
1: Open a command prompt or shell terminal after install node.js.
2: Enter a node session, also known as REPL (Read-Evaluate-Print-Loop).
```
node
```
3: Copy and paste your code into your node session
4: Instantiate blockchain with blockchain variable
```
let blockchain = new Blockchain();
```
5: Generate 10 blocks using a for loop
```
for (var i = 0; i <= 10; i++) {
  blockchain.addBlock(new Block("test data "+i));
}
```
6: Validate blockchain
```
blockchain.validateChain();
```
7: Induce errors by changing block data
```
let inducedErrorBlocks = [2,4,7];
for (var i = 0; i < inducedErrorBlocks.length; i++) {
  blockchain.chain[inducedErrorBlocks[i]].data='induced chain error';
}
```
8: Validate blockchain. The chain should now fail with blocks 2,4, and 7.
```
blockchain.validateChain();
```
## Testing of the server

To test server:
1: Open a command prompt and run the server.js file in node environment:
```
node server.js
```
2: Wait until you see "Server running at: http://localhost:8000"

3: Open your browser at http://localhost:8000 to test the API Endpoints
