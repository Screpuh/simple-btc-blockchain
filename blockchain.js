import Block from './block.js';

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock() {
        const block = new Block(0, '0000000000');
        block.setData('Genesis Block');
        const validHash = block.mine();
        block.setHash(validHash);
        return block;
    }

    addBlock(block) {
        // check if previous hash is correct
        if (block.checkProof()) {
            console.log(block);
            throw new Error('Invalid previous hash');
        }
        this.chain.push(block);
    }

    createNextBlock(data = '') {
        const previousBlock = this.getLatestBlock();
        const block = new Block(previousBlock.height + 1, previousBlock.getHash());
        block.setData(data);
        return block;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    getBlock(height) {
        return this.chain[height];
    }

    isValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // check if previous hash is correct
            if (currentBlock.previousHash !== previousBlock.getHash()) {
                return false;
            }

            // check if the hash of the block is correct
            if (currentBlock.getHash() !== currentBlock.createHash()) {
                return false;
            }
        }

        return true;
    
    }
}

export default Blockchain;