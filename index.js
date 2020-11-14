'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketio = require('socket.io');
const request = require('request');
require('dotenv').config();
const SocketControllerBootstrap = require('./utils/SocketControllerBootstrap');
const ConnectionService = require('./services/ConnectionService');

class Server
{

    constructor() {
        this.port = process.env.PORT || 3000;
        this.host = process.env.HOST || `localhost`;

        this.app = express();
        this.http = http.Server(this.app);
        this.socket = socketio(this.http);
    }

    async appRun() {

        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use(bodyParser.json());

        this.app.use(function (req, res, next) {

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            res.setHeader('Access-Control-Allow-Credentials', true);

            next();
        });

        await ConnectionService.resetConnections();

        this.app.get('/test_get', async (req, res) => {
            res.send('test_get_response');
        });

        this.app.post('/test_post', async (req, res) => {
            let params = req.body;

            res.send('success, post-data: ' + params.postData);
        });

        let io = this.socket;

        this.socket.on('connection', (socket) => {

            SocketControllerBootstrap.bootstrap(io, socket);

            socket.on('disconnect', () => {
                console.log('hot reload disconnect', socket.id);
            });

            // socket.on('user_connect', async (data) => {
            //     console.log('Connect user:', data);
            // });
            socket.on('send_be_signal', async (data) => {

                var clientServerOptions = {
                    uri: 'http://ago.api/api/v1/be_signal',
                    body: JSON.stringify({postData: 'signal2'}),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

                request(clientServerOptions, function (error, response) {
                    socket.emit('send_be_signal_response', response.body);
                });

            });
        });

        this.http.listen(this.port, this.host, () => {
            console.log(`Listening on http://${this.host}:${this.port}`);
        });
    }
}

console.log('START SERVER -----------------------------');

const app = new Server();
app.appRun();