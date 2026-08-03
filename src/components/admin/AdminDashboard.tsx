import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, ShoppingBag, Package, DollarSign, Activity, 
  ArrowUpRight, ShoppingCart, RefreshCw, Eye, Percent, CheckCircle
} from 'lucide-react';
import API from '../../lib/api';

interface MetricState {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  disabledProducts: number;
  ordersCount: number;
  totalRevenue: number;
  visitorCount: number;
  conversionRate: string;
}

interface PopularLaptop {
  count: number;
  name: string;
  brand: string;
  revenue: number;
}

interface PerformanceChartItem {
  name: string;
  revenue: number;
  orders: number;
}

type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'cms' | 'blog' | 'media' | 'settings';

export default function AdminDashboard({ onSelectTab }: { onSelectTab: (tab: AdminTab) => void }) {
  const [metrics, setMetrics] = useState<MetricState | null>(null);
  const [chartData, setChartData] = useState<PerformanceChartItem[]>([]);
  const [popular, setPopular] = useState<PopularLaptop[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await API.getAnalytics();
      setMetrics(res.metrics);
      setChartData(res.performanceChart);
      setPopular(res.popularLaptops);
      
      const logs = await API.getActivityLogs();
      setRecentLogs(logs.slice(0, 5));
    } catch (err) {
      console.error("Erreur de chargement d'analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatFCFA = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
      .format(price)
      .replace('FCFA', 'FCFA')
      .replace('XAF', 'FCFA');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-8 h-8 text-luxe-copper animate-spin" />
        <span className="text-xs font-mono tracking-widest text-luxe-muted uppercase font-bold">
          Calcul des rapports de performance...
        </span>
      </div>
    );
  }

  // Calculate coordinates for dynamic SVG graphics plot
  const maxRevenue = chartData.reduce((max, d) => Math.max(max, d.revenue), 1000000);
  const svgWidth = 500;
  const svgHeight = 160;
  const padding = 20;

  const points = chartData.map((d, i) => {
    const x = padding + (i / Math.max(1, chartData.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - (d.revenue / maxRevenue) * (svgHeight - padding * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`
    : '';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner introduction with dynamic date tracking */}
      <div className="bg-luxe-dark text-warm-cream rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-luxe-gold/5 blur-3xl pointer-events-none rounded-full"></div>
        <div className="space-y-1 text-left relative z-10">
          <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">Bonjour Hervé, de retour en atelier</h2>
          <p className="text-xs text-warm-cream-dark/65 max-w-lg leading-relaxed">
            Consultez les revenus actualisés, suivez les demandes d'achat de Douala/Yaoundé et mettez à jour votre stock sécurisé d'ordinateurs importés.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-white/10 hover:bg-white/15 text-white active:scale-95 px-4 py-2.5 rounded-full border border-white/10 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer select-none"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Rafraîchir les données</span>
        </button>
      </div>

      {/* Grid count cards - Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Estimated Revenues */}
        <div className="bg-white p-5 rounded-2xl border border-warm-cream-dark shadow-sm flex items-center gap-4 text-left">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] tracking-wider uppercase font-extrabold text-luxe-muted">Chiffre d'Affaire Estimé</span>
            <p className="text-xl font-bold text-luxe-dark font-mono mt-0.5">
              {formatFCFA(metrics?.totalRevenue || 0)}
            </p>
            <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">De l'ensemble des devis reçus</span>
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="bg-white p-5 rounded-2xl border border-warm-cream-dark shadow-sm flex items-center gap-4 text-left cursor-pointer hover:border-luxe-copper transition-all" onClick={() => onSelectTab('orders')}>
          <div className="p-3.5 bg-luxe-gold/15 text-luxe-copper border border-luxe-gold/30 rounded-xl">
            <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] tracking-wider uppercase font-extrabold text-luxe-muted">Bons de Commande</span>
            <p className="text-xl font-bold text-luxe-dark font-mono mt-0.5">
              {metrics?.ordersCount}
            </p>
            <span className="text-[9px] text-luxe-copper font-bold block mt-0.5">Suivi des demandes d'achat</span>
          </div>
        </div>

        {/* Card 3: Products listed */}
        <div className="bg-white p-5 rounded-2xl border border-warm-cream-dark shadow-sm flex items-center gap-4 text-left cursor-pointer hover:border-luxe-copper transition-all" onClick={() => onSelectTab('products')}>
          <div className="p-3.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl">
            <Package className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] tracking-wider uppercase font-extrabold text-luxe-muted">Laptops en stocks</span>
            <p className="text-xl font-bold text-luxe-dark font-mono mt-0.5">
              {metrics?.activeProducts} <span className="text-xs text-luxe-muted font-normal">/ {metrics?.totalProducts}</span>
            </p>
            <span className="text-[9px] text-sky-600 font-bold block mt-0.5">
              {metrics?.outOfStock} modèles actuellement épuisés
            </span>
          </div>
        </div>

        {/* Card 4: Visitors vs conversion rate */}
        <div className="bg-white p-5 rounded-2xl border border-warm-cream-dark shadow-sm flex items-center gap-4 text-left">
          <div className="p-3.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl">
            <Users className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] tracking-wider uppercase font-extrabold text-luxe-muted">Visiteurs & Conversion</span>
            <p className="text-xl font-bold text-luxe-dark font-mono mt-0.5">
              {metrics?.visitorCount} <span className="text-xs text-luxe-muted font-normal">({metrics?.conversionRate})</span>
            </p>
            <span className="text-[9px] text-purple-600 font-bold block mt-0.5">Taux de passation de devis</span>
          </div>
        </div>

      </div>

      {/* Analytics Chart & Popular Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sales Performance Chart Card */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-warm-cream-dark shadow-sm text-left flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-lg font-bold text-luxe-dark flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-luxe-copper" />
              Historique des Ventes (FCFA)
            </h4>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-luxe-muted block mt-1">
              Rapports consolidés des flux générés mensuellement
            </span>
          </div>

          {/* Interactive Responsive SVG Graph */}
          <div className="my-6 relative border border-warm-cream bg-warm-cream/20 rounded-2xl p-4 overflow-hidden min-h-[160px]">
            {chartData.length > 0 ? (
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                {/* Area Gradient fill */}
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A87C43" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#A87C43" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#EEDCC4" strokeDasharray="3,3" />
                <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#EEDCC4" strokeDasharray="3,3" />
                <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#d1bfa7" />

                {/* Plot Area */}
                {areaPath && <path d={areaPath} fill="url(#chartGlow)" />}
                {linePath && <path d={linePath} fill="none" stroke="#A87C43" strokeWidth="2.5" />}

                {/* Plot Nodes & values */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#603f26" stroke="#ffffff" strokeWidth="1.5" />
                    <text x={p.x} y={p.y - 8} fontSize="8" fill="#603f26" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      {formatFCFA(p.revenue).replace('FCFA', '')}
                    </text>
                    <text x={p.x} y={svgHeight - 4} fontSize="8" fill="#8f7e68" fontWeight="bold" textAnchor="middle">
                      {p.name}
                    </text>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-luxe-muted font-mono py-12">
                Aucun graphique disponible
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-luxe-muted border-t border-warm-cream pt-4">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              Données issues de la base SQL Supabase
            </span>
            <span>Mise à jour immédiate à chaque commande</span>
          </div>
        </div>

        {/* Popular notebooks side columns */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-warm-cream-dark shadow-sm text-left flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-lg font-bold text-luxe-dark flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-luxe-copper" />
              Laptops Populaires
            </h4>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-luxe-muted block mt-1">
              Top 5 des demandes de devis d'Hervé
            </span>
          </div>

          <div className="space-y-4 my-6 flex-1">
            {popular.length > 0 ? (
              popular.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-warm-cream/30 p-2.5 rounded-xl border border-warm-cream-dark/50">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider bg-luxe-gold/15 text-luxe-copper font-serif font-extrabold px-1.5 py-0.5 rounded-md">
                      #{idx + 1} {item.brand}
                    </span>
                    <h5 className="font-sans text-xs font-extrabold text-luxe-dark truncate max-w-[150px]">
                      {item.name}
                    </h5>
                    <span className="text-[9px] text-luxe-muted font-mono">{item.count} demandes formelles</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-luxe-dark font-mono block">
                      {formatFCFA(item.revenue)}
                    </span>
                    <span className="text-[8px] text-emerald-600 font-mono font-bold block">Chiffre engagé</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-luxe-muted font-mono py-10">
                Aucune commande enregistrée
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className="w-full text-center py-2.5 rounded-xl bg-warm-cream text-luxe-copper border border-warm-cream-dark hover:border-luxe-copper transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Voir les bons de commandes
          </button>
        </div>

      </div>

      {/* Row 3: Security Activities Audit Trail */}
      <div className="bg-white p-6 rounded-3xl border border-warm-cream-dark shadow-sm text-left">
        <div className="flex justify-between items-center border-b border-warm-cream pb-4 mb-4">
          <div>
            <h4 className="font-serif text-lg font-bold text-luxe-dark flex items-center gap-2">
              <Activity className="w-5 h-5 text-luxe-copper" />
              Journal de Sécurité (Audit Logs)
            </h4>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-luxe-muted block mt-1">
              Rapport d'activité temps réel des administrateurs authentifiés
            </span>
          </div>
          <button
            onClick={() => onSelectTab('settings')}
            className="text-xs text-luxe-copper hover:underline font-bold"
          >
            Voir l'historique complet &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-warm-cream text-luxe-muted font-extrabold text-[10px] uppercase tracking-wider bg-warm-cream/20">
                <th className="py-2.5 px-3 text-left">Horodatage</th>
                <th className="py-2.5 px-3 text-left">Utilsateur / Rôle</th>
                <th className="py-2.5 px-3 text-left">Action effectuée</th>
                <th className="py-2.5 px-3 text-left">Cible ID / Type</th>
                <th className="py-2.5 px-3 text-right">Protection RLS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-cream">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-warm-cream/10 transition-colors">
                  <td className="py-3 px-3 text-luxe-muted font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-luxe-dark">{log.userEmail}</span>
                    <span className="block text-[10px] text-luxe-muted">{log.userRole}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-luxe-copper">{log.action}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-luxe-muted">
                    <span>{log.entityId}</span>
                    <span className="block text-[8px] uppercase tracking-widest">{log.entityType}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200 text-[8px] font-extrabold px-1.5 py-0.5 rounded-sm font-mono uppercase tracking-widest">
                      Actif • Garanti
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
