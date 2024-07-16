// This is a btc full-node class that can be seen as a peer in a peer to peer network
// It basically is a very simple peer to peer network where nodes can connect/disconnect to/from the network.
// When a node connects to another node, it sends a handshake message back. This way we can establish a two way connection.
// When a node receives a broadcast message, it will broadcast the message to all other nodes in the network.

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
        this.messageIds = [];

        // if someone connects to the server, set up the connection
        this.server.on('connection', (ws, req) => {
            this.setUpConnection(ws, req);
        });

        console.log(`Node:${this.id} is running on port ` + this.port);
    }

    // This function handles incomming connections to the node. It sets up event listeners to communicate with nodes that connected to us.
    setUpConnection(ws, req) {
        console.log(`Node:${this.id} connection with ${req.socket.remoteAddress}:${req.socket.remotePort}`);
        const id = `${req.socket.remoteAddress}:${req.socket.remotePort}`;

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

        // When a peer connects to us, we send him a handshake message.
        // maybe we can randomly send a list of peers to the new peer from our own list of peers.
        const handshakeMessage = JSON.stringify({ type: 'handshake', address: id, from: `ws://localhost:${this.port}`} );
        ws.send(handshakeMessage);

        // And add the peer to the list of peers
        this.peers.set(id, ws);
    }

    // This function initiates outbound connections to other nodes. It sets up event listeners to communicate with target nodes.
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
            
            // Send a handshake-back message to the peer that we try to connect to
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
            // This is where a peer receives the handshake message when it tries to connect to another peer
            // when we receive a handshake message, we add the peer to the list of peers
            this.peers.set(data.address, ws);
        } else if (data.type === 'handshake-back') {
            // when we receive a handshake-back message, add the server address to the list of server addresses
            // when a two way connection is established, we can send messages to the peer.
            // maybe next step we send a copy from the blockchain
            this.serverAddresses.push(data.address);            
        } else if (data.type === 'broadcast') {
            // when we receive a broadcast message, check if we have already received this message
            // if not, broadcast it to all peers
            if (!this.isIdInMessageIds(data.id)) {
                console.log(`Node ${this.id} - Received broadcast message from ${data.from}: ${data.message}`);

                this.addMessageId(data.id);
                this.broadcastMessage(data.id, data.message);
            }
        } else {
          console.log(`Node ${this.id} - Received message from ${id}: ${message}`);
        }
      }

    // Broadcast a message to all peers which will be send to all peers. This will make sure the message gets send to all the nodes in the network.
    // Modes need to keep track of messages they already received to prevent infinite loops. 
    broadcastMessage(id, message) {
        // if i'm sending this message and the id is not in the list of message ids, add it. I'm probably the initiator of the message
        if (!this.isIdInMessageIds(id)) {
            this.addMessageId(id);
        }

        const broadcastMessage = JSON.stringify({
            id: id,
            type: 'broadcast',
            from: `ws://localhost:${this.port}`,
            message: message,
        });

        console.log(`Node ${this.id} - Broadcasting message: ${message}`);

        this.peers.forEach((ws) => {
            // broadcast to every one. client will check if it has already received the message
            ws.send(broadcastMessage);
        });
    }

    // return a list of all peers (keys)
    getAllPeers() {
        return this.peers.keys();
    }

    removePeer(id) {
        this.peers.delete(id);
    }

    addMessageId(id) {
        this.messageIds.push(id);

        // I think we only need to keep the last 50 message ids for this project
        if (this.messageIds.length > 50) {
            this.messageIds.shift();
        }
    }

    isIdInMessageIds(id) {
        return this.messageIds.includes(id);
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