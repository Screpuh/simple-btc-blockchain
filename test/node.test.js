import { expect } from 'chai';
import Node from '../src/node.js';
import WebSocket from 'ws';

describe('Node Class Tests', function() {
    let node;
    let testPort = 8080;
    let testId = 'TestNode';

    before(function() {
        // Setup code if needed
    });

    after(function() {
        // Cleanup code if needed
    });

    beforeEach(function() {
        // Create a new Node instance before each test
        node = new Node(testId, testPort);
    });

    afterEach(function() {
        // Close the server after each test to free up the port
        node.server.close();
    });

    describe('Constructor', function() {
        it('should initialize with the correct id and port', function() {
            expect(node.id).to.equal(testId);
            expect(node.port).to.equal(testPort);
        });

        it('should initialize an empty peers map', function() {
            expect(node.peers.size).to.equal(0);
        });

        it('should initialize an empty messageIds array', function() {
            expect(node.messageIds.length).to.equal(0);
        });

        it('should initialize an serverAddresses on the right port', function() {
            expect(node.server.address().port).to.equal(testPort);
        });
    });

    describe('setUpConnection', function() {
        it('should add a new peer on connection', function(done) {
            const node2 = new Node(2, 8001);
            node2.connectToPeer(`ws://localhost:${testPort}`);

            // Wait a bit for the server to handle the connection
            setTimeout(() => {                
                expect(node.getAllPeers()).to.deep.equal(node2.getAllPeers());
                node2.close();
                done();
            }, 100);
            
        });
    });

    describe('broadcastMessage', function() {
        it('should broadcast a message to all peers', function(done) {
            const node2 = new Node(2, 8001);
            node2.connectToPeer(`ws://localhost:${testPort}`);

            const node3 = new Node(3, 8002);
            node3.connectToPeer(`ws://localhost:${testPort}`);

            // Wait a bit for the server to handle the connection
            setTimeout(() => {
                const uniqueId = Math.random().toString(36).substring(2);
                node.broadcastMessage(uniqueId, 'Hello World');

                // Wait a bit for the message to be broadcasted
                setTimeout(() => {
                    expect(node.getMessageIds()).to.include(uniqueId);
                    expect(node2.getMessageIds()).to.include(uniqueId);
                    expect(node3.getMessageIds()).to.include(uniqueId);

                    node2.close();
                    node3.close();
                    done();
                }, 100);
            }, 100);
        });
    });

    describe('closePeer', function() {
        it('should remove closed peer from the peers map', function(done) {
            const node2 = new Node(2, 8001);
            node2.connectToPeer(`ws://localhost:${testPort}`);

            // Wait a bit for the server to handle the connection
            setTimeout(() => {
                node2.close();
                setTimeout(() => {
                    console.log(node.getAllPeers());
                    expect(node.peers).to.be.an('map').that.is.empty;;
                    done();
                }, 100);
            }, 100);
        });
    });
});