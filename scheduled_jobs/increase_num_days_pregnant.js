var User = require('../db/User.js');

var qy = User.where({has_subscribed: true, pregnant: true});
qy.find(function(err, users){
	if (err){
		console.log("Error finding users shady man");
	}
	else{
		if (users && users.length > 0){
			users.forEach(function(user){
				var oldVal = user.num_days_pregnant;
				user.num_days_pregnant += 1; 
 
				user.save();
				console.log("Increasing user " + user.phone_number + " num days pregnant from " + oldVal + " to " + user.num_days_pregnant);
			});
		}
		else console.log("No pregnant users to increase pregnancy of.");
	}
});
