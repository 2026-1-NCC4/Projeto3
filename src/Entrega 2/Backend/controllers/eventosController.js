const { query } = require('../config/database');

const getEventos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    
    const eventos = await query(
      `SELECT id, titulo, data, horario 
       FROM eventos 
       WHERE usuario_id = ? 
       ORDER BY data ASC, horario ASC`,
      [usuarioId]
    );

    res.json({
      success: true,
      eventos
    });

  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar eventos'
    });
  }
};

const criarEvento = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { titulo, data, horario } = req.body;

    if (!titulo || !data) {
      return res.status(400).json({
        success: false,
        message: 'Título e data são obrigatórios'
      });
    }

    const result = await query(
      `INSERT INTO eventos (usuario_id, titulo, data, horario) 
       VALUES (?, ?, ?, ?)`,
      [usuarioId, titulo, data, horario || null]
    );

    res.status(201).json({
      success: true,
      message: 'Evento criado com sucesso!',
      evento: {
        id: result.insertId,
        titulo,
        data,
        horario: horario || ''
      }
    });

  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar evento'
    });
  }
};

const atualizarEvento = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;
    const { titulo, data, horario } = req.body;

    await query(
      'UPDATE eventos SET titulo = ?, data = ?, horario = ? WHERE id = ? AND usuario_id = ?',
      [titulo, data, horario || null, id, usuarioId]
    );

    res.json({
      success: true,
      message: 'Evento atualizado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar evento'
    });
  }
};

const deletarEvento = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    await query(
      'DELETE FROM eventos WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );

    res.json({
      success: true,
      message: 'Evento excluído com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar evento'
    });
  }
};

module.exports = {
  getEventos,
  criarEvento,
  atualizarEvento,
  deletarEvento
};