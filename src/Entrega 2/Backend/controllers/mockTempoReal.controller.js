const mockTempoRealService = require('../services/mockTempoReal.service');

async function gerarPedidos(req, res) {
  try {
    const quantidade = Number(req.body.quantidade || 2);

    const resultado = await mockTempoRealService.gerarPedidos({
      quantidade
    });

    return res.status(201).json({
      message: 'Pedidos simulados gerados com sucesso.',
      data: resultado
    });
  } catch (error) {
    console.error('Erro ao gerar pedidos simulados:', error);

    return res.status(500).json({
      message: error.message || 'Erro ao gerar pedidos simulados.'
    });
  }
}

async function atualizarDados(req, res) {
  try {
    const { direcao, quantidade, percentualAjuste } = req.body;

    const resultado = await mockTempoRealService.atualizarDados({
      direcao,
      quantidade,
      percentualAjuste
    });

    let message = 'Dados simulados atualizados com sucesso.';

    if (resultado.direcao === 'aumentar') {
      message = 'Dados simulados aumentados com sucesso.';
    }

    if (resultado.direcao === 'diminuir') {
      message = resultado.quantidadeAfetada > 0
        ? 'Dados simulados reduzidos com sucesso.'
        : 'Não havia pedidos disponíveis para reduzir.';
    }

    return res.status(200).json({
      message,
      data: resultado
    });
  } catch (error) {
    console.error('Erro ao atualizar dados simulados:', error);

    return res.status(500).json({
      message: error.message || 'Erro ao atualizar dados simulados.'
    });
  }
}

module.exports = {
  gerarPedidos,
  atualizarDados
};