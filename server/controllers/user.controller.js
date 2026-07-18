const userService = require('../services/user.service');
const { signToken } = require('../middleware/auth');

async function register(req, res, next) {
  try {
    const { phone, name } = req.body;
    const user = await userService.findOrCreateUser({ phone, name });
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function myTontines(req, res, next) {
  try {
    const tontines = await userService.getUserTontines(req.user.id);
    res.json(tontines);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, myTontines };
