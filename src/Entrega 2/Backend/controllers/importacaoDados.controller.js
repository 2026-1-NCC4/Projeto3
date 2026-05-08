const importacaoDadosService = require('../services/importacaoDados.service');

function usuarioPodeImportar(req) {
  return req.user && ['admin', 'colaborador'].includes(req.user.role);
}

async function importarArquivo(req, res) {
  try {
    if (!usuarioPodeImportar(req)) {
      return res.status(403).json({
        message: 'Acesso não autorizado para importação de dados.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Nenhum arquivo foi enviado.'
      });
    }

    const { tipoBase = 'generico' } = req.body;

    const resultado = await importacaoDadosService.processarImportacao({
      arquivo: req.file,
      tipoBase,
      usuarioImportadorId: req.user.id
    });

    return res.status(201).json({
      message: 'Arquivo importado e validado com sucesso.',
      data: resultado
    });
  } catch (error) {
    console.error('Erro ao importar arquivo:', error);

    return res.status(500).json({
      message: 'Erro ao importar arquivo.',
      detail: error.message
    });
  }
}

async function listarHistorico(req, res) {
  try {
    if (!usuarioPodeImportar(req)) {
      return res.status(403).json({
        message: 'Acesso não autorizado ao histórico de importações.'
      });
    }

    const historico = await importacaoDadosService.listarHistoricoImportacoes();

    return res.json({
      data: historico
    });
  } catch (error) {
    console.error('Erro ao listar histórico de importações:', error);

    return res.status(500).json({
      message: 'Erro ao listar histórico de importações.',
      detail: error.message
    });
  }
}

module.exports = {
  importarArquivo,
  listarHistorico
};