import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Download,
  Image as ImageIcon,
  ZoomIn,
  Trash2
} from 'lucide-react';
import { PostagemRecord } from '../types';

interface RecordDetailModalProps {
  record: PostagemRecord | null;
  onClose: () => void;
  onEdit?: (record: PostagemRecord) => void;
  onDelete?: (record: PostagemRecord) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onEdit,
  onDelete
}) => {
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (record.status) {
      case 'Conferido':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Pendente':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Divergência':
      case 'Avaria':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-zinc-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-black text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="bg-[#FF4F00] p-1.5 sm:p-2 rounded-xl text-black font-black text-xs sm:text-sm shrink-0">
              #{record.protocolo_os_nf || 'S/N'}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span className="truncate">Protocolo de Recebimento</span>
                <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full border font-bold ${getStatusBadge()}`}>
                  {record.status}
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400 truncate">
                {record.ano} - ID: {record.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <span className="text-xs text-zinc-500 font-bold uppercase block flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#FF4F00]" /> Gráfica / Fornecedor
              </span>
              <span className="text-sm font-black text-zinc-900 mt-1 block">
                {record.grafica || 'NÃO INFORMADA'}
              </span>
            </div>

            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <span className="text-xs text-zinc-500 font-bold uppercase block flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF4F00]" /> Cliente
              </span>
              <span className="text-sm font-black text-zinc-900 mt-1 block">
                {record.cliente || 'NÃO INFORMADO'}
              </span>
            </div>

            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <span className="text-xs text-zinc-500 font-bold uppercase block flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#4E18FF]" /> Campanha
              </span>
              <span className="text-sm font-bold text-zinc-900 mt-1 block">
                {record.campanha || 'SEM NOME'}
              </span>
            </div>

            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <span className="text-xs text-zinc-500 font-bold uppercase block flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#FF4F00]" /> Quantidade de Cartazes
              </span>
              <span className="text-2xl font-black text-[#FF4F00] mt-0.5 block">
                {record.quantidade.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-600">peças</span>
              </span>
            </div>

            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <span className="text-xs text-zinc-500 font-bold uppercase block flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-600" /> Motivos / Layouts
              </span>
              <span className="text-lg font-bold text-zinc-900 mt-1 block">
                {record.layout || 1} {record.layout === 1 ? 'modelo' : 'modelos'}
              </span>
            </div>

            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <span className="text-xs text-zinc-500 font-bold uppercase block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-600" /> Data & Horário
              </span>
              <span className="text-sm font-bold text-zinc-900 mt-1 block">
                {record.data ? record.data.split('-').reverse().join('/') : 'Data s/ reg.'}
                {record.hora && ` às ${record.hora}`}
              </span>
            </div>
          </div>

          {/* Checklist Status box */}
          <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200">
            <h3 className="text-xs font-black uppercase text-zinc-700 mb-3 tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FF4F00]" /> Checklist de Conferência no Galpão
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold ${
                  record.conferido_qtd ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  ?
                </div>
                <span className="text-zinc-700">Qtd confere c/ NF</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold ${
                  record.conferido_avaria ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  ?
                </div>
                <span className="text-zinc-700">Sem avarias físicas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold ${
                  record.conferido_canhoto ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  ?
                </div>
                <span className="text-zinc-700">Canhoto assinado</span>
              </div>
            </div>

            {record.observacoes && (
              <div className="mt-3 pt-3 border-t border-orange-200/60 text-xs text-zinc-700">
                <span className="font-bold">Observações: </span>
                <span>{record.observacoes}</span>
              </div>
            )}
          </div>

          {/* Photos Section */}
          <div>
            <h3 className="text-xs font-black uppercase text-zinc-700 mb-3 tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#FF4F00]" /> Comprovantes e Fotos Anexadas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo NF */}
              <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50 text-center">
                <span className="text-xs font-bold text-zinc-600 block mb-2">Foto da NF / Declaração</span>
                {record.foto_nf ? (
                  <div 
                    className="relative group cursor-pointer overflow-hidden rounded-lg border border-zinc-300 h-48 bg-black flex items-center justify-center"
                    onClick={() => setZoomImage(record.foto_nf!)}
                  >
                    <img 
                      src={record.foto_nf} 
                      alt="Foto NF" 
                      className="max-h-full max-w-full object-contain" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs gap-1">
                      <ZoomIn className="w-4 h-4" /> Clique para ampliar
                    </div>
                  </div>
                ) : (
                  <div className="h-32 border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center text-zinc-400 text-xs">
                    <FileText className="w-6 h-6 mb-1 text-zinc-300" />
                    <span>Nenhuma foto de NF anexada</span>
                  </div>
                )}
              </div>

              {/* Photo Poster */}
              <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50 text-center">
                <span className="text-xs font-bold text-zinc-600 block mb-2">Foto do Cartaz / Material</span>
                {record.foto_cartaz ? (
                  <div 
                    className="relative group cursor-pointer overflow-hidden rounded-lg border border-zinc-300 h-48 bg-black flex items-center justify-center"
                    onClick={() => setZoomImage(record.foto_cartaz!)}
                  >
                    <img 
                      src={record.foto_cartaz} 
                      alt="Foto Cartaz" 
                      className="max-h-full max-w-full object-contain" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs gap-1">
                      <ZoomIn className="w-4 h-4" /> Clique para ampliar
                    </div>
                  </div>
                ) : (
                  <div className="h-32 border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center text-zinc-400 text-xs">
                    <ImageIcon className="w-6 h-6 mb-1 text-zinc-300" />
                    <span>Nenhuma foto de cartaz anexada</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-100 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-4 h-4" /> Imprimir Comprovante
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(record);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Excluir Checklist
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(record);
                }}
                className="px-4 py-2 bg-[#FF4F00] hover:bg-[#e04500] text-black rounded-xl text-xs font-extrabold transition-colors"
              >
                Editar Registro
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-bold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full"
            onClick={() => setZoomImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={zoomImage} 
            alt="Zoom" 
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}
    </div>
  );
};
