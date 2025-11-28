const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema(
   {
	   first_Name: { type: String, required: true, trim: true },
	   last_Name: { type: String, required: true, trim: true },
	   email: { type: String, required: true, unique: true, lowercase: true, trim: true },
	   adress: { type: String, minlength: 6, trim: true },
	   password: { type: String, required: true, minlength: 6, select: false },
	   role: { type: String, enum: ['user', 'admin'], default: 'user' },
	   isActive: { type: Boolean, default: true },
	   activeGroup: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
	   outstandingContributionCount: { type: Number, default: 0 },
	   verification_type: { type: String, enum: ['passport', 'driving license', 'national ID card'] },
	   verification_id: { type: String },
	   isVerified: { type: Boolean, default: false },
	   verify_card_Image: { type: String },
	   verificationSelfie: { type: String },
	   stripeAccountId: { type: String },
	   stripeOnboarded: { type: Boolean, default: false }
   },
	{ timestamps: true }
);

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (err) {
		next(err);
	}
});

userSchema.methods.comparePassword = function (plain) {
	return bcrypt.compare(plain, this.password);
};

userSchema.statics.findByEmail = function (email, includePassword) {
	var q = this.findOne({ email: email });
	if (includePassword) {
		return q.select('+password');
	}
	return q;
};

userSchema.set('toJSON', {
	transform: function (doc, ret) {
		delete ret.password;
		delete ret.__v;
		return ret;
	}
});

module.exports = mongoose.model('User', userSchema);

