const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
},
{
    timestamps: true,
}
);

userSchema.pre('save', function (next) {
    const user = this;

    // Hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    argon2.hash(user.password)
        .then(hash => {
            user.password = hash;
            next();
        })
        .catch(err => {
            next(err);
        });
});

userSchema.methods.comparePassword = function (candidatePassword) {
    const user = this;

    return argon2.verify(user.password, candidatePassword)
        .then(isMatch => {
            return isMatch;
        })
        .catch(err => {
            throw new Error('Password comparison failed');
        });
};

userSchema.index({userSchema : 'text'});

const User = mongoose.model('User', userSchema);
module.exports = User;
