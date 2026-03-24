sed -i '/import { Login } from/d' App.tsx
sed -i 's/return <Login \/>;/return <div className="flex h-screen items-center justify-center bg-red-100 text-red-700 font-bold text-3xl">SISTEMA DE LOGIN DESACTIVADO TEMPORALMENTE (SABOTAJE) <\/div>;/' App.tsx
