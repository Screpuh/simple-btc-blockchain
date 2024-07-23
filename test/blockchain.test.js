import { expect } from 'chai';

import Blockchain from '../src/blockchain.js';
import Block from '../src/block.js';

describe('Blockchain', function() {
    let blockchain;

    beforeEach(function() {
        blockchain = new Blockchain();
    });

    describe('constructor', function() {
        it('should start with a single genesis block', function() {
            expect(blockchain.chain.length).to.equal(1);
        });

        it('should start with a genesis block as the first block', function() {
            const genesisBlock = blockchain.chain[0];

            expect(genesisBlock.data).to.equal('Genesis Block');
            expect(genesisBlock.previousHash).to.equal('0000000000');
            expect(genesisBlock.height).to.equal(0);
            expect(genesisBlock.getHash()).to.match(/^0000/);
        });
    });

    describe('addBlock', function() {
        it('should add a new block to the chain', function(done) {
            const newBlock = blockchain.createNextBlock('Test Data');
            const hash = newBlock.mine();
            // wait for the block to be mined
            setTimeout(() => {   
                blockchain.addBlock(newBlock);

                expect(blockchain.chain.length).to.equal(2);
                expect(blockchain.getLatestBlock().data).to.equal('Test Data');
                expect(blockchain.getLatestBlock().getHash()).to.match(/^0000/);
                done();
            }, 1000);
        });

        it('should throw an error for invalid block', function() {
            const newBlock = new Block(1, 'InvalidHash');
            expect(() => blockchain.addBlock(newBlock)).to.throw('Invalid block');
        });
    });

    describe('isValid', function() {
        it('should validate a correct blockchain', function(done) {
            const newBlock = blockchain.createNextBlock('Test Data');
        
             const hash = newBlock.mine();
             // wait for the block to be mined
            setTimeout(() => {   
                blockchain.addBlock(newBlock);
                expect(blockchain.isValid()).to.be.true;
                done();
            });
        });

        it('should invalidate a blockchain with tampered blocks', function(done) {
            const newBlock = blockchain.createNextBlock('Test Data');
            const hash = newBlock.mine();
            setTimeout(() => {   
                blockchain.addBlock(newBlock);
                blockchain.chain[1].data = 'Tampered Data';
                expect(blockchain.isValid()).to.be.false;
                done();
            });
        });
    });
});