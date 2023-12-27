const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        name : {
            type : String,
            required : [true, 'We need a name to call you, Please provide your name.'],
        },
        email : {
            type : String,
            required : [true, 'Please provide your email.'],
            unique : true,
            lowercase : true,
            validate : [validator.isEmail, 'Please provide a valid email.']
        },
        photo : String, 
        role : {
            type : String,
            enum : ['user', 'guide', 'lead-guide', 'admin'],
            default : 'user'
        },
        password : {
            type : String,
           required : [true, 'Please provide your password!!'],
           minlength : 8,
           select : false
        },
        passwordConfirm : {
           type : String,
           required : [true, 'Please confirm your password!!'],
           validate : {
            //this will only work on CREATE and on SAVE(i.e updating the database)
            validator: function(el) {
                return el === this.password
            },
            message : 'Passwords are not the same!!'
           }
        },
        passwordChangedAt: Date,
        passwordResetToken : String,
        PasswordResetTokenExpires : Date,
        active : {
            type : Boolean,
            default : true,
            select : false
        }
    }
);

userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew){
        return next();
    }

    this.passwordChangedAt = Date.now() - 1000; //this was just to make sure that password changed at property isn't set
    //after the token has been sent, because it's a data base intensive task and it takes more time then sending token to the user
    //that's why we have subtracted 1000 seconds from the same.
    next();
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    

    //encrypt the password with the cost of 12, where cost represents, how much cpu intensive our hashing is going to
    //look like
    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;

    next();
});

userSchema.pre(/^find/, function(next){
    this.find({active : {$ne : false}});
    next();
})



userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
  ) {
    return await bcrypt.compare(candidatePassword, userPassword);
  };


userSchema.methods.changedPasswordAfterToken = function(JWTTimeStamp) {
    if(this.passwordChangedAt){
        const changedTime = parseInt(this.passwordChangedAt.getTime()/1000, 10);
        return JWTTimeStamp < changedTime;

    }
    //false means not changed.
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
  
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
  
    console.log({ resetToken }, this.passwordResetToken);
  
    this.PasswordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  
    return resetToken;
  };
  

const User = mongoose.model('User', userSchema); //Model name should always start with a capital letter.
module.exports = User;