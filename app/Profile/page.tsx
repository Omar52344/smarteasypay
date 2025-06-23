
"use client"

import React, { useState, FormEvent, use } from 'react';

// Definición de interfaces para los tipos de datos
interface Notifications {
  email: boolean;
  whatsapp: boolean;
  contractExecution: boolean;
  fundUpdates: boolean;
  gasAlerts: boolean;
}

interface UserData {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  whatsapp?: string;
  wallet?: string;
  notifications?: Notifications;
}

interface UserProfileProps {
  user: UserData;
  onUpdateProfile: (data: UserData) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<UserData>({
    name: user.name || '',
    email: user.email || '',
    company: user.company || '',
    phone: user.phone || '',
    whatsapp: user.whatsapp || '',
    notifications: {
      email: true,
      whatsapp: true,
      contractExecution: true,
      fundUpdates: true,
      gasAlerts: true
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationChange = (key: keyof Notifications) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications as Notifications,
        [key]: !(formData.notifications as Notifications)[key]
      }
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      company: user.company || '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      notifications: user.notifications || {
        email: true,
        whatsapp: true,
        contractExecution: true,
        fundUpdates: true,
        gasAlerts: true
      }
    });
    setIsEditing(false);
  };

  // El resto del componente permanece igual
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Perfil de Usuario</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Editar Perfil
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Información Personal</h3>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* El resto del formulario permanece igual */}
                {/* ... */}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            ) : (
              // El resto del componente permanece igual
              // ...
              <div className="space-y-4">
                {/* ... */}
              </div>
            )}
          </div>

          {/* El resto del componente permanece igual */}
          {/* ... */}
        </div>

        {/* El resto del componente permanece igual */}
        {/* ... */}
      </div>
    </div>
  );
};

export default UserProfile;