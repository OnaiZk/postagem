import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Building2, 
  User, 
  MapPin, 
  Hash, 
  Calendar, 
  Layers, 
  FileText, 
  Printer, 
  ZoomIn, 
  TrendingDown, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  Clock, 
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StockItem, StockMovement, MovementType } from '../types';
import { dbService } from '../services/db';

interface StockDetailModalProps {
  item: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: StockItem) => void;
  onDeleted: (id: string) => void;
  onUpdated: (item: StockItem) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDeleted,
  onUpdated
}) => {
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState<boolean>(false);

  // Quick Movement State
  const [showMovementForm, setShowMovementForm] = useState<boolean>(false);
  const [movementTipo, setMovementTipo] = useState<MovementType>('Saída / Postagem na Rua');
  const [movementQtd, setMovementQtd] = useState<string>('10');
  const [movementMotivo, setMovementMotivo] = useState<string>('Postagem de abrigos de ônibus');
  const [movementTecnico, setMovementTecnico] = useState<string>('Técnico Galpão');
  const [movementMsg, setMovementMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item && isOpen) {
      loadMovements(item.id);
      setShowMovementForm(false);
      setMovementMsg(null);
    }
  }, [item, isOpen]);

  const loadMovements = async (stockId: string) => {
    setLoadingMovements(true);
    try {
      const data = await dbService.getAllStockMovements(stockId);
      setMovements(data);
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err);
    } finally {
      setLoadingMovements(false);
    }
  };

  if (!isOpen || !item) return null;

  const handlePrintTag = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o estoque da campanha "${item.campanha}"?`)) {
      await dbService.deleteStockItem(item.id);
      onDeleted(item.id);
      onClose();
    }
  };

  const handleExecuteMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtdNum = parseInt(movementQtd.replace(/[^0-9]/g, '') || '0', 10);
    if (qtdNum <= 0) {
      alert('Informe uma quantidade válida para movimentação.');
      return;
    }

    const delta = movementTipo === 'Entrada' ? qtdNum : -qtdNum;

    try {
      const updated = await dbService.quickAdjustStock(
        item.id,
        delta,
        movementTipo,
        movementTecnico,
        movementMotivo
      );
      onUpdated(updated);
      await loadMovements(item.id);
      setMovementMsg(
        `Movimentação de ${qtdNum} cartazes (${movementTipo}) registrada com sucesso!`
      );
      setTimeout(() => {
        setMovementMsg(null);
        setShowMovementForm(false);
      }, 2500);
    } catch (err: any) {
      console.error('Erro ao movimentar estoque:', err);
      alert('Erro ao registrar movimentação.');
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'Disponível':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Baixo Estoque':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Esgotado':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-purple-100 text-purple-900 border-purple-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-zinc-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#000000] text-white p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF4F00] p-2.5 rounded-xl text-black font-black text-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                {item.campanha}
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getStatusBadge()}`}>
                  {item.status}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Cliente: <strong className="text-white">{item.cliente}</strong> • Lote/OS: {item.lote_os || 'S/N'} • Cadastrado em {item.data_entrada ? item.data_entrada.split('-').reverse().join('/') : ''}
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <span className="text-[11px] font-bold text-orange-900 uppercase block">Saldo Disponível</span>
              <span className="text-2xl font-black text-[#FF4F00]">
                {item.quantidade_disponivel.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-600">pçs</span>
              </span>
            </div>

            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <span className="text-[11px] font-bold text-zinc-600 uppercase block">Postados na Rua</span>
              <span className="text-2xl font-black text-zinc-900">
                {(item.quantidade_postada || 0).toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-500">pçs</span>
              </span>
            </div>

            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <span className="text-[11px] font-bold text-zinc-600 uppercase block">Total Recebido</span>
              <span className="text-2xl font-black text-zinc-900">
                {item.quantidade_total.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-500">pçs</span>
              </span>
            </div>

            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <span className="text-[11px] font-bold text-zinc-600 uppercase block">Localização Galpão</span>
              <span className="text-sm font-black text-zinc-900 block truncate" title={item.localizacao}>
                {item.localizacao}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs">
            <div>
              <span className="text-zinc-500 font-bold block">Material / Formato:</span>
              <span className="font-black text-zinc-900">{item.tipo_material}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold block">Gráfica / Produtora:</span>
              <span className="font-black text-zinc-900">{item.grafica || 'Não informada'}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold block">Técnico Responsável:</span>
              <span className="font-black text-zinc-900">{item.tecnico_responsavel}</span>
            </div>
            {item.observacoes && (
              <div className="sm:col-span-3 pt-2 border-t border-zinc-200">
                <span className="text-zinc-500 font-bold block">Observações:</span>
                <span className="text-zinc-800 font-medium">{item.observacoes}</span>
              </div>
            )}
          </div>

          {/* Section: FOTOS DO LAYOUT */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF4F00]" /> Layouts Registrados ({item.fotos_layout?.length || 0} Motivos)
              </h3>
              <span className="text-xs text-zinc-500">Clique na foto para ampliar</span>
            </div>

            {(!item.fotos_layout || item.fotos_layout.length === 0) ? (
              <div className="h-32 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center text-zinc-400 text-xs bg-zinc-50">
                <ImageIcon className="w-8 h-8 mb-1 text-zinc-300" />
                <span>Nenhuma foto de layout cadastrada para esta campanha</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {item.fotos_layout.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="border border-zinc-300 rounded-xl overflow-hidden bg-zinc-900 flex flex-col shadow-sm group"
                  >
                    <div
                      className="relative h-56 bg-black flex items-center justify-center cursor-pointer overflow-hidden"
                      onClick={() => setZoomImage(photo.foto)}
                    >
                      <img
                        src={photo.foto}
                        alt={photo.nome_motivo}
                        className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105 duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity">
                        <ZoomIn className="w-4 h-4" /> Ampliar Layout
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white rounded text-[10px] font-bold">
                        Motivo #{index + 1}
                      </span>
                    </div>

                    <div className="p-3 bg-white border-t border-zinc-200">
                      <h4 className="text-xs font-black text-zinc-900 truncate">
                        {photo.nome_motivo || `Layout ${index + 1}`}
                      </h4>
                      {photo.quantidade !== undefined && (
                        <p className="text-[11px] text-zinc-600 font-bold mt-0.5">
                          Qtd: <span className="text-[#FF4F00]">{photo.quantidade} peças</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Movement & Baixa Section */}
          <div className="border border-zinc-200 rounded-2xl p-5 bg-zinc-50 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#4E18FF]" /> Movimentação de Estoque (Postagem / Entrada)
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Registre a saída de cartazes para os técnicos postarem nos abrigos ou entrada de reposição
                </p>
              </div>

              {!showMovementForm && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMovementTipo('Saída / Postagem na Rua');
                      setShowMovementForm(true);
                    }}
                    className="flex items-center gap-1 bg-[#FF4F00] hover:bg-[#e04500] text-black font-extrabold px-3 py-1.5 rounded-xl text-xs shadow transition-transform active:scale-95"
                  >
                    <TrendingDown className="w-3.5 h-3.5" /> Dar Baixa (Postagem)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementTipo('Entrada');
                      setShowMovementForm(true);
                    }}
                    className="flex items-center gap-1 bg-black hover:bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow transition-transform active:scale-95"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> + Entrada
                  </button>
                </div>
              )}
            </div>

            {movementMsg && (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{movementMsg}</span>
              </div>
            )}

            {showMovementForm && (
              <form onSubmit={handleExecuteMovement} className="bg-white p-4 rounded-xl border border-zinc-300 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                      Tipo de Movimentação
                    </label>
                    <select
                      value={movementTipo}
                      onChange={(e) => setMovementTipo(e.target.value as MovementType)}
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none"
                    >
                      <option value="Saída / Postagem na Rua">Saída / Postagem na Rua</option>
                      <option value="Entrada">Entrada / Reposição</option>
                      <option value="Ajuste Manual">Ajuste Manual</option>
                      <option value="Avaria / Descarte">Avaria / Descarte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                      Quantidade (peças)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={movementQtd}
                      onChange={(e) => setMovementQtd(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                      Técnico Responsável
                    </label>
                    <input
                      type="text"
                      required
                      value={movementTecnico}
                      onChange={(e) => setMovementTecnico(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">
                      Motivo / Destino
                    </label>
                    <input
                      type="text"
                      value={movementMotivo}
                      onChange={(e) => setMovementMotivo(e.target.value)}
                      placeholder="Ex: Abrigos Linha Paulista..."
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowMovementForm(false)}
                    className="px-3 py-1.5 text-zinc-600 hover:text-zinc-900 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#FF4F00] hover:bg-[#e04500] text-black text-xs font-black rounded-lg shadow active:scale-95"
                  >
                    Confirmar Movimentação
                  </button>
                </div>
              </form>
            )}

            {/* Movement History Table */}
            <div>
              <h4 className="text-xs font-bold text-zinc-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" /> Histórico de Movimentações Desta Campanha
              </h4>

              {loadingMovements ? (
                <div className="text-center py-4 text-xs text-zinc-500">Carregando histórico...</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-400 bg-white rounded-lg border border-zinc-200">
                  Nenhuma movimentação registrada além do cadastro inicial.
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl border border-zinc-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 text-zinc-600 uppercase text-[10px] font-bold border-b border-zinc-200">
                        <th className="py-2 px-3">Data / Hora</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3 text-right">Qtd</th>
                        <th className="py-2 px-3 text-right">Saldo Atual</th>
                        <th className="py-2 px-3">Técnico</th>
                        <th className="py-2 px-3">Motivo / Obs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {movements.map((mov) => (
                        <tr key={mov.id} className="hover:bg-zinc-50">
                          <td className="py-2 px-3 text-zinc-500 whitespace-nowrap">
                            {mov.data_hora ? new Date(mov.data_hora).toLocaleString('pt-BR') : ''}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mov.tipo === 'Entrada' ? 'bg-emerald-100 text-emerald-800' :
                              mov.tipo === 'Saída / Postagem na Rua' ? 'bg-orange-100 text-orange-800' :
                              'bg-zinc-100 text-zinc-800'
                            }`}>
                              {mov.tipo}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-zinc-900 whitespace-nowrap">
                            {mov.tipo === 'Entrada' ? `+${mov.quantidade}` : `-${mov.quantidade}`}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-700 whitespace-nowrap">
                            {mov.saldo_atual} pçs
                          </td>
                          <td className="py-2 px-3 font-semibold text-zinc-800 whitespace-nowrap">
                            {mov.tecnico}
                          </td>
                          <td className="py-2 px-3 text-zinc-600 truncate max-w-xs" title={mov.motivo}>
                            {mov.motivo || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-100 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrintTag}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Etiqueta Palete
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir Item
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF4F00] hover:bg-[#e04500] text-black font-extrabold rounded-xl text-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar Estoque
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-bold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => setZoomImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
            onClick={() => setZoomImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomImage}
            alt="Layout Ampliado"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
