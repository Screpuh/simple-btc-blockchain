import { createHash } from 'node:crypto';

class Block {
    constructor(height, previousHash) {
        // the index of the block in the blockchain is called the height. The genesis block has a height of 0.
        this.height = height;
        this.previousHash = previousHash;
        this.timestamp = 0;
        //this.merkleRoot = "";
        //this.size = 0;
        this.hash = "";
        this.nonce = 0;
        this.data = "";
    }

    createHash() {
        const hash = createHash('sha256');

        hash.update(this.height + this.nonce + this.data + this.previousHash + this.timestamp);

        return hash.digest('hex');
    }

    /**
     * @param {number} nonce
     */
    setNonce(nonce) {
        this.nonce = nonce;
    }

    /**
     * @param {string} data
     */
    setData(data) {
        this.data = data;
    }

    setHash(hash) {
        this.hash = hash;
    }

    getHash() {
        return this.hash;
    }

    mine() {
        this.timestamp = Date.now();

        let hash = this.createHash();

        // this is a very simple condition to calculate a proof for this block. In a real blockchain, this is a very complex calculation.
        while (!hash.startsWith('0000')) {
            this.nonce++;
            hash = this.createHash();
        }

        return hash;
    }

    checkProof() {
        return !this.hash.startsWith('0000');
    }
}

export default Block;