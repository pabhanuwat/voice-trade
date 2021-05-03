const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	apiKey: {
		type: String
	},
	apiSecret: {
		type: String,
	},
});

module.exports = mongoose.model("User", userSchema);
