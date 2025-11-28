/**
 * @openapi
 * /api/contributions/group/{groupId}:
 *   get:
 *     summary: List contributions for a group
 *     tags:
 *       - Contributions
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
 *         description: List of contributions
 *
 * /api/contributions/{contributionId}/pay:
 *   post:
 *     summary: Mark a contribution as paid
 *     tags:
 *       - Contributions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contributionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contribution paid
 */
const express = require('express');
const kcAuth = require('../middlewares/kcAuth');
const requireVerified = require('../middlewares/requireVerified');
const { listByGroup, payContribution } = require('../controllers/contributionController');

const router = express.Router();

router.use(kcAuth, requireVerified);

router.get('/group/:groupId', listByGroup);
router.post('/:contributionId/pay', payContribution);

module.exports = router;
