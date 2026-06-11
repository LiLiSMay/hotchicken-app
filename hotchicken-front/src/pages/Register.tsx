import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Utensils, UserPlus, Eye,
    EyeOff, ArrowLeft, RefreshCw
} from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();

    // Estados de los datos del usuario
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState({
        label: 'Vacía', color: 'bg-gray-200', width: '0%'
    });

    // Estados del CAPTCHA obligatorios
    const [captcha, setCaptcha] = useState('');
    const [userCaptcha, setUserCaptcha] = useState('');
    //Funciones y Lógica de Validación
    // Generador aleatorio de CAPTCHA
    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptcha(result);
    };

    useEffect(() => { generateCaptcha(); }, []);

    // Medidor visual para la fuerza de clave
    useEffect(() => {
        if (password.length === 0) {
            setStrength({ label: 'Vacía', color: 'bg-gray-200', width: '0%' });
        } else if (password.length < 6) {
            setStrength({ label: 'Débil', color: '#EF4444', width: '33%' });
        } else if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.length >= 8) {
            setStrength({ label: 'Fuerte', color: '#22C55E', width: '100%' });
        } else {
            setStrength({ label: 'Intermedia', color: '#FACC15', width: '66%' });
        }
    }, [password]);

    // Envío del formulario al backend de NestJS
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (userCaptcha.toUpperCase() !== captcha) {
            alert("El código de seguridad no coincide.");
            generateCaptcha();
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/v1/auth/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombreCompleto: nombreCompleto,
                    username: username,
                    password: password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("¡Solicitud enviada! Espera aprobación del administrador.");
                navigate('/');
            } else {
                alert(data.message || "No se pudo procesar el registro.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error al conectar con el servidor.");
        }
    };
    //Diseño e Interfaz Visual (HTML/JSX)
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-t-8" style={{ borderTopColor: '#FACC15' }}>
                <div className="p-8">
                    <button onClick={() => navigate('/')} className="text-gray-400 hover:text-hot-red flex items-center gap-1 mb-4 text-[10px] font-black uppercase tracking-widest transition-colors">
                        <ArrowLeft size={14} /> Volver al Inicio
                    </button>

                    <div className="flex flex-col items-center mb-8">
                        <div className="p-3 rounded-full mb-3" style={{ backgroundColor: '#E11D48' }}>
                            <Utensils className="text-white" size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 leading-none">REGISTRARSE</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">HotChicken Team</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleRegister}>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nombre Completo</label>
                            <input required type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-hot-yellow font-bold text-slate-700" placeholder="Ej. Juan Perez" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Usuario Deseado</label>
                            <input required type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-hot-yellow font-bold text-slate-700" placeholder="Ej. jperez_01" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Crear Contraseña</label>
                            <div className="relative">
                                <input required type={showPassword ? "text" : "password"} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-hot-yellow font-bold text-slate-700" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <div className="mt-3 px-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black uppercase text-gray-400">Seguridad: {strength.label}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-500" style={{ width: strength.width, backgroundColor: strength.color }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-100 space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase block text-center">Código de Seguridad</label>
                            <div className="flex items-center justify-center gap-4">
                                <div className="bg-white px-5 py-2 rounded-xl border-2 border-dashed border-hot-red text-hot-red font-black tracking-[0.4em] italic text-xl select-none shadow-sm">{captcha}</div>
                                <button type="button" onClick={generateCaptcha} className="text-slate-300 hover:text-hot-red transition-colors">
                                    <RefreshCw size={22} />
                                </button>
                            </div>
                            <input required type="text" placeholder="Repite el código" className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-center font-black uppercase tracking-widest outline-none focus:border-hot-yellow text-slate-700" value={userCaptcha} onChange={(e) => setUserCaptcha(e.target.value)} />
                        </div>

                        <button type="submit" className="w-full py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4" style={{ backgroundColor: '#E11D48', color: 'white' }}>
                            <UserPlus size={24} /> SOLICITAR ACCESO
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
