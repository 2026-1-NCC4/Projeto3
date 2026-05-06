const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', eventosController.getEventos);
router.post('/', eventosController.criarEvento);
router.put('/:id', eventosController.atualizarEvento);
router.delete('/:id', eventosController.deletarEvento);

module.exports = router;