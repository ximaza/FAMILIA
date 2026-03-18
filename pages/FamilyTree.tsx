import React from 'react';
import { ExternalLink, TreeDeciduous } from 'lucide-react';

export const FamilyTree: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      <div className="p-8 bg-family-100 rounded-full">
        <TreeDeciduous size={80} className="text-family-700" />
      </div>
      
      <div className="max-w-xl">
        <h2 className="text-3xl font-serif font-bold text-family-900 mb-4">Árbol Genealógico en Geneanet</h2>
        <p className="text-slate-600 text-lg mb-8">
          Mantenemos nuestro árbol genealógico completo en la plataforma Geneanet para asegurar la precisión y permitir la colaboración detallada.
        </p>
        
        <a 
          href="https://gw.geneanet.org/ximaza?lang=es&n=mazarrasa+jorganes&oc=0&p=juan+manuel&type=tree"
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-family-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-family-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <span>Acceder al Árbol</span>
          <ExternalLink size={20} />
        </a>
        <p className="mt-4 text-sm text-slate-500">
            Se abrirá en una nueva pestaña.
        </p>
      </div>
    </div>
  );
};