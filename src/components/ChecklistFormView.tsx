import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  RotateCcw, 
  Save, 
  PlusCircle, 
  Building2, 
  User, 
  Layers, 
  Hash, 
  Calendar, 
  Clock, 
  FileText, 
  Image as ImageIcon,
  Sparkles,
  Eye,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PostagemRecord, RecordStatus } from '../types';
import { dbService } from '../services/db';

interface ChecklistFormViewProps {
  existingRecords: PostagemRecord[];
  onRecordSaved: (record: PostagemRecord) => void;
  editingRecord?: PostagemRecord | null;
  onCancelEdit?: () => void;
  onViewDailyReport?: () => void;
  onDeleteRecord?: (record: PostagemRecord) => void;
  onSelectRecord?: (record: PostagemRecord) => void;
  onEditRecord?: (record: PostagemRecord) => void;
}

const COMMON_GRAFICAS = [
  'ZOOM IMAGEM',
  'MPV7',
  'IDENTFIX',
  'NEOBAND',
  'M2',
  'M2FLEX',
  'SEVEN',
  'P+E',
  'MAVIMIX',
  'DANFE',
  'CROMO VISUAL',
  'COLLORINDO'
];

const COMMON_CLIENTES = [
  'ELETROMIDIA',
  'AMBEV',
  'ARTPLAN',
  'BANCO DO BRASIL',
  'BRADESCO',
  'CLARO',
  'ESTACIO',
  'FMU',
  'HEINEKEN',
  'IFOOD',
  'ITAÚ',
  'KROTON',
  'MERCADO LIVRE',
  'OTIMA',
  'PAIM',
  'PARIS FILMES',
  'SANTANDER',
  'SENAC',
  'TIM',
  'UBER',
  'VIVO'
];

export const ChecklistFormView: React.FC<ChecklistFormViewProps> = ({
  existingRecords,
  onRecordSaved,
  editingRecord,
  onCancelEdit,
  onViewDailyReport,
  onDeleteRecord,
  onSelectRecord,
  onEditRecord
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().substring(0, 5);

  const todayRecords = useMemo(() => {
    return existingRecords
      .filter((r) => r.data === todayStr)
      .sort((a, b) => (b.hora || '').localeCompare(a.hora || ''));
  }, [existingRecords, todayStr]);

  const [grafica, setGrafica] = useState<string>('');
  const [cliente, setCliente] = useState<string>('');
  const [campanha, setCampanha] = useState<string>('');
  const [protocolo, setProtocolo] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('1');
  const [layout, setLayout] = useState<string>('1');
  const [dataRecebimento, setDataRecebimento] = useState<string>(todayStr);
  const [horaRecebimento, setHoraRecebimento] = useState<string>(nowTimeStr);
  const [status, setStatus] = useState<RecordStatus>('Conferido');
  const [observacoes, setObservacoes] = useState<string>('');

  // Physical checklist checks
  const [conferidoQtd, setConferidoQtd] = useState<boolean>(true);
  const [conferidoAvaria, setConferidoAvaria] = useState<boolean>(true);
  const [conferidoCanhoto, setConferidoCanhoto] = useState<boolean>(true);

  // Photos
  const [fotoNf, setFotoNf] = useState<string>('');
  const [fotoCartaz, setFotoCartaz] = useState<string>('');

  // Duplicate alert
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const nfInputRef = useRef<HTMLInputElement>(null);
  const cartazInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingRecord) {
      setGrafica(editingRecord.grafica || '');
      setCliente(editingRecord.cliente || '');
      setCampanha(editingRecord.campanha || '');
      setProtocolo(editingRecord.protocolo_os_nf || '');
      setQuantidade(String(editingRecord.quantidade || '1'));
      setLayout(String(editingRecord.layout || '1'));
      setDataRecebimento(editingRecord.data || todayStr);
      setHoraRecebimento(editingRecord.hora || nowTimeStr);
      setStatus(editingRecord.status || 'Conferido');
      setObservacoes(editingRecord.observacoes || '');
      setConferidoQtd(editingRecord.conferido_qtd ?? true);
      setConferidoAvaria(editingRecord.conferido_avaria ?? true);
      setConferidoCanhoto(editingRecord.conferido_canhoto ?? true);
      setFotoNf(editingRecord.foto_nf || '');
      setFotoCartaz(editingRecord.foto_cartaz || '');
    }
  }, [editingRecord]);

  // Check duplicate protocol
  useEffect(() => {
    if (protocolo.trim().length >= 3 && !editingRecord) {
      const found = existingRecords.find(
        (r) => r.protocolo_os_nf.toLowerCase() === protocolo.trim().toLowerCase()
      );
      if (found) {
        setDuplicateWarning(`Atenção: OS/Protocolo #${found.protocolo_os_nf} já foi cadastrado para ${found.cliente || 'outro cliente'} em ${found.data}!`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [protocolo, existingRecords, editingRecord]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'nf' | 'cartaz') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (target === 'nf') setFotoNf(base64);
      else setFotoCartaz(base64);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setGrafica('');
    setCliente('');
    setCampanha('');
    setProtocolo('');
    setQuantidade('1');
    setLayout('1');
    setDataRecebimento(todayStr);
    setHoraRecebimento(new Date().toTimeString().substring(0, 5));
    setStatus('Conferido');
    setObservacoes('');
    setConferidoQtd(true);
    setConferidoAvaria(true);
    setConferidoCanhoto(true);
    setFotoNf('');
    setFotoCartaz('');
    setDuplicateWarning(null);
  };

  const handleSubmit = async (e: React.FormEvent, stayOnForm = false) => {
    e.preventDefault();

    if (!protocolo.trim() && !campanha.trim()) {
      alert('Por favor, informe ao menos o Número da OS/Protocolo ou o Nome da Campanha.');
      return;
    }

    const qNum = parseInt(quantidade.replace(/[^0-9]/g, '') || '0', 10);
    const lNum = parseInt(layout.replace(/[^0-9]/g, '') || '1', 10);
    const year = dataRecebimento ? dataRecebimento.split('-')[0] : String(new Date().getFullYear());

    const recordPayload = {
      ano: year,
      cliente: cliente.trim().toUpperCase(),
      campanha: campanha.trim().toUpperCase(),
      grafica: grafica.trim().toUpperCase(),
      layout: lNum,
      quantidade: qNum,
      quantidade_raw: String(qNum),
      protocolo_os_nf: protocolo.trim(),
      data: dataRecebimento,
      hora: horaRecebimento,
      foto_nf: fotoNf,
      foto_cartaz: fotoCartaz,
      status,
      observacoes: observacoes.trim(),
      conferido_qtd: conferidoQtd,
      conferido_avaria: conferidoAvaria,
      conferido_canhoto: conferidoCanhoto
    };

    let savedRecord: PostagemRecord;
    if (editingRecord) {
      savedRecord = await dbService.updateRecord({
        ...editingRecord,
        ...recordPayload
      });
      setSuccessToast(`Protocolo #${savedRecord.protocolo_os_nf} atualizado com sucesso!`);
    } else {
      savedRecord = await dbService.addRecord(recordPayload);
      setSuccessToast(`Recebimento #${savedRecord.protocolo_os_nf || savedRecord.campanha} cadastrado com sucesso!`);
      // Trigger confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#FF4F00', '#FECC14', '#4E18FF', '#3D7700']
        });
      } catch (err) {}
    }

    onRecordSaved(savedRecord);

    if (stayOnForm) {
      resetForm();
      setTimeout(() => setSuccessToast(null), 4000);
    } else {
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#000000] text-white rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-[#FF4F00] text-black rounded-xl font-black shrink-0">
            <ClipboardCheck className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
              {editingRecord ? 'Editar Protocolo de Recebimento' : 'Checklist Diário de Recebimento'}
              {!editingRecord && (
                <span className="bg-[#FECC14] text-black text-[10px] sm:text-[11px] font-black uppercase px-2 py-0.5 rounded-full">
                  Galpão
                </span>
              )}
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-400">
              Conferência física de notas, declarações de transporte e cartazes de abrigos de ônibus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          {onViewDailyReport && (
            <button
              type="button"
              onClick={onViewDailyReport}
              className="px-3 sm:px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#FECC14]" />
              <span>Ver Relatório de Hoje</span>
            </button>
          )}

          {editingRecord && onDeleteRecord && (
            <button
              type="button"
              onClick={() => onDeleteRecord(editingRecord)}
              className="px-3 sm:px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Checklist</span>
            </button>
          )}

          {editingRecord && onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl"
            >
              Cancelar Edição
            </button>
          )}
        </div>
      </div>

      {/* Success alert */}
      {successToast && (
        <div className="bg-emerald-600 text-white p-3.5 sm:p-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Duplicate warning */}
      {duplicateWarning && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 p-3.5 sm:p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 sm:space-y-6">
        {/* Card 1: Fornecedor e Identificação da NF */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#FF4F00]" /> 1. Origem & Dados Fiscais
            </h2>
            <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">Campos da Declaração / NF</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Gráfica */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Gráfica / Fornecedor *
              </label>
              <input
                type="text"
                list="graficas-list"
                required
                placeholder="Ex: ZOOM IMAGEM, MPV7..."
                value={grafica}
                onChange={(e) => setGrafica(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#FF4F00] focus:bg-white transition-colors"
              />
              <datalist id="graficas-list">
                {COMMON_GRAFICAS.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            {/* Protocolo / OS / NF */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Nº Protocolo / OS / NF *
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: 18843 ou 48785"
                  value={protocolo}
                  onChange={(e) => setProtocolo(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-black text-[#FF4F00] focus:outline-none focus:border-[#FF4F00] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Cliente / Exibidora *
              </label>
              <input
                type="text"
                list="clientes-list"
                required
                placeholder="Ex: ELETROMIDIA, AMBEV..."
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#FF4F00] focus:bg-white transition-colors"
              />
              <datalist id="clientes-list">
                {COMMON_CLIENTES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Campanha */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Título da Campanha / Produto *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: BALK CLÍNICA, VERÃO CORONA..."
                value={campanha}
                onChange={(e) => setCampanha(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#FF4F00] focus:bg-white transition-colors"
              />
            </div>

            {/* Quantidade de Cartazes */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Quantidade Total (Cartazes) *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-black text-zinc-900 focus:outline-none focus:border-[#FF4F00] focus:bg-white transition-colors"
              />
            </div>

            {/* Layouts / Motivos */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Qtd de Motivos / Layouts
              </label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#FF4F00] focus:bg-white"
              >
                <option value="1">1 Motivo (Padrão)</option>
                <option value="2">2 Motivos</option>
                <option value="3">3 Motivos</option>
                <option value="4">4 Motivos</option>
                <option value="5">5+ Motivos</option>
              </select>
            </div>

            {/* Data de Recebimento */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Data do Recebimento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="date"
                  required
                  value={dataRecebimento}
                  onChange={(e) => setDataRecebimento(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#FF4F00] focus:bg-white"
                />
              </div>
            </div>

            {/* Hora de Recebimento */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Hora do Recebimento *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="time"
                  required
                  value={horaRecebimento}
                  onChange={(e) => setHoraRecebimento(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#FF4F00] focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Fotos & Comprovantes */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#4E18FF]" /> 2. Registro Fotográfico (Câmera ou Upload)
            </h2>
            <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">Anexo de comprovantes digitais</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Foto NF */}
            <div className="border border-zinc-200 rounded-xl p-3 sm:p-4 bg-zinc-50 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-zinc-700 block mb-2">Foto da NF / Declaração</span>
              
              {fotoNf ? (
                <div className="relative group w-full h-44 rounded-lg overflow-hidden border border-zinc-300 bg-black flex items-center justify-center">
                  <img src={fotoNf} alt="NF" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setFotoNf('')}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-44 border-2 border-dashed border-zinc-300 hover:border-[#FF4F00] rounded-xl flex flex-col items-center justify-center p-4 transition-colors">
                  <Camera className="w-8 h-8 text-zinc-400 mb-2" />
                  <p className="text-xs text-zinc-600 font-bold mb-3">Fotografar NF ou Canhoto</p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => nfInputRef.current?.click()}
                      className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
                    >
                      <Upload className="w-3.5 h-3.5" /> Selecionar Foto
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={nfInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, 'nf')}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Foto Cartaz */}
            <div className="border border-zinc-200 rounded-xl p-3 sm:p-4 bg-zinc-50 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-zinc-700 block mb-2">Foto do Cartaz / Pacote</span>
              
              {fotoCartaz ? (
                <div className="relative group w-full h-44 rounded-lg overflow-hidden border border-zinc-300 bg-black flex items-center justify-center">
                  <img src={fotoCartaz} alt="Cartaz" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setFotoCartaz('')}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-44 border-2 border-dashed border-zinc-300 hover:border-[#FF4F00] rounded-xl flex flex-col items-center justify-center p-4 transition-colors">
                  <ImageIcon className="w-8 h-8 text-zinc-400 mb-2" />
                  <p className="text-xs text-zinc-600 font-bold mb-3">Fotografar Material / Pacote</p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cartazInputRef.current?.click()}
                      className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
                    >
                      <Upload className="w-3.5 h-3.5" /> Selecionar Foto
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={cartazInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, 'cartaz')}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="bg-zinc-900 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl border border-zinc-800">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold transition-colors w-full sm:w-auto justify-center sm:justify-start"
          >
            <RotateCcw className="w-4 h-4" /> Limpar Formulário
          </button>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap justify-end">
            {editingRecord && onDeleteRecord && (
              <button
                type="button"
                onClick={() => onDeleteRecord(editingRecord)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm shadow-md transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            )}

            {!editingRecord && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-[#FECC14] hover:bg-amber-400 text-black font-extrabold px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm shadow-md transition-transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4" /> Salvar & Novo
              </button>
            )}

            <button
              type="submit"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-[#FF4F00] hover:bg-[#e04500] text-black font-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-600/30 transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" /> {editingRecord ? 'Salvar Alterações' : 'Concluir'}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de Checklists Realizados Hoje */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#FF4F00]" /> Checklists Realizados Hoje ({todayRecords.length})
            </h2>
            <p className="text-xs text-zinc-400">
              Histórico dos materiais conferidos hoje. Você pode visualizar, editar ou excluir lançamentos.
            </p>
          </div>
          {onViewDailyReport && (
            <button
              type="button"
              onClick={onViewDailyReport}
              className="text-xs font-bold text-[#FF4F00] hover:underline"
            >
              Ver Relatório Completo →
            </button>
          )}
        </div>

        {todayRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 font-medium">
            Nenhum checklist registrado hoje ainda. Os novos registros aparecerão aqui.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {todayRecords.map((rec) => (
              <div
                key={rec.id}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-zinc-50/80 px-2 rounded-xl transition-colors"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-[#FF4F00] bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 shrink-0">
                    #{rec.protocolo_os_nf || 'S/N'}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs text-zinc-900 truncate">{rec.campanha}</span>
                      <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rec.hora || '--:--'}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      <span className="font-semibold text-zinc-700">{rec.cliente}</span> • <span>Gráfica: {rec.grafica}</span> • <span className="font-bold text-zinc-800">{rec.quantidade} peças</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  {onSelectRecord && (
                    <button
                      type="button"
                      onClick={() => onSelectRecord(rec)}
                      title="Ver Detalhes"
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onEditRecord && (
                    <button
                      type="button"
                      onClick={() => onEditRecord(rec)}
                      title="Editar Checklist"
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center transition-colors border border-amber-200 shadow-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteRecord && (
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(rec)}
                      title="Excluir Checklist"
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center transition-colors border border-rose-200 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
