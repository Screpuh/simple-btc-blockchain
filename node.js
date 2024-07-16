// This is the node class that can be seen as a peer in a peer to peer network
// In basic it will be a peer that can connect to other peers.
// Later we will add the functionality to mine blocks and add them to the blockchain

import {WebSocketServer, WebSocket} from 'ws';

class Node {
    // construct the node with a port
    constructor(id, port) {
        this.id = id;
        this.port = port;
        this.peers = new Map();
        this.server = new WebSocketServer({port: this.port});
        // keep array of connected peers ws server addresses
        this.serverAddresses = [];

        // if someone connects to the server, set up the connection
        this.server.on('connection', (ws, req) => {
            this.setUpConnection(ws, req);
        });

        console.log(`Node:${this.id} is running on port ` + this.port);
    }

    setUpConnection(ws, req) {
        console.log(`Node:${this.id} connection with ${req.socket.remoteAddress}:${req.socket.remotePort}`);
        const id = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
        this.peers.set(id, ws);

        ws.on('message', (message) => {
            this.handleMessage(message, ws, id);
        });

        ws.on('close', () => {
            console.log(`Node:${this.id} connection with ${id} closed`);
            this.removePeer(id);
        });

        ws.on('error', (error) => {
            console.log(`Node:${this.id} error: ${error}`);
        });

        // Send a handshake message with this peer's address
        const handshakeMessage = JSON.stringify({ type: 'handshake', address: id, from: `ws://localhost:${this.port}`} );
        ws.send(handshakeMessage);
    }

    connectToPeer(address) {
        console.log(`Node:${this.id} connecting to ${address}`);
        // check if address is already in the list of server addresses
        if (this.serverAddresses.includes(address)) {
            console.log(`Node:${this.id} connection already exists`);
            return;
        } else {
            this.serverAddresses.push(address);
        }

        const ws = new WebSocket(address);
        
        ws.on('open', () => {
            console.log(`Node:${this.id} Connected to peer: ${address}`);
            
            // Send a handshake message with this peer's address
            const handshakeMessage = JSON.stringify({ type: 'handshake-back', address: `ws://localhost:${this.port}`, from: `ws://localhost:${this.port}` });
            ws.send(handshakeMessage);

        });

        ws.on('message', (message) => {
            this.handleMessage(message, ws, address);
        });
    
        ws.on('close', () => {
            const id = `${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
            
            // here we get the peers from the map and remove the peer with the address
            // dont know if this is the best way to do it
            let peerKey = [...this.peers].find(([key, value]) => value === ws);
            if (peerKey !== undefined) {
                let key = peerKey[0];
                this.peers.delete(key);
            }

            // remove from server addresses array
            this.serverAddresses = this.serverAddresses.filter((item) => item !== address);
        });

        ws.on('error', (error) => {
            console.log(`Node:${this.id} error: ${error}`);
        });
    }

    handleMessage(message, ws, id) {
        const data = JSON.parse(message);
        if (data.type === 'handshake') {
            // when we receive a handshake message, add the peer to the list of peers
            this.peers.set(data.address, ws);
        } else if (data.type === 'handshake-back') {
            // when we receive a handshake-back message, add the server address to the list of server addresses
            this.serverAddresses.push(data.address);            
        } else {
          console.log(`Node ${this.id} - Received message from ${id}: ${message}`);
        }
      }

    // return a list of all peers (keys)
    getAllPeers() {
        return this.peers.keys();
    }

    removePeer(id) {
        this.peers.delete(id);
    }

    broadcastMessage(message) {
        this.peers.forEach((ws, id) => {
            // send a json message
            ws.send(JSON.stringify(message));
            console.log(`Sent message to ${id}: ${message}`);
        });
    }

    close() {
       // Close all peer connections
        this.peers.forEach((ws, id) => {
            ws.close();
            console.log(`Closed connection with peer: ${id}`);
        });
    
        // Clear the peers map
        this.peers.clear();
    
        // Close the WebSocket server
        this.server.close((err) => {
            if (err) {
            console.error('Error closing WebSocket server:', err);
            } else {
            console.log(`WebSocket server on ws://localhost:${this.port} closed`);
            }
        });

        this.serverAddresses = [];
    }

}

const node1 = new Node(1, 8000);
const node2 = new Node(2, 8001);

node2.connectToPeer('ws://localhost:8000');

await new Promise(r => setTimeout(r, 3000));

node1.connectToPeer('ws://localhost:8001');

await new Promise(r => setTimeout(r, 3000));

const node3 = new Node(3, 8002);

node3.connectToPeer('ws://localhost:8000');

await new Promise(r => setTimeout(r, 3000));


console.log(node1.getAllPeers());
console.log(node2.getAllPeers());
console.log(node3.getAllPeers());

await new Promise(r => setTimeout(r, 2000));

node1.broadcastMessage('Hello from node1');

await new Promise(r => setTimeout(r, 2000));

node3.broadcastMessage('Hello from node2');

await new Promise(r => setTimeout(r, 2000));

//node2.close();
node2.close();

await new Promise(r => setTimeout(r, 2000));

console.log(node1.getAllPeers());
console.log(node2.getAllPeers());
console.log(node3.getAllPeers());


// const node3 = new Node(3, 8002);

// node3.connectToPeer('ws://localhost:8000');


// await new Promise(r => setTimeout(r, 2000));

// node1.broadcastMessage('Hello from node1');

// //node2.broadcastMessage('Hello from node2');



// while (true) {
//     await new Promise(r => setTimeout(r, 5000));
//     console.log(node1.getAllPeers());
//     console.log(node1.getAllConnections());
// }

// console.log(node1.getAllPeers());
// console.log(node1.getAllConnections());

// console.log(node2.getAllPeers());
// console.log(node2.getAllConnections());

// const node3 = new Node(3, 8002);

// node3.connectToPeer('ws://localhost:8000');

// await new Promise(r => setTimeout(r, 2000));

// console.log(node1.getAllPeers());
// console.log(node1.getAllConnections());

// console.log(node2.getAllPeers());
// console.log(node2.getAllConnections());

// console.log(node3.getAllPeers());
// console.log(node3.getAllConnections());


// console.log(node3.getAllPeers());
// console.log(node3.getAllConnections());

// while (true) {
//     await new Promise(r => setTimeout(r, 1000));
//     console.log(node1.getAllPeers());
// }

// node1.broadcastMessage('Hello from node1');

// await new Promise(r => setTimeout(r, 2000));

// node2.broadcastMessage('Hello from node2');

