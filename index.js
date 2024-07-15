import Blockchain from './blockchain.js';
import Express from 'express';
import BodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a blockchain
const blockchain = new Blockchain();

// Create 3 new blocks, mine them and add to blockchain
for (let i = 0; i < 3; i++) {
    const block = blockchain.createNextBlock();
    block.setData('Hello World ' + i);
    block.setHash(block.mine());
    blockchain.addBlock(block);
}

// Start a simple express server with some basic routes to interact with the blockchain
var app = Express();

// for post request
var jsonParser = BodyParser.json()
 
app.get('/', function(req, res){
    res.sendFile(__dirname + '/dashboard.html');
});

app.get('/blockchain', function(req, res){
    res.json(blockchain);
});

app.get('/block/:height', function(req, res){
    res.json(blockchain.getBlock(req.params.height));
});

app.get('/validate', function(req, res){
    res.json(blockchain.isValid());
});

app.get('/nextblock', function(req, res){
    const newBlock = blockchain.createNextBlock((Math.random() + 1).toString(36).substring(2));
    newBlock.setHash(newBlock.mine());
    blockchain.addBlock(newBlock);

    res.json(newBlock);
});

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});
  