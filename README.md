Gran parte de las ocaciones que tenemos que realizar una REST Api en Node utilizamos Express (que realmente funciona excelentemente).
Pero en el día de hoy les presento otro framework denominado Restify y su uso:

### Instalación
```bash
npm i restify
npm i restify-errors
npm i restify-jwt-community

npm i mongoose
npm i mongoose-timestamp

npm i bcryptjs
npm i jsonwebtoken
```

### Estructura del proyecto
```bash
├───models/
│   └───users.js
├───routes/
│   └───users.js
├───auth.js
├───config.js
├───index.js
├───package.json
```

### Creación de auth.js
```javascript
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = mongoose.model('User');

exports.authenticate = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await User.findOne({
                email
            });

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (!isMatch) throw 'la pass no coincide';
                resolve(user);
            });
        } catch (err) {
            reject('Autenticacion Fallida');
        }
    });
};
```

### Creación de config.js
```javascript
module.exports = {
  ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  URL: process.env.BASE_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/jwt',
  JWT_SECRET: process.env.JWT_SECRET || 'palabraSecreta'
};
```

### Armado de models/user.js
```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
```

### Creación de routes/user.js
```javascript
const errors = require('restify-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const auth = require('../auth');
const config = require('../config');

module.exports = server => {
    server.post('/register', (req, res, next) => {
        if (req.body === undefined) {
            return next(new errors.InvalidArgumentError());
        }

        const {
            email,
            password
        } = req.body;

        const user = new User({
            email,
            password
        });

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, async (err, hash) => {
                user.password = hash;

                try {
                    const newUser = await user.save();
                    res.send(201);
                    next();
                } catch (err) {
                    return next(new errors.InternalError(err.message));
                }
            });
        });
    });

    server.post('/auth', async (req, res, next) => {
        if (req.body === undefined) {
            return next(new errors.InvalidArgumentError());
        }

        const {
            email,
            password
        } = req.body;

        try {
            const user = await auth.authenticate(email, password);

            const token = jwt.sign(user.toJSON(), config.JWT_SECRET, {
                expiresIn: '15m'
            });

            const {
                iat,
                exp
            } = jwt.decode(token);

            res.send({
                iat,
                exp,
                token
            });

            next();
        } catch (err) {
            return next(new errors.UnauthorizedError(err));
        }
    });
};
```

### Finalmente creamos en el root index.js
```javascript
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
```

### Probando la aplicación
> Recordar tener ejecutándose mongo.exe

```bash
node index.js
```
