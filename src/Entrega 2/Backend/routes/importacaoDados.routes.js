const express = require('express');
const multer = require('multer');

const authMiddleware = require('../middlewares/auth.middleware');
const importacaoDadosController = require('../controllers/importacaoDados.controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const tiposPermitidos = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const nomeArquivo = file.originalname.toLowerCase();

    const extensaoValida =
      nomeArquivo.endsWith('.csv') ||
      nomeArquivo.endsWith('.xlsx') ||
      nomeArquivo.endsWith('.xls');

    if (!tiposPermitidos.includes(file.mimetype) && !extensaoValida) {
      return callback(new Error('Formato inválido. Envie um arquivo CSV, XLS ou XLSX.'));
    }

    return callback(null, true);
  }
});

router.post(
  '/',
  authMiddleware,
  upload.single('arquivo'),
  importacaoDadosController.importarArquivo
);

router.get(
  '/historico',
  authMiddleware,
  importacaoDadosController.listarHistorico
);

module.exports = router;