import React, { useState } from 'react';
import CampoInput from './CampoInput';
import { api } from '../../services/api';

const CardRecuperarSenha = ({ mudarTela }) => {
  const [etapa, setEtapa] = useState('email');

  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [loading, setLoading] = useState(false);

  const validarEmail = (valor) => {
    return valor.includes('@') && valor.includes('.');
  };

  const validarSenhaForte = (senha) => {
    return (
      senha.length >= 8 &&
      /[A-Z]/.test(senha) &&
      /[a-z]/.test(senha) &&
      /[0-9]/.test(senha) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(senha)
    );
  };

  const solicitarCodigo = async (e) => {
    e.preventDefault();

    if (!email) {
      setMensagem({ texto: 'Digite seu e-mail', tipo: 'erro' });
      return;
    }

    if (!validarEmail(email)) {
      setMensagem({ texto: 'Digite um e-mail válido', tipo: 'erro' });
      return;
    }

    try {
      setLoading(true);
      setMensagem({ texto: '', tipo: '' });

      await api.post('/auth/forgot-password', {
        email,
      });

      setMensagem({
        texto: 'Código enviado. Verifique seu e-mail.',
        tipo: 'sucesso',
      });

      setEtapa('codigo');
    } catch (error) {
      setMensagem({
        texto: error.message || 'Erro ao solicitar recuperação de senha.',
        tipo: 'erro',
      });
    } finally {
      setLoading(false);
    }
  };

  const validarCodigo = (e) => {
    e.preventDefault();

    if (!codigo || codigo.length !== 6) {
      setMensagem({
        texto: 'Digite o código de 6 dígitos.',
        tipo: 'erro',
      });
      return;
    }

    setMensagem({ texto: '', tipo: '' });
    setEtapa('nova-senha');
  };

  const redefinirSenha = async (e) => {
    e.preventDefault();

    if (!validarSenhaForte(novaSenha)) {
      setMensagem({
        texto:
          'A senha deve ter no mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial.',
        tipo: 'erro',
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem({
        texto: 'As senhas não coincidem.',
        tipo: 'erro',
      });
      return;
    }

    try {
      setLoading(true);
      setMensagem({ texto: '', tipo: '' });

      await api.post('/auth/reset-password', {
        email,
        code: codigo,
        newPassword: novaSenha,
      });

      setMensagem({
        texto: 'Senha redefinida com sucesso! Você já pode fazer login.',
        tipo: 'sucesso',
      });

      setTimeout(() => {
        mudarTela('login');
      }, 1800);
    } catch (error) {
      setMensagem({
        texto: error.message || 'Erro ao redefinir senha.',
        tipo: 'erro',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[340px] animate-fade-up">
      <h1 className="font-playfair text-2xl font-bold">
        Recuperar Senha
      </h1>

      <p className="text-sm mt-3 mb-10">
        {etapa === 'email' && 'Digite seu e-mail para receber o código de recuperação'}
        {etapa === 'codigo' && 'Digite o código que você recebeu no e-mail'}
        {etapa === 'nova-senha' && 'Crie uma nova senha para sua conta'}
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

      {etapa === 'email' && (
        <form onSubmit={solicitarCodigo}>
          <CampoInput
            tipo="email"
            placeholder="E-mail cadastrado"
            icone="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-7 py-3 bg-orange text-white rounded-md transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-dark'
            }`}
          >
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      )}

      {etapa === 'codigo' && (
        <form onSubmit={validarCodigo}>
          <CampoInput
            tipo="text"
            placeholder="Código de 6 dígitos"
            icone="id"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-7 py-3 bg-orange text-white rounded-md hover:bg-orange-dark transition-colors"
          >
            Continuar
          </button>
        </form>
      )}

      {etapa === 'nova-senha' && (
        <form onSubmit={redefinirSenha}>
          <CampoInput
            tipo="password"
            placeholder="Nova senha"
            icone="lock"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
          />

          <CampoInput
            tipo="password"
            placeholder="Confirmar nova senha"
            icone="lock"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-7 py-3 bg-orange text-white rounded-md transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-dark'
            }`}
          >
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      )}

      <p className="text-center mt-5 text-xs">
        Lembrou sua senha?{' '}
        <span
          onClick={() => !loading && mudarTela('login')}
          className="text-orange cursor-pointer hover:underline"
        >
          Fazer login
        </span>
      </p>
    </div>
  );
};

export default CardRecuperarSenha;