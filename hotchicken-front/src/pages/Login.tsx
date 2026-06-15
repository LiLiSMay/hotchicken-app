import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, ShieldCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();

    // ESTADOS: Para controlar los inputs del formulario
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [captcha, setCaptcha] = useState('');
    const [userCaptcha, setUserCaptcha] = useState('');

    // Generar un CAPTCHA aleatorio (Requisito Docente)
    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        setCaptcha(result);
    };

    useEffect(() => { generateCaptcha(); }, []);

    // MANEJADOR: Controla el acceso al sistema conectado a la Base de Datos Real
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validamos el CAPTCHA (Seguridad obligatoria del docente)
        if (userCaptcha.toUpperCase() !== captcha) {
            alert("Captcha incorrecto. Intenta de nuevo.");
            generateCaptcha();
            setUserCaptcha('');
            return; // Detiene la ejecución si el captcha está mal
        }

        // 2. CONEXIÓN REAL: Enviamos los datos al backend de NestJS
        try {
            const response = await fetch('https://hotchicken-backend.onrender.com/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: usuario, // Tu backend espera la propiedad 'username'
                    password: password
                }),
            });

            const data = await response.json();

            if (response.ok && data.accessToken) {
                // Guardamos el token de seguridad y los datos del empleado en el navegador
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.usuario));

                // Redirección inteligente según el rol que venga de PostgreSQL
                if (data.usuario.role === 'admin' || data.usuario.rol === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } else {
                // Mensaje detallado del error que devuelva la base de datos (ej: Clave incorrecta)
                alert(data.message || "Usuario o contraseña incorrectos.");
            }

        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor. Verifica que el backend esté encendido.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-t-8 border-hot-red">
                <div className="p-8">
                    {/* Logo HotChicken */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="p-4 rounded-full mb-2" style={{ backgroundColor: '#E11D48' }}>
                            <Utensils className="text-white" size={40} />
                        </div>
                        <h1 className="text-3xl font-black italic" style={{ color: '#E11D48' }}>
                            HOT<span style={{ color: '#FACC15' }}>CHICKEN</span>
                        </h1>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1 text-center">Acceso al Sistema</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Campo Usuario */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Usuario</label>
                            <input
                                required
                                type="text"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-hot-yellow transition-all font-bold text-slate-700"
                                placeholder="Nombre de usuario"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                            />
                        </div>

                        {/* Campo Contraseña */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Contraseña</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-hot-yellow transition-all font-bold text-slate-700"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Sección CAPTCHA (Cumple requisito de seguridad) */}
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block text-center">Verificación de Seguridad</label>
                            <div className="flex items-center justify-center gap-4 mb-3">
                                <div className="bg-white px-4 py-2 rounded-lg border-2 border-dashed border-hot-red text-hot-red font-black tracking-[0.5em] italic text-xl select-none shadow-sm">
                                    {captcha}
                                </div>
                                <button type="button" onClick={generateCaptcha} className="text-gray-400 hover:text-hot-red transition-colors">
                                    <RefreshCw size={20} />
                                </button>
                            </div>
                            <input
                                required
                                type="text"
                                placeholder="Escribe el código"
                                className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-center font-black uppercase tracking-widest outline-none focus:border-hot-yellow text-slate-700"
                                value={userCaptcha}
                                onChange={(e) => setUserCaptcha(e.target.value)}
                            />
                        </div>

                        {/* Botón de Ingreso */}
                        <button type="submit" className="w-full py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2" style={{ backgroundColor: '#FACC15', color: '#0f172a' }}>
                            <ShieldCheck size={24} /> INGRESAR AHORA
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t-2 border-slate-50 pt-6">
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">¿Eres nuevo empleado?</p>
                        <button
                            onClick={() => navigate('/register')}
                            className="mt-2 text-hot-red font-black text-sm uppercase hover:underline transition-all"
                        >
                            Solicita tu registro aquí
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
