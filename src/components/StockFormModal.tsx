import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  Plus, 
  PlusCircle, 
  Save, 
  Package, 
  Building2, 
  User, 
  MapPin, 
  Hash, 
  Calendar, 
  FileText, 
  Layers, 
  Sparkles,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { StockItem, StockLayoutPhoto, StockMaterialType, StockStatus } from '../types';
import { dbService } from '../services/db';
import { compressImage } from '../utils/imageUtils';

interface StockFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (item: StockItem) => void;
  editingItem?: StockItem | null;
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
  'AMBEV',
  'ARTPLAN',
  'BANCO DO BRASIL',
  'BRADESCO',
  'CLARO',
  'ELETROMIDIA',
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

const MATERIAL_TYPES: StockMaterialType[] = [
  'Papel Abrigo (120x175)',
  'Vinil Adesivo',
  'Lona',
  'Backlight',
  'Painel Digital / Estático',
  'Outro'
];

export const StockFormModal: React.FC<StockFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingItem
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [cliente, setCliente] = useState<string>('');
  const [campanha, setCampanha] = useState<string>('');
  const [grafica, setGrafica] = useState<string>('');
  const [tipoMaterial, setTipoMaterial] = useState<StockMaterialType>('Papel Abrigo (120x175)');
  const [quantidadeTotal, setQuantidadeTotal] = useState<string>('100');
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState<string>('100');
  const [localizacao, setLocalizacao] = useState<string>('Galpão Principal - Prateleira A1');
  const [loteOs, setLoteOs] = useState<string>('');
  const [dataEntrada, setDataEntrada] = useState<string>(todayStr);
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState<string>('Técnico Galpão');
  const [status, setStatus] = useState<StockStatus>('Disponível');
  const [observacoes, setObservacoes] = useState<string>('');
  const [fotosLayout, setFotosLayout] = useState<StockLayoutPhoto[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingItem) {
      setCliente(editingItem.cliente || '');
      setCampanha(editingItem.campanha || '');
      setGrafica(editingItem.grafica || '');
      setTipoMaterial(editingItem.tipo_material || 'Papel Abrigo (120x175)');
      setQuantidadeTotal(String(editingItem.quantidade_total ?? 100));
      setQuantidadeDisponivel(String(editingItem.quantidade_disponivel ?? 100));
      setLocalizacao(editingItem.localizacao || '');
      setLoteOs(editingItem.lote_os || '');
      setDataEntrada(editingItem.data_entrada || todayStr);
      setTecnicoResponsavel(editingItem.tecnico_responsavel || '');
      setStatus(editingItem.status || 'Disponível');
      setObservacoes(editingItem.observacoes || '');
      setFotosLayout(editingItem.fotos_layout || []);
    } else {
      resetForm();
    }
  }, [editingItem, isOpen]);

  const resetForm = () => {
    setCliente('');
    setCampanha('');
    setGrafica('');
    setTipoMaterial('Papel Abrigo (120x175)');
    setQuantidadeTotal('100');
    setQuantidadeDisponivel('100');
    setLocalizacao('Galpão Principal - Prateleira A1');
    setLoteOs('');
    setDataEntrada(todayStr);
    setTecnicoResponsavel('Técnico Galpão');
    setStatus('Disponível');
    setObservacoes('');
    setFotosLayout([]);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImage(true);
    setErrorMsg(null);

    try {
      const newPhotos: StockLayoutPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Compress image to max 1200x1200px
        const result = await compressImage(file, 1200, 1200, 0.82);
        
        const photoIndex = fotosLayout.length + newPhotos.length + 1;
        newPhotos.push({
          id: `lay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          foto: result.dataUrl,
          nome_motivo: `Motivo ${photoIndex} - Layout ${photoIndex}`,
          quantidade: Math.round(Number(quantidadeDisponivel || 0) / (fotosLayout.length + files.length || 1)),
          observacoes: '',
          data_upload: new Date().toISOString()
        });
      }

      setFotosLayout((prev) => [...prev, ...newPhotos]);
    } catch (err: any) {
      console.error('Erro ao processar imagem:', err);
      setErrorMsg('Ocorreu um erro ao carregar a imagem. Tente novamente.');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdatePhotoMotivo = (id: string, nome_motivo: string) => {
    setFotosLayout((prev) =>
      prev.map((p) => (p.id === id ? { ...p, nome_motivo } : p))
    );
  };

  const handleUpdatePhotoQuantity = (id: string, quantidade: number) => {
    setFotosLayout((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantidade } : p))
    );
  };

  const handleRemovePhoto = (id: string) => {
    setFotosLayout((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!campanha.trim()) {
      setErrorMsg('Por favor, informe o Nome da Campanha.');
      return;
    }

    if (!cliente.trim()) {
      setErrorMsg('Por favor, informe o Cliente.');
      return;
    }

    const qTotal = parseInt(quantidadeTotal.replace(/[^0-9]/g, '') || '0', 10);
    const qDisp = parseInt(quantidadeDisponivel.replace(/[^0-9]/g, '') || '0', 10);
    const qPostada = editingItem ? editingItem.quantidade_postada : Math.max(0, qTotal - qDisp);

    const payload = {
      cliente: cliente.trim().toUpperCase(),
      campanha: campanha.trim().toUpperCase(),
      grafica: grafica.trim().toUpperCase(),
      tipo_material: tipoMaterial,
      quantidade_total: qTotal,
      quantidade_disponivel: qDisp,
      quantidade_postada: qPostada,
      localizacao: localizacao.trim(),
      lote_os: loteOs.trim(),
      data_entrada: dataEntrada,
      tecnico_responsavel: tecnicoResponsavel.trim(),
      status: qDisp <= 0 ? 'Esgotado' : qDisp < 10 ? 'Baixo Estoque' : status,
      observacoes: observacoes.trim(),
      fotos_layout: fotosLayout
    };

    try {
      let saved: StockItem;
      if (editingItem) {
        saved = await dbService.updateStockItem({
          ...editingItem,
          ...payload
        });
      } else {
        saved = await dbService.addStockItem(payload);
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar item de estoque:', err);
      setErrorMsg('Erro ao gravar no banco de dados. Verifique os campos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-zinc-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#000000] text-white p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF4F00] p-2.5 rounded-xl text-black font-black">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                {editingItem ? 'Editar Estoque de Postagem' : 'Novo Cadastro de Estoque'}
                <span className="bg-[#FECC14] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Galpão / Técnicos
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Cadastro de quantidade de cartazes e fotos dos layouts/motivos recebidos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="bg-rose-100 border border-rose-300 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Campanha & Cliente */}
          <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-4">
            <div className="border-b border-zinc-200 pb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FF4F00]" /> 1. Identificação da Campanha & Fornecedor
              </h3>
              <span className="text-[11px] text-zinc-500 font-medium">Dados principais do material</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Campanha */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Título da Campanha / Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CORONA VERÃO SUNSETS 2026, IFOOD 15 MIN..."
                  value={campanha}
                  onChange={(e) => setCampanha(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-black text-zinc-900 focus:outline-none focus:border-[#FF4F00] transition-colors"
                />
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Cliente / Anunciante *
                </label>
                <input
                  type="text"
                  list="clientes-estoque"
                  required
                  placeholder="Ex: AMBEV, IFOOD..."
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#FF4F00] transition-colors"
                />
                <datalist id="clientes-estoque">
                  {COMMON_CLIENTES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Gráfica */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Gráfica / Produtora
                </label>
                <input
                  type="text"
                  list="graficas-estoque"
                  placeholder="Ex: ZOOM IMAGEM, MPV7..."
                  value={grafica}
                  onChange={(e) => setGrafica(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#FF4F00] transition-colors"
                />
                <datalist id="graficas-estoque">
                  {COMMON_GRAFICAS.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              {/* Tipo de Material */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Tipo de Material / Formato
                </label>
                <select
                  value={tipoMaterial}
                  onChange={(e) => setTipoMaterial(e.target.value as StockMaterialType)}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#FF4F00]"
                >
                  {MATERIAL_TYPES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Lote / OS / Protocolo */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nº OS / Lote / Protocolo
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Ex: OS-8842 ou NF-19402"
                    value={loteOs}
                    onChange={(e) => setLoteOs(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:outline-none focus:border-[#FF4F00]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Quantidades, Localização & Técnico */}
          <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-4">
            <div className="border-b border-zinc-200 pb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4E18FF]" /> 2. Quantidade & Armazenamento no Galpão
              </h3>
              <span className="text-[11px] text-zinc-500 font-medium">Controle de saldo físico</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Quantidade Total Recebida */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Qtd Total Recebida *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantidadeTotal}
                  onChange={(e) => {
                    setQuantidadeTotal(e.target.value);
                    if (!editingItem) {
                      setQuantidadeDisponivel(e.target.value);
                    }
                  }}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-base font-black text-zinc-900 focus:outline-none focus:border-[#FF4F00]"
                />
              </div>

              {/* Quantidade Disponível em Estoque */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Qtd Disponível Agora *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantidadeDisponivel}
                  onChange={(e) => setQuantidadeDisponivel(e.target.value)}
                  className="w-full bg-white border-2 border-[#FF4F00] rounded-xl px-3.5 py-2.5 text-base font-black text-[#FF4F00] focus:outline-none"
                />
              </div>

              {/* Localização no Galpão */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Localização / Prateleira *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prateleira B2, Palete 04..."
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#FF4F00]"
                  />
                </div>
              </div>

              {/* Técnico Responsável */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Técnico / Conferente *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Nome do técnico"
                    value={tecnicoResponsavel}
                    onChange={(e) => setTecnicoResponsavel(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#FF4F00]"
                  />
                </div>
              </div>

              {/* Data de Entrada */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Data de Entrada *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="date"
                    required
                    value={dataEntrada}
                    onChange={(e) => setDataEntrada(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#FF4F00]"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Status do Estoque
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StockStatus)}
                  className={`w-full border-2 rounded-xl px-3.5 py-2 text-xs font-bold ${
                    status === 'Disponível' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' :
                    status === 'Baixo Estoque' ? 'border-amber-400 bg-amber-50 text-amber-900' :
                    status === 'Esgotado' ? 'border-rose-500 bg-rose-50 text-rose-900' :
                    'border-purple-500 bg-purple-50 text-purple-900'
                  }`}
                >
                  <option value="Disponível">✓ Disponível</option>
                  <option value="Baixo Estoque">⚠ Baixo Estoque (&lt; 10 pçs)</option>
                  <option value="Esgotado">✖ Esgotado</option>
                  <option value="Reservado">🔒 Reservado</option>
                </select>
              </div>

              {/* Observações */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Observações Gerais / Detalhes do Galpão
                </label>
                <input
                  type="text"
                  placeholder="Ex: Abrigos SP Centro, 150g couchê..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4F00]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: FOTOS DO LAYOUT (MOTIVOS) */}
          <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/20 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-orange-200 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#FF4F00]" /> 3. Registro Fotográfico dos Layouts (Motivos da Campanha)
                </h3>
                <p className="text-xs text-zinc-500">
                  Adicione fotos dos layouts/artes recebidas para identificação visual rápida pelos técnicos
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className="flex items-center gap-1.5 bg-[#FF4F00] hover:bg-[#e04500] text-black font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-md transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isProcessingImage ? 'Processando...' : '+ Tirar Foto / Upload Layout'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Gallery of Layout Photos */}
            {fotosLayout.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-40 border-2 border-dashed border-zinc-300 hover:border-[#FF4F00] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer bg-white transition-colors"
              >
                <ImageIcon className="w-10 h-10 text-zinc-300 mb-2" />
                <p className="text-xs font-bold text-zinc-700">Nenhum layout fotografado ainda</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Clique aqui para abrir a câmera do celular ou escolher fotos da galeria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {fotosLayout.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="bg-white rounded-xl border border-zinc-300 shadow-sm overflow-hidden flex flex-col"
                  >
                    {/* Image Preview */}
                    <div className="relative h-48 bg-black flex items-center justify-center group overflow-hidden">
                      <img
                        src={photo.foto}
                        alt={photo.nome_motivo}
                        className="max-h-full max-w-full object-contain"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white rounded text-[10px] font-bold">
                        Layout #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow transition-transform active:scale-95"
                        title="Remover foto do layout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inputs per Layout Photo */}
                    <div className="p-3 space-y-2 bg-zinc-50 border-t border-zinc-200">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 uppercase">
                          Identificação do Motivo / Versão
                        </label>
                        <input
                          type="text"
                          value={photo.nome_motivo}
                          onChange={(e) => handleUpdatePhotoMotivo(photo.id, e.target.value)}
                          placeholder="Ex: Motivo 1 - Garrafa, Motivo 2 - Copo..."
                          className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#FF4F00]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-zinc-600 uppercase">
                            Qtd Deste Motivo (pçs)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={photo.quantidade ?? ''}
                            onChange={(e) =>
                              handleUpdatePhotoQuantity(
                                photo.id,
                                parseInt(e.target.value || '0', 10)
                              )
                            }
                            placeholder="Qtd peças"
                            className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#FF4F00]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-zinc-900 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg border border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-[#FF4F00] hover:bg-[#e04500] text-black font-black px-6 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-600/30 transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              {editingItem ? 'Salvar Alterações de Estoque' : 'Concluir Cadastro de Estoque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
