
"use client"

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';// Asegúrate de tener react-router-dom instalado
import bcrypt from 'bcryptjs';
import { toast,Toaster } from 'sonner'; // o el sistema de notificaciones que uses
import { supabase } from  "@/components/supabaseclient/supabaseclient" // o tu instancia ya creada
import { useSessionContext } from '@/hooks/SessionContext'; // Asegúrate de que esta ruta sea correcta
// Definición de tipos para las props
interface AuthLoginProps {
  onLogin: (data: { email?: string; wallet?: string; type: 'email' | 'wallet' }) => void;
  onSwitchToRegister: () => void;
}

// Definición de tipos para la ventana con ethereum
interface WindowWithEthereum extends Window {
  ethereum?: {
    request: (args: { method: string }) => Promise<string[]>;
  };
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);
  const router = useRouter();
 const { login } = useSessionContext();
const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!email || !password) {
    toast.error('Por favor ingresa tu email y contraseña');
    return;
  }

  // Buscar usuario por email
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    toast.error('Usuario no encontrado');
    return;
  }

  // Comparar contraseñas
  const isValidPassword = await bcrypt.compare(password, data.password);

  if (!isValidPassword) {
    toast.error('Contraseña incorrecta');
    return;
  }
    sessionStorage.setItem('user', JSON.stringify(data));
    

    login({ name: data.name, email: data.email });
    router.push('/Contracts');
  
};

  const connectMetaMask = async () => {
    setIsConnectingWallet(true);
    try {
      const windowWithEthereum = window as WindowWithEthereum;
      if (windowWithEthereum.ethereum) {
        const accounts = await windowWithEthereum.ethereum.request({ method: 'eth_requestAccounts' });
        onLogin({ wallet: accounts[0], type: 'wallet' });
      } else {
        alert('MetaMask no está instalado');
      }
    } catch (error) {
      console.error('Error conectando MetaMask:', error);
    }
    setIsConnectingWallet(false);
  };


  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Toaster richColors />
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SmartPayEasy</h1>
          <p className="text-gray-600">Contratos inteligentes para tu negocio</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="tu@empresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">o</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/*<button
          onClick={connectMetaMask}
          disabled={isConnectingWallet}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          </svg>
          <span>{isConnectingWallet ? 'Conectando...' : 'Conectar MetaMask'}</span>
        </button>*/}

        <div className="text-center mt-6">
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <a
              href="/Register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLogin;