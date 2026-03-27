const express = require('express');
const router = express.Router();
const tarefasController = require('../controllers/tarefasController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

router.get('/', tarefasController.getTarefas);
router.post('/', tarefasController.criarTarefa);
router.put('/:id', tarefasController.atualizarTarefa);
router.patch('/:id/mover', tarefasController.moverTarefa);
router.delete('/:id', tarefasController.deletarTarefa);

module.exports = router;