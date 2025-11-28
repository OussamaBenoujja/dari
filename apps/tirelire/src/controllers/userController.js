const Ticket = require('../models/Ticket');
async function openTicket(req, res) {
	try {
		const userId = req.user && req.user._id;
		if (!userId) return res.status(401).json({ message: 'Not authenticated' });
		const { subject, message } = req.body || {};
		if (!subject || !message) return res.status(400).json({ message: 'Subject and message required' });
		const ticket = new Ticket({ user: userId, subject, message });
		await ticket.save();
		return res.status(201).json(ticket);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function listMyTickets(req, res) {
	try {
		const userId = req.user && req.user._id;
		if (!userId) return res.status(401).json({ message: 'Not authenticated' });
		const tickets = await Ticket.find({ user: userId }).sort({ createdAt: -1 });
		return res.status(200).json(tickets);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function listAllTickets(req, res) {
	try {
		if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
		const tickets = await Ticket.find().populate('user').sort({ createdAt: -1 });
		return res.status(200).json(tickets);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function respondTicket(req, res) {
	try {
		if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
		const { response, status } = req.body || {};
		const ticket = await Ticket.findById(req.params.ticketId);
		if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
		ticket.adminResponse = response || ticket.adminResponse;
		if (status) ticket.status = status;
		await ticket.save();
		return res.status(200).json(ticket);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}
const Notification = require('../models/Notification');
async function listNotifications(req, res) {
	try {
		const userId = req.user && req.user._id;
		if (!userId) return res.status(401).json({ message: 'Not authenticated' });
		const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
		return res.status(200).json(notifications);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function markNotificationsRead(req, res) {
	try {
		const userId = req.user && req.user._id;
		if (!userId) return res.status(401).json({ message: 'Not authenticated' });
		await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
		return res.status(200).json({ message: 'All notifications marked as read' });
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}
const VerificationService = require('../services/VerificationService');
const verificationService = new VerificationService();
async function listManualVerifications(req, res) {
	try {
		const reviewer = req.user;
		if (!reviewer || reviewer.role !== 'admin') {
			return res.status(403).json({ message: 'Admin access required' });
		}
		const requests = await verificationService.listManualQueue();
		return res.status(200).json(requests);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}
async function manualVerificationReview(req, res) {
	try {
		const reviewer = req.user;
		if (!reviewer || reviewer.role !== 'admin') {
			return res.status(403).json({ message: 'Admin access required' });
		}
		const { decision, notes } = req.body || {};
		const requestId = req.params.requestId;
		const result = await userService.manualVerificationDecision(requestId, reviewer._id, decision, notes);
		return res.status(200).json(result);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}
const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');

const authService = new AuthService();
const userService = new UserService();

async function registerUser(req, res){
	try {
		const result = await authService.register(req.body || {});
		return res.status(201).json(result);
	} catch (err) {
		const status = err.details ? 400 : 500;
		return res.status(status).json({ message: err.message, details: err.details || null });
	}
}

async function loginUser(req, res){
	try {
		const { email, password } = req.body || {};
		const result = await authService.login(email, password);
		return res.status(200).json(result);
	} catch (err) {
		const status = err.details ? 400 : 401;
		return res.status(status).json({ message: err.message, details: err.details || null });
	}
}

async function getProfile(req, res){
	try {
		const payload = req.user || {};
		if(!payload){
			return res.status(401).json({ message: 'Not authenticated' });
		}
		const email = payload.email || payload.preferred_username;
		if(!email){
			return res.status(401).json({ message: 'Token missing email/username' });
		}
		let user = await userService.getUserByEmail(email);
		if(!user){
			// quick auto-provision from Keycloak token
			const names = (payload.name || '').split(' ');
			const first = payload.given_name || names[0] || 'user';
			const last = payload.family_name || names.slice(1).join(' ') || 'kc';
			const rnd = Math.random().toString(36).slice(2);
			user = await userService.createUser(first, last, email, 'unknown', rnd, 'user');
		}
		return res.status(200).json(user);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function submitVerification(req, res){
	try {
		const payload = req.user;
		if(!payload || !payload.email){
			return res.status(401).json({ message: 'Not authenticated' });
		}
		const user = await userService.getUserByEmail(payload.email);
		if(!user){
			return res.status(404).json({ message: 'User not found' });
		}
		const request = await userService.submitVerificationRequest(user._id, req.body || {});
		return res.status(201).json(request);
	} catch (err) {
		const status = err.details ? 400 : 500;
		return res.status(status).json({ message: err.message, details: err.details || null });
	}
}

const Stripe = require('stripe');
let stripeClient;

function getStripeClient() {
	if (stripeClient !== undefined) return stripeClient;
	const secret = process.env.STRIPE_SECRET_KEY;
	if (!secret) {
		stripeClient = null;
		return stripeClient;
	}
	stripeClient = new Stripe(secret);
	return stripeClient;
}
const User = require('../models/User');

// Stripe Connect onboarding: create account and return onboarding link
async function stripeOnboard(req, res) {
	try {
		const stripe = getStripeClient();
		if (!stripe) return res.status(503).json({ error: 'Stripe integration not configured' });
		const userId = req.user._id;
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: 'User not found' });

		// Create Stripe account if not exists
		if (!user.stripeAccountId) {
			const account = await stripe.accounts.create({
				type: 'express',
				email: user.email,
			});
			user.stripeAccountId = account.id;
			await user.save();
		}

		// Create account link for onboarding
		const accountLink = await stripe.accountLinks.create({
			account: user.stripeAccountId,
			refresh_url: process.env.STRIPE_REFRESH_URL || 'https://yourapp.com/stripe/refresh',
			return_url: process.env.STRIPE_RETURN_URL || 'https://yourapp.com/stripe/complete',
			type: 'account_onboarding',
		});
		res.json({ url: accountLink.url });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

// Stripe Connect: handle redirect after onboarding
async function stripeComplete(req, res) {
	try {
		const stripe = getStripeClient();
		if (!stripe) return res.status(503).json({ error: 'Stripe integration not configured' });
		const userId = req.user._id;
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: 'User not found' });
		// Optionally, check account status
		const account = await stripe.accounts.retrieve(user.stripeAccountId);
		if (account.details_submitted) {
			user.stripeOnboarded = true;
			await user.save();
			res.json({ success: true, stripeAccountId: user.stripeAccountId });
		} else {
			res.json({ success: false, message: 'Onboarding incomplete' });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

module.exports = {
	 registerUser,
	 loginUser,
	 getProfile,
	 submitVerification
	 ,manualVerificationReview
	 ,listManualVerifications
	 ,listNotifications
	 ,markNotificationsRead
	 ,openTicket
	 ,listMyTickets
	 ,listAllTickets
	 ,respondTicket
	 ,stripeOnboard
	 ,stripeComplete
};
