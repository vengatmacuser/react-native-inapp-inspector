#!/usr/bin/env node

const { startStandaloneServer } = require('../dist/commonjs/metro');

const port = parseInt(process.env.PORT || process.argv[2] || '8083', 10);
startStandaloneServer(port);
