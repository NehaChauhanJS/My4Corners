var mongoose = require('mongoose');



var user = mongoose.Schema({

    users            : {
        email        : String,
        password     : String
}
});


module.exports = mongoose.model('User', user);
