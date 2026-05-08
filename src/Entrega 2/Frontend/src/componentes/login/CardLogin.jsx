import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CampoInput from './CampoInput';
import { api } from '../../services/api';

const CardLogin = ({ mudarTela }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !senha) {
      setMensagem({ texto: 'Preencha todos os campos', tipo: 'erro' });
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setMensagem({ texto: 'Digite um e-mail válido', tipo: 'erro' });
      return;
    }

    try {
      setLoading(true);
      setMensagem({ texto: '', tipo: '' });

      const response = await api.post('/auth/login', {
        email,
        password: senha,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(user));

      setMensagem({
        texto: 'Login realizado com sucesso!',
        tipo: 'sucesso',
      });

      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 800);
    } catch (error) {
      setMensagem({
        texto: error.message || 'E-mail ou senha inválidos',
        tipo: 'erro',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-[340px] animate-fade-up"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Login
      </h1>

      <p className="text-sm mt-3 mb-10 text-gray-500">
        Acesse sua conta para continuar
      </p>

      {mensagem.texto && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            mensagem.tipo === 'erro' 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <CampoInput 
          tipo="email" 
          placeholder="E-mail" 
          icone="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading}
        />
        
        <CampoInput 
          tipo="password" 
          placeholder="Senha" 
          icone="lock"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="text-right mb-6">
          <button
            type="button"
            onClick={() => mudarTela('recuperar-senha')}
            className="text-xs text-orange hover:underline"
            disabled={loading}
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Esqueceu a senha?
          </button>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className={`w-full mt-7 py-3 bg-orange text-white rounded-md font-semibold transition-all
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-dark hover:shadow-md'}
          `}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center mt-5 text-xs text-gray-500">
        Novo por aqui?{' '}
        <span
          onClick={() => !loading && mudarTela('cadastro')}
          className="text-orange cursor-pointer hover:underline font-medium"
        >
          Cadastre-se
        </span>
      </p>
    </div>
  );
};

export default CardLogin;