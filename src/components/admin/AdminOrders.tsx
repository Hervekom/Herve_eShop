import React, { useState, useEffect } from 'react';
import { 
  FileText, ClipboardList, Search, Filter, RefreshCw, Eye, Edit, Trash2, 
  Download, Printer, CheckCircle, Clock, Gift, MapPin, Phone, Mail, FileCheck, X
} from 'lucide-react';
import API from '../../lib/api';

interface Customizations {
  ramUpgrade: string;
  storageUpgrade: string;
  osOption: string;
  accessories: string[];
}

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientCity: string;
  laptopId: string;
  laptopBrand: string;
  laptopModel: string;
  basePrice: number;
  finalPrice: number;
  customizations: Customizations;
  additionalNotes: string;
  status: 'Demande reçue' | 'Devis validé' | 'En préparation' | 'Prêt pour livraison' | 'Livré' | 'Refusé';
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrders({ 
  currentRole, 
  onTriggerToast 
}: { 
  currentRole: 'Super Admin' | 'Admin' | 'Editor';
  onTriggerToast: (title: string, message: string, type?: string) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // active selected order for viewing / invoicing
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('Demande reçue');
  const [editPrice, setEditPrice] = useState<number>(0);

  // Print Invoice Modal State
  const [printInvoiceOpen, setPrintInvoiceOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.getOrders();
      setOrders(res);
    } catch (err) {
      onTriggerToast('Erreur ❌', 'Impossible de récupérer les devis commandes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenStatusEdit = (order: Order) => {
    setActiveOrder(order);
    setNewStatus(order.status);
    setEditPrice(order.finalPrice);
    setEditStatusOpen(true);
  };

  const handleUpdateStatusAndPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    try {
      await API.updateOrder(activeOrder.id, {
        status: newStatus,
        finalPrice: editPrice
      });
      onTriggerToast('Devis Actualisé 👍', `La commande de ${activeOrder.clientName} est passée au statut : "${newStatus}".`, 'success');
      setEditStatusOpen(false);
      fetchOrders();
    } catch (err) {
      onTriggerToast('Erreur de mise à jour', (err as Error).message, 'danger');
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (currentRole !== 'Super Admin') {
      onTriggerToast('Réglementation RLS ⛔', 'Seul le Super Admin possède les droits d\'archivage destructif des commandes.', 'warning');
      return;
    }

    if (!confirm(`Archiver et supprimer définitivement la commande #${order.id} de ${order.clientName} ? Des logs d'audit seront enregistrés.`)) return;

    try {
      await API.deleteOrder(order.id);
      onTriggerToast('Commande Archivée 👋', 'Le bon de commande a été définitivement purgé.', 'success');
      fetchOrders();
    } catch (err) {
      onTriggerToast('Erreur d\'archivage', (err as Error).message);
    }
  };

  const triggerPrintWindow = () => {
    window.print();
  };

  // Export order table list to CSV Spreadsheet format
  const exportOrdersCSV = () => {
    try {
      const headers = ['ID_Devis', 'ID_Facture', 'Client', 'Ville', 'Phone', 'Email', 'Marque', 'Modele', 'Prix_FCFA', 'Options', 'Statut', 'Date'];
      const rows = orders.map(o => [
        o.id,
        o.orderNumber,
        o.clientName,
        o.clientCity,
        o.clientPhone,
        o.clientEmail,
        o.laptopBrand,
        o.laptopModel,
        o.finalPrice,
        `RAM:${o.customizations.ramUpgrade};SSD:${o.customizations.storageUpgrade}`,
        o.status,
        new Date(o.createdAt).toLocaleDateString()
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Herve_eShop_Commandes_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onTriggerToast('Export Reçu 📊', 'Spreadsheet CSV des commandes téléchargé.');
    } catch (err) {
      onTriggerToast('Erreur', (err as Error).message);
    }
  };

  const filteredOrders = orders.filter(o => {
    const term = `${o.id} ${o.orderNumber} ${o.clientName} ${o.laptopModel} ${o.laptopBrand}`.toLowerCase();
    const matchSearch = term.includes(search.toLowerCase());
    const matchStatus = statusFilter ? o.status === statusFilter : true;
    const matchCity = cityFilter ? o.clientCity === cityFilter : true;
    return matchSearch && matchStatus && matchCity;
  });

  const formatFCFA = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
      .format(price)
      .replace('FCFA', 'FCFA')
      .replace('XAF', 'FCFA');
  };

  const getStatusBadgeClass = (st: Order['status']) => {
    switch (st) {
      case 'Demande reçue': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Devis validé': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En préparation': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Prêt pour livraison': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Livré': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Refusé': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 text-luxe-copper animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-luxe-dark flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-luxe-copper" />
            Bons de Commande & Devis d'Importation
          </h3>
          <p className="text-xs text-luxe-muted mt-1">
            Gérez la progression des demandes d'achats, ajustez les prix d'options et émettez des factures certifiées d'atelier.
          </p>
        </div>
        
        <button
          onClick={exportOrdersCSV}
          className="px-4.5 py-2.5 rounded-xl bg-luxe-copper hover:bg-luxe-dark text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Extraire le Registre (CSV)</span>
        </button>
      </div>

      {/* Grid Filters */}
      <div className="bg-white p-4 rounded-2xl border border-warm-cream-dark shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luxe-muted" />
          <input
            type="text"
            placeholder="Référence Devis, Facture, Nom Client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-warm-cream-dark focus:border-luxe-copper focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs px-4 py-2.5 rounded-xl border border-warm-cream-dark focus:border-luxe-copper focus:outline-none bg-white"
          >
            <option value="">Tous les états de progression</option>
            <option value="Demande reçue">Inscrit (Demande reçue)</option>
            <option value="Devis validé">Chiffré (Devis validé)</option>
            <option value="En préparation">En préparation d'Atelier</option>
            <option value="Prêt pour livraison">Prêt pour Expédition / Retrait</option>
            <option value="Livré">Finalisé & Livré</option>
            <option value="Refusé">Refusé / Annulé</option>
          </select>
        </div>

        <div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full text-xs px-4 py-2.5 rounded-xl border border-warm-cream-dark focus:border-luxe-copper focus:outline-none bg-white"
          >
            <option value="">Toutes les Villes d'Attachement</option>
            <option value="Douala">Douala</option>
            <option value="Yaoundé">Yaoundé</option>
            <option value="Bafoussam">Bafoussam</option>
            <option value="Kribi">Kribi</option>
            <option value="Garoua">Garoua</option>
          </select>
        </div>
      </div>

      {/* Orders Table list */}
      <div className="bg-white rounded-2xl border border-warm-cream-dark shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-warm-cream bg-warm-cream/20 text-luxe-muted font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-4 text-left">Réf Devis</th>
                <th className="py-3.5 px-4 text-left">Facture ID</th>
                <th className="py-3.5 px-4 text-left">Client & Coordonnées</th>
                <th className="py-3.5 px-4 text-left">Machine Sollicitée</th>
                <th className="py-3.5 px-4 text-left">Montant Global</th>
                <th className="py-3.5 px-4 text-center">Progression</th>
                <th className="py-3.5 px-4 text-right">Traitement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-cream">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-warm-cream/15 transition-all">
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-luxe-copper">
                    {order.id}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-luxe-muted">
                    {order.orderNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-luxe-dark text-xs">{order.clientName}</div>
                    <div className="text-[10px] text-luxe-muted font-mono mt-0.5 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{order.clientCity}</span>
                    </div>
                    <div className="text-[10px] text-luxe-muted font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-2.5 h-2.5" />
                      <span>{order.clientPhone}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-luxe-dark">
                      {order.laptopBrand} <span className="font-normal">{order.laptopModel}</span>
                    </div>
                    <div className="text-[10px] text-luxe-copper mt-1">
                      RAM : {order.customizations.ramUpgrade} | SD : {order.customizations.storageUpgrade} | OS : {order.customizations.osOption}
                    </div>
                    {order.additionalNotes && (
                      <div className="text-[10px] italic text-red-500 bg-red-50 px-2 py-0.5 rounded-lg inline-block mt-1 max-w-[220px] truncate">
                        💡 {order.additionalNotes}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-extrabold text-luxe-dark">
                    {formatFCFA(order.finalPrice)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    <span className={`text-[8.5px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-sm border ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setActiveOrder(order);
                          setPrintInvoiceOpen(true);
                        }}
                        title="Imprimer / Facturer"
                        className="p-1.5 hover:bg-warm-cream text-luxe-muted hover:text-black border border-warm-cream rounded-lg transition-all active:scale-90"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleOpenStatusEdit(order)}
                        title="Changer Statut / Prix"
                        className="p-1.5 hover:bg-blue-50 text-luxe-muted hover:text-blue-600 border border-warm-cream rounded-lg transition-all active:scale-90"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {currentRole === 'Super Admin' && (
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          title="Supprimer Définitivement"
                          className="p-1.5 hover:bg-red-50 text-luxe-muted hover:text-red-600 border border-warm-cream rounded-lg transition-all active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPONENT STATUS / PRICE EDIT MODAL */}
      {editStatusOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-luxe-dark/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-warm-cream-dark shadow-2xl overflow-hidden text-xs text-left">
            <div className="bg-luxe-dark text-warm-cream p-4 flex justify-between items-center border-b border-luxe-gold/30">
              <h4 className="font-serif font-bold text-sm">Actionner le Devis #{activeOrder.id}</h4>
              <button onClick={() => setEditStatusOpen(false)} className="text-white text-lg font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateStatusAndPrice} className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-luxe-muted block uppercase tracking-wider font-extrabold">Client / Ville</span>
                <p className="font-bold text-luxe-dark">{activeOrder.clientName} ({activeOrder.clientCity})</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-luxe-muted block uppercase tracking-wider font-extrabold">Machine de Référence</span>
                <p className="font-medium text-luxe-dark">{activeOrder.laptopBrand} {activeOrder.laptopModel}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark">Changer l'État de Progression d'Importation</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-warm-cream-dark bg-white focus:outline-none"
                >
                  <option value="Demande reçue">Inscrit (Demande reçue)</option>
                  <option value="Devis validé">Chiffré (Devis validé)</option>
                  <option value="En préparation">En préparation d'Atelier</option>
                  <option value="Prêt pour livraison">Prêt à livraison / Expédition</option>
                  <option value="Livré">Finalisé & Livré</option>
                  <option value="Refusé">Refusé / Annulé</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark">Ajuster le Prix Final Facturé (FCFA)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none font-mono font-bold"
                />
                <span className="text-[9px] text-luxe-muted block">Inclus les éventuelles reconfigurations RAM, SSD ou accessoires.</span>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-warm-cream pt-4">
                <button
                  type="button"
                  onClick={() => setEditStatusOpen(false)}
                  className="px-4 py-2 border border-warm-cream-dark rounded-xl font-bold font-sans text-luxe-muted hover:text-luxe-dark"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-luxe-copper text-white hover:bg-luxe-dark transition-all font-bold"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT INVOICE MODAL (Styled to hide surrounding app frame @media print) */}
      {printInvoiceOpen && activeOrder && (
        <div className="fixed inset-0 z-55 bg-luxe-dark/45 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:fixed print:inset-0 print:bg-white print:z-99 print:p-0">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-warm-cream-dark shadow-2xl p-6 print:border-none print:shadow-none print:p-8 relative">
            
            {/* Top Toolbar - HIDDEN DURING PRINTING */}
            <div className="flex justify-between items-center bg-warm-cream/30 p-2.5 rounded-xl border border-warm-cream-dark/60 mb-6 print:hidden">
              <span className="text-xs font-bold text-luxe-dark">Facture et Bon de Livraison Officiel d'Import</span>
              <div className="flex gap-2">
                <button
                  onClick={triggerPrintWindow}
                  className="px-3.5 py-1.5 bg-luxe-copper text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer / Facture PDF</span>
                </button>
                <button
                  onClick={() => setPrintInvoiceOpen(false)}
                  className="p-1 px-2 border border-grey hover:bg-white bg-transparent rounded-lg text-xs font-serif"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Print Body contents */}
            <div className="text-left font-sans text-xs space-y-6 text-luxe-dark" id="invoice-printable-sheet">
              
              {/* Invoice Headers logo and title */}
              <div className="flex justify-between items-start border-b border-warm-cream-dark pb-5">
                <div className="space-y-1">
                  <h1 className="font-serif text-xl font-bold tracking-tight text-luxe-copper">Herve_eShop</h1>
                  <p className="text-[10px] text-luxe-muted">Importateur d'ordinateurs d'exception</p>
                  <p className="text-[9px] text-luxe-muted leading-relaxed max-w-xs">
                    Akwa Showroom - Face Boulangerie Zépol, Douala <br />
                    Tél : +237 699 00 11 22 | +237 677 88 99 00 <br />
                    Email : contact@herve-eshop.cm
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <h2 className="text-base font-extrabold uppercase text-luxe-dark">FACTURE COMMERCIALE</h2>
                  <p className="font-mono text-luxe-copper font-bold text-xs">{activeOrder.orderNumber}</p>
                  <p className="text-[10px] text-luxe-muted">Date Émission : {new Date(activeOrder.createdAt).toLocaleDateString('fr-FR')}</p>
                  <p className="text-[10px] text-luxe-muted font-bold">Statut : <span className="text-emerald-600 uppercase font-mono font-bold">{activeOrder.status}</span></p>
                </div>
              </div>

              {/* Addresses section */}
              <div className="grid grid-cols-2 gap-6 bg-warm-cream/15 p-4 rounded-xl border border-warm-cream-dark/60">
                <div className="space-y-1 text-left">
                  <span className="text-[9px] text-luxe-muted block uppercase font-extrabold tracking-wider">EXPÉDITEUR</span>
                  <p className="font-bold text-luxe-dark">Hervé Boutique d'Atelier</p>
                  <p className="text-[10px] text-luxe-muted">Service Commande Clients Cameroon</p>
                  <p className="text-[10px] text-luxe-muted">Importations directes des États-Unis et d'Europe.</p>
                </div>
                
                <div className="space-y-1 text-left">
                  <span className="text-[9px] text-luxe-muted block uppercase font-extrabold tracking-wider">CLIENT RECEPTIOMNAIRE</span>
                  <p className="font-bold text-luxe-dark">{activeOrder.clientName}</p>
                  <p className="text-[10px] text-luxe-muted">Emplacement : {activeOrder.clientCity}, Cameroun</p>
                  <p className="text-[10px] text-luxe-muted">Tél : {activeOrder.clientPhone}</p>
                  {activeOrder.clientEmail && <p className="text-[10px] text-luxe-muted">Email : {activeOrder.clientEmail}</p>}
                </div>
              </div>

              {/* Items tables detail */}
              <div className="space-y-2 text-left">
                <span className="text-[9px] text-luxe-muted block uppercase font-extrabold tracking-wider">LIGNE DE COMMANDE</span>
                <table className="w-full border-collapse border border-warm-cream-dark">
                  <thead>
                    <tr className="bg-warm-cream/35 border-b border-warm-cream-dark font-bold text-[10px] text-luxe-muted">
                      <th className="py-2.5 px-3 border border-warm-cream-dark text-left">Désignaton de la Configuration</th>
                      <th className="py-2.5 px-3 border border-warm-cream-dark text-center w-12">Qté</th>
                      <th className="py-2.5 px-3 border border-warm-cream-dark text-right w-28">Prix Unitaire</th>
                      <th className="py-2.5 px-3 border border-warm-cream-dark text-right w-28">Total Ligne</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-[11px] leading-relaxed">
                      <td className="py-3 px-3 border border-warm-cream-dark">
                        <div className="font-extrabold text-luxe-dark">
                          {activeOrder.laptopBrand} - {activeOrder.laptopModel}
                        </div>
                        <div className="text-[10px] text-luxe-copper mt-1">
                          Options intégrées :
                          <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-luxe-muted">
                            <li>Recharge RAM : {activeOrder.customizations.ramUpgrade}</li>
                            <li>Ajout Stockage : {activeOrder.customizations.storageUpgrade}</li>
                            <li>Installation Système : {activeOrder.customizations.osOption}</li>
                            {activeOrder.customizations.accessories.length > 0 && (
                              <li>Sélect. accessoires : {activeOrder.customizations.accessories.join(', ')}</li>
                            )}
                          </ul>
                        </div>
                      </td>
                      <td className="py-3 px-3 border border-warm-cream-dark text-center font-mono">1</td>
                      <td className="py-3 px-3 border border-warm-cream-dark text-right font-mono">{formatFCFA(activeOrder.basePrice)}</td>
                      <td className="py-3 px-3 border border-warm-cream-dark text-right font-mono font-bold">{formatFCFA(activeOrder.finalPrice)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Invoice Calculations Summary totals */}
              <div className="flex justify-between items-start pt-3">
                <div className="max-w-xs space-y-1">
                  <p className="text-[9px] text-luxe-muted font-bold uppercase tracking-wider">CONDITIONS DE GARANTIE TECHNIQUE</p>
                  <p className="text-[9.5px] text-luxe-muted leading-relaxed">
                    Ce reçu donne droit à **6 mois de garantie pièces et main d'œuvre** en nos ateliers de Douala (ou Yaoundé). Les pannes d'origine électrique subites ou casse/liquides ne sont pas couvertes.
                  </p>
                </div>
                <div className="w-56 space-y-1 border-t border-warm-cream pt-2 text-right">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-luxe-muted">Montant Libre (H.T) :</span>
                    <span className="font-mono">{formatFCFA(activeOrder.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-luxe-muted">Taxe & Redevance (0%) :</span>
                    <span className="font-mono">0 FCFA</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-luxe-copper pt-1.5 text-xs font-bold text-luxe-dark bg-warm-cream/20 p-2 rounded">
                    <span>NET À PAYER (FCFA) :</span>
                    <span className="font-mono text-luxe-copper">{formatFCFA(activeOrder.finalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Corporate signatures stamp visual */}
              <div className="flex justify-between items-center pt-8 border-t border-dashed border-warm-cream-dark">
                <div className="text-left">
                  <p className="text-[9px] text-luxe-muted uppercase font-bold">Client signature</p>
                  <div className="w-36 h-12 border-b border-warm-cream-dark mt-2"></div>
                </div>
                <div className="text-center space-y-1 shrink-0 bg-luxe-dark text-white p-3 rounded-2xl relative w-48 shadow-lg overflow-hidden border border-luxe-gold/30">
                  <div className="absolute inset-0 bg-radial-gradient from-luxe-gold/20 via-transparent pointer-events-none"></div>
                  <span className="text-[7.5px] uppercase font-bold tracking-widest text-luxe-gold block">CACHET D'ATELIER CERTIFIÉ</span>
                  <p className="font-serif font-bold text-[10px] mt-1">Herve_eShop Cameroon</p>
                  <span className="text-[7px] font-mono hover:text-luxe-gold">Douala - Yaoundé • Direct Import</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
