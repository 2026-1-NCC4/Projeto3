import React, { useState } from 'react';
import CampoInput from './CampoInput';
import { api } from '../../services/api';

const CardCadastro = ({ mudarTela }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [tipoCadastro, setTipoCadastro] = useState('colaborador');
  const [cnpj, setCnpj] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [codigoConvite, setCodigoConvite] = useState('');
  const [loading, setLoading] = useState(false);

  const validarCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/[^\d]+/g, '');

    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    let tamanho = 12;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += Number(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== Number(digitos.charAt(0))) return false;

    tamanho = 13;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += Number(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== Number(digitos.charAt(1))) return false;

    return true;
  };

  const formatarCNPJ = (valor) => {
    valor = valor.replace(/\D/g, '');
    if (valor.length <= 2) return valor;
    if (valor.length <= 5) return valor.replace(/(\d{2})(\d)/, '$1.$2');
    if (valor.length <= 8) return valor.replace(/(\d{2})(\d{3})(\d)/, '$1.$2.$3');
    if (valor.length <= 12) return valor.replace(/(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3/$4');
    return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d)/, '$1.$2.$3/$4-$5');
  };

  const validarSenhaForte = (senha) => {
    const regex = {
      maiuscula: /[A-Z]/,
      minuscula: /[a-z]/,
      numero: /[0-9]/,
      especial: /[!@#$%^&*(),.?":{}|<>]/,
      tamanho: senha.length >= 8
    };

    const erros = [];

    if (!regex.tamanho) erros.push('pelo menos 8 caracteres');
    if (!regex.maiuscula.test(senha)) erros.push('uma letra maiúscula');
    if (!regex.minuscula.test(senha)) erros.push('uma letra minúscula');
    if (!regex.numero.test(senha)) erros.push('um número');
    if (!regex.especial.test(senha)) erros.push('um caractere especial (!@#$%^&*)');

    return {
      valido: erros.length === 0,
      erros
    };
  };

  const limparFormulario = () => {
    setNome('');
    setEmail('');
    setSenha('');
    setConfirmarSenha('');
    setCnpj('');
    setNomeEmpresa('');
    setCodigoConvite('');
  };

  const cadastrarColaborador = async () => {
    if (nome.trim() === '') {
      setMensagem({ texto: 'Digite seu nome completo', tipo: 'erro' });
      return;
    }

    if (!codigoConvite.trim()) {
      setMensagem({ texto: 'Digite o código recebido por e-mail', tipo: 'erro' });
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setMensagem({ texto: 'Digite um e-mail válido', tipo: 'erro' });
      return;
    }

    const validacaoSenha = validarSenhaForte(senha);

    if (!validacaoSenha.valido) {
      const mensagemErro = `Senha fraca: ${validacaoSenha.erros.join(', ')}`;
      setMensagem({ texto: mensagemErro, tipo: 'erro' });
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem({ texto: 'As senhas não coincidem', tipo: 'erro' });
      return;
    }

    try {
      setLoading(true);
      setMensagem({ texto: '', tipo: '' });

      await api.post('/auth/register/staff-invite', {
        name: nome,
        email,
        inviteCode: codigoConvite,
        password: senha
      });

      setMensagem({
        texto: 'Colaborador Cannoli cadastrado com sucesso! Você já pode fazer login.',
        tipo: 'sucesso'
      });

      limparFormulario();

      setTimeout(() => {
        mudarTela('login');
      }, 1500);
    } catch (error) {
      setMensagem({
        texto: error.message || 'Erro ao cadastrar colaborador.',
        tipo: 'erro'
      });
    } finally {
      setLoading(false);
    }
  };

  const cadastrarEmpresa = async () => {
    if (nomeEmpresa.trim() === '') {
      setMensagem({ texto: 'Digite o nome da empresa', tipo: 'erro' });
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setMensagem({ texto: 'Digite um e-mail válido', tipo: 'erro' });
      return;
    }

    if (!cnpj.trim()) {
      setMensagem({ texto: 'Digite o CNPJ da empresa', tipo: 'erro' });
      return;
    }

    if (!validarCNPJ(cnpj)) {
      setMensagem({ texto: 'CNPJ inválido', tipo: 'erro' });
      return;
    }

    const validacaoSenha = validarSenhaForte(senha);

    if (!validacaoSenha.valido) {
      const mensagemErro = `Senha fraca: ${validacaoSenha.erros.join(', ')}`;
      setMensagem({ texto: mensagemErro, tipo: 'erro' });
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem({ texto: 'As senhas não coincidem', tipo: 'erro' });
      return;
    }

    try {
      setLoading(true);
      setMensagem({ texto: '', tipo: '' });

      await api.post('/auth/register/company', {
        name: nomeEmpresa,
        cnpj: cnpj.replace(/\D/g, ''),
        email,
        password: senha
      });

      setMensagem({
        texto: 'Empresa cadastrada com sucesso! Você já pode fazer login.',
        tipo: 'sucesso'
      });

      limparFormulario();

      setTimeout(() => {
        mudarTela('login');
      }, 1500);
    } catch (error) {
      setMensagem({
        texto: error.message || 'Erro ao cadastrar empresa.',
        tipo: 'erro'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tipoCadastro === 'colaborador') {
      await cadastrarColaborador();
      return;
    }

    await cadastrarEmpresa();
  };

  return (
    <div className="w-full max-w-[400px] animate-fade-up">
      <h1 className="font-playfair text-3xl font-bold">
        Criar Conta
      </h1>

      <p className="text-sm mt-3 mb-6">
        Escolha o tipo de cadastro
      </p>

      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            setTipoCadastro('colaborador');
            setCnpj('');
            setNomeEmpresa('');
            setMensagem({ texto: '', tipo: '' });
          }}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            tipoCadastro === 'colaborador'
              ? 'bg-orange text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Colaborador
        </button>

        <button
          type="button"
          onClick={() => {
            setTipoCadastro('empresa');
            setCodigoConvite('');
            setNome('');
            setMensagem({ texto: '', tipo: '' });
          }}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            tipoCadastro === 'empresa'
              ? 'bg-orange text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Empresa
        </button>
      </div>

      {mensagem.texto && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          mensagem.tipo === 'erro'
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {tipoCadastro === 'colaborador' ? (
          <>
            <CampoInput
              tipo="text"
              placeholder="Nome completo"
              icone="user"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading}
            />

            <CampoInput
              tipo="text"
              placeholder="Código recebido por e-mail"
              icone="id"
              value={codigoConvite}
              onChange={(e) => setCodigoConvite(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              disabled={loading}
            />
          </>
        ) : (
          <>
            <CampoInput
              tipo="text"
              placeholder="Nome da empresa"
              icone="building"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              disabled={loading}
            />

            <CampoInput
              tipo="text"
              placeholder="CNPJ"
              icone="file"
              value={cnpj}
              onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
              maxLength={18}
              disabled={loading}
            />
          </>
        )}

        <CampoInput
          tipo="email"
          placeholder="E-mail"
          icone="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <CampoInput
          tipo="password"
          placeholder="Senha"
          icone="lock"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          disabled={loading}
        />

        {senha.length > 0 && (
          <div className="mb-4">
            <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
              <div className={`flex-1 ${senha.length >= 8 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className={`flex-1 ${/[A-Z]/.test(senha) ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className={`flex-1 ${/[a-z]/.test(senha) ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className={`flex-1 ${/[0-9]/.test(senha) ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className={`flex-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(senha) ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Senha forte: 8+ caracteres, maiúscula, minúscula, número e caractere especial
            </p>
          </div>
        )}

        <CampoInput
          tipo="password"
          placeholder="Confirmar senha"
          icone="lock"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-7 py-3 bg-orange text-white rounded-lg font-medium transition-all duration-200 ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-dark hover:shadow-md'
          }`}
        >
          {loading
            ? 'Processando...'
            : tipoCadastro === 'empresa'
              ? 'Cadastrar Empresa'
              : 'Cadastrar Colaborador'
          }
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-500">
        Já tem conta?{' '}
        <span
          onClick={() => !loading && mudarTela('login')}
          className="text-orange cursor-pointer hover:underline font-medium"
        >
          Entrar
        </span>
      </p>
    </div>
  );
};

export default CardCadastro;