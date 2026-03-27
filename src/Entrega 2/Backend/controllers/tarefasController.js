const { query } = require('../config/database');

// Buscar todas as tarefas do usuário
const getTarefas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    
    const tarefas = await query(
      `SELECT id, titulo, horario, descricao, status 
       FROM tarefas 
       WHERE usuario_id = ? 
       ORDER BY created_at DESC`,
      [usuarioId]
    );

    const tarefasOrganizadas = {
      fazer: [],
      andamento: [],
      concluido: []
    };

    tarefas.forEach(tarefa => {
      tarefasOrganizadas[tarefa.status].push({
        id: tarefa.id,
        titulo: tarefa.titulo,
        horario: tarefa.horario || '',
        descricao: tarefa.descricao || ''
      });
    });

    res.json({
      success: true,
      tarefas: tarefasOrganizadas
    });

  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tarefas'
    });
  }
};

// Criar nova tarefa
const criarTarefa = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { titulo, horario, descricao } = req.body;

    if (!titulo) {
      return res.status(400).json({
        success: false,
        message: 'Título é obrigatório'
      });
    }

    const result = await query(
      `INSERT INTO tarefas (usuario_id, titulo, horario, descricao, status) 
       VALUES (?, ?, ?, ?, 'fazer')`,
      [usuarioId, titulo, horario || null, descricao || null]
    );

    res.status(201).json({
      success: true,
      message: 'Tarefa criada com sucesso!',
      tarefa: {
        id: result.insertId,
        titulo,
        horario: horario || '',
        descricao: descricao || '',
        status: 'fazer'
      }
    });

  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tarefa'
    });
  }
};

// Atualizar tarefa
const atualizarTarefa = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;
    const { titulo, horario, descricao } = req.body;

    await query(
      'UPDATE tarefas SET titulo = ?, horario = ?, descricao = ? WHERE id = ? AND usuario_id = ?',
      [titulo, horario || null, descricao || null, id, usuarioId]
    );

    res.json({
      success: true,
      message: 'Tarefa atualizada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar tarefa'
    });
  }
};

// Mover tarefa entre colunas
const moverTarefa = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;
    const { novoStatus } = req.body;

    const statusValidos = ['fazer', 'andamento', 'concluido'];
    if (!statusValidos.includes(novoStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      });
    }

    await query(
      'UPDATE tarefas SET status = ? WHERE id = ? AND usuario_id = ?',
      [novoStatus, id, usuarioId]
    );

    res.json({
      success: true,
      message: 'Tarefa movida com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao mover tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao mover tarefa'
    });
  }
};

// Deletar tarefa
const deletarTarefa = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    await query(
      'DELETE FROM tarefas WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );

    res.json({
      success: true,
      message: 'Tarefa excluída com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar tarefa'
    });
  }
};

module.exports = {
  getTarefas,
  criarTarefa,
  atualizarTarefa,
  moverTarefa,
  deletarTarefa
};