const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const conexao = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'violetaflow'
});

conexao.connect(erro => {
  if (erro) {
    console.error('❌ Erro ao conectar com o banco de dados:', erro.message);
    return;
  }
  console.log('✅ Conexão com o banco de dados MySQL realizada com sucesso!');
  console.log('📊 Banco: violetaflow');
});

const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    conexao.query(sql, values, (error, results) => {
      if (error) {
        console.error('❌ Erro na query:', error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// EXPORTAR AMBOS - ISSO NÃO QUEBRA O LOGIN
module.exports = { conexao, query };