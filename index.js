const restify = require('restify');
const mongoose = require('mongoose');
const config = require('./config');
const rjwt = require('restify-jwt-community');

const server = restify.createServer();

server.use(restify.plugins.bodyParser());

server.listen(config.PORT, () => {
    mongoose.set('useFindAndModify', false);
    mongoose.set('useUnifiedTopology', true);
    mongoose.connect(
        config.MONGODB_URI, {
            useNewUrlParser: true
        }
    );
});

const db = mongoose.connection;

db.on('error', err => console.log(err));

db.once('open', () => {
    require('./routes/users')(server);
    console.log(`Server ejecutandose en port ${config.PORT}`);
});