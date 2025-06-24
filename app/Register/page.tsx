
"use client"

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { supabase } from "@/components/supabaseclient/supabaseclient"
import { toast, Toaster } from "sonner"
import bcrypt from 'bcryptjs';
// Definición de interfaces para los tipos
interface FormDataType {
  name: string;
  email: string;
  company: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface AuthRegisterProps {
  onRegister: (data: FormDataType) => void;
  onSwitchToLogin: () => void;
}

const AuthRegister: React.FC<AuthRegisterProps> = ({  onSwitchToLogin }) => {
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    email: '',
    company: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    onRegister(formData);
  };

async function onRegister(data: FormDataType) {
  try {
    // Verificar si ya existe un usuario con ese email
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users') // Asegúrate que el nombre de tu tabla sea correcto
      .select('id')
      .eq('email', data.email);

    if (fetchError) {
      console.error('Error al consultar usuario:', fetchError.message);
      toast.error("Error al consultar el usuario.");
      return;
    }

    if (existingUsers && existingUsers.length > 0) {
      toast.error("El correo ya está registrado.");
      return;
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    // Si no existe, insertar nuevo usuario
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        name: data.name,
        email: data.email,
        empresa: data.company,
        whatsapp: data.phone,
        password: hashedPassword, // ⚠️ Solo si estás en desarrollo. Nunca almacenes contraseñas en texto plano.
        created_at: new Date().toISOString(),
      }]);

    if (insertError) {
      console.error('Error al insertar:', insertError.message);
      toast.error("Error al registrar el usuario.");
      return;
    }

    toast.success("Registro exitoso.");
  } catch (err) {
    console.error('Error inesperado:', err);
    toast.error("Error inesperado al registrar.");
  }
}

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Toaster richColors />
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Cuenta</h1>
          <p className="text-gray-600">Únete a SmartPayEasy</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="juan@empresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Mi Empresa SAS"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="+57 300 123 4567"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-6"
          >
            Crear Cuenta
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <a
              href="/Login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Inicia Sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthRegister;