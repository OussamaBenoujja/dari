/**
 * @openapi
 * /api/groups/{groupId}/messages:
 *   post:
 *     summary: Send a message to a group
 *     tags:
 *       - Group Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, audio]
 *     responses:
 *       201:
 *         description: Message sent
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Group not found
 *   get:
 *     summary: List messages for a group
 *     tags:
 *       - Group Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 *       404:
 *         description: Group not found
 */
const express = require('express');
const kcAuth = require('../middlewares/kcAuth');
const requireVerified = require('../middlewares/requireVerified');
const {
	listGroups,
	getGroup,
	createGroup,
	joinGroup,
	removeMember,
	startRound,
	getRoundHistory,
	applyPenalties,
	sendGroupMessage,
	listGroupMessages
} = require('../controllers/groupController');

const router = express.Router();

router.use(kcAuth);

router.post('/:groupId/messages', sendGroupMessage);
router.get('/:groupId/messages', listGroupMessages);
/**
 * @openapi
 * /api/groups:
 *   get:
 *     summary: List all groups
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *   post:
 *     summary: Create a new group
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - contributionAmount
 *             properties:
 *               name:
 *                 type: string
 *               contributionAmount:
 *                 type: number
 *               contributionInterval:
 *                 type: string
 *                 enum: [monthly, weekly]
 *     responses:
 *       201:
 *         description: Group created
 *
 * /api/groups/actions/apply-penalties:
 *   post:
 *     summary: Apply penalties to all groups
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Penalties applied
 *
 * /api/groups/{groupId}:
 *   get:
 *     summary: Get a group by ID
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details
 *
 * /api/groups/{groupId}/join:
 *   post:
 *     summary: Join a group
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined group
 *
 * /api/groups/{groupId}/members/{memberId}:
 *   delete:
 *     summary: Remove a member from a group
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 *
 * /api/groups/{groupId}/start-round:
 *   post:
 *     summary: Start the next payout round
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Round started
 *
 * /api/groups/{groupId}/history:
 *   get:
 *     summary: Get round history for a group
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Round history
 */
router.get('/', listGroups);
router.post('/actions/apply-penalties', requireVerified, applyPenalties);

router.post('/', requireVerified, createGroup);
router.get('/:groupId', getGroup);
router.post('/:groupId/join', requireVerified, joinGroup);
router.delete('/:groupId/members/:memberId', requireVerified, removeMember);
router.post('/:groupId/start-round', requireVerified, startRound);
router.get('/:groupId/history', requireVerified, getRoundHistory);

module.exports = router;
