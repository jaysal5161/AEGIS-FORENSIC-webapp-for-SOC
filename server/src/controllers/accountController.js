const Account = require('../models/Account');

async function getAccounts(req, res, next) {
  try {
    const { status, privilege, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (privilege) query.privilege = privilege;
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { domain: new RegExp(search, 'i') }
      ];
    }

    const accounts = await Account.find(query)
      .populate('associatedAlerts', 'alertId title severity status')
      .sort({ riskScore: -1 });

    res.json(accounts);
  } catch (err) {
    next(err);
  }
}

async function getAccountById(req, res, next) {
  try {
    const account = await Account.findById(req.params.id)
      .populate('associatedAlerts');
    if (!account) return res.status(404).json({ error: 'NotFound', message: 'Account not found' });
    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function updateAccount(req, res, next) {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!account) return res.status(404).json({ error: 'NotFound', message: 'Account not found' });
    res.json(account);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAccounts,
  getAccountById,
  updateAccount
};
