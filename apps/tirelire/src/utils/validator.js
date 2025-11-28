function isNonEmptyString(value){
	if(typeof value !== 'string'){
		return false;
	}
	return value.trim().length > 0;
}

function isValidEmail(email){
	if(!isNonEmptyString(email)){
		return false;
	}
	const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return pattern.test(email.trim().toLowerCase());
}

function isValidPassword(password){
	if(typeof password !== 'string'){
		return false;
	}
	return password.length >= 6;
}

function validateLoginInputs(email, password){
	const errors = {};
	if(!isValidEmail(email)){
		errors.email = 'Email is not valid';
	}
	if(!isValidPassword(password)){
		errors.password = 'Password must be at least 6 characters';
	}
	return errors;
}

function validateRegisterInputs(data){
	const errors = {};
	if(!isNonEmptyString(data.first_Name)){
		errors.first_Name = 'First name is required';
	}
	if(!isNonEmptyString(data.last_Name)){
		errors.last_Name = 'Last name is required';
	}
	if(!isNonEmptyString(data.adress)){
		errors.adress = 'Adress is required';
	}
	if(!isValidEmail(data.email)){
		errors.email = 'Email is not valid';
	}
	if(!isValidPassword(data.password)){
		errors.password = 'Password must be at least 6 characters';
	}
	return errors;
}

function isValidInvitationAction(action){
	if(typeof action !== 'string'){
		return false;
	}
	const value = action.toLowerCase();
	return value === 'accept' || value === 'decline' || value === 'cancel';
}

function validateVerificationInputs(data){
	const errors = {};
	if(!data){
		return { general: 'Payload is required' };
	}
	if(!isNonEmptyString(data.verificationType)){
		errors.verificationType = 'Verification type is required';
	}
	if(!isNonEmptyString(data.idNumber)){
		errors.idNumber = 'ID number is required';
	}
	if(!isNonEmptyString(data.idDocumentPath)){
		errors.idDocumentPath = 'ID document path is required';
	}
	if(!isNonEmptyString(data.selfiePath)){
		errors.selfiePath = 'Selfie path is required';
	}
	return errors;
}

module.exports = {
	isNonEmptyString,
	isValidEmail,
	isValidPassword,
	validateLoginInputs,
	validateRegisterInputs,
	isValidInvitationAction,
	validateVerificationInputs
};
