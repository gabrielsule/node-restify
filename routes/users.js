const errors = require('restify-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const auth = require('../auth');
const config = require('../config');

module.exports = server => {
    server.post('/registro', (req, res, next) => {
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

    server.post('/autorizacion', async (req, res, next) => {
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