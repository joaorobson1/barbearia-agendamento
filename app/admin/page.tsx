"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Calendar as Cal, Coffee, CheckCircle, Trash2, RefreshCw, PieChart, PlusCircle, Lock, AlertTriangle } from 'lucide-react';

const BARBEIROS = ["Alan", "Thiago"];
const ALL_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
const ADMIN_PIN = "1234"; 

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [aba, setAba] = useState('agenda');
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [bloqueios, setBloqueios] = useState<any[]>([]);
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: ags } = await supabase.from('agendamentos').select('*');
      const { data: bls } = await supabase.from('bloqueios').select('*');
      if (ags) setAgendamentos(ags);
      if (bls) setBloqueios(bls);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (autenticado) carregarDados(); 
  }, [autenticado]);

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white">
        <Lock size={40} className="mb-4 text-amber-500" />
        <h1 className="font-black uppercase tracking-widest text-sm mb-8">Acesso Restrito</h1>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 border-amber-500 ${pinInput.length > i ? 'bg-amber-500' : ''}`}></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
            <button key={n} onClick={() => {
              const novoPin = pinInput + n;
              if (novoPin === ADMIN_PIN) setAutenticado(true);
              else if (novoPin.length === 4) setPinInput("");
              else setPinInput(novoPin);
            }} className="w-16 h-16 rounded-full bg-zinc-900 font-black text-xl hover:bg-zinc-800 active:bg-amber-600 transition-colors">{n}</button>
          ))}
        </div>
        <button onClick={() => setPinInput("")} className="mt-8 text-[10px] font-black uppercase text-zinc-500 tracking-widest underline">Limpar</button>
      </div>
    );
  }

  const filtradosPelaData = agendamentos.filter(a => a.data === dataFiltro && a.cliente_nome !== 'RESERVADO');
  const faturamentoHoje = filtradosPelaData.filter(a => a.concluido).reduce((acc, cur) => acc + (Number(cur.valor_final) || 0), 0);
  const faturamentoGeral = agendamentos.filter(a => a.concluido).reduce((acc, cur) => acc + (Number(cur.valor_final) || 0), 0);

  return (
    <div className="bg-slate-100 min-h-screen pb-28 font-sans">
      <header className="p-6 bg-white shadow-sm flex justify-between items-center border-b border-slate-200">
        <h1 className="font-black italic text-xl uppercase tracking-tighter text-zinc-900">Admin <span className="text-amber-600">C&B</span></h1>
        <button onClick={carregarDados} className={`p-2 bg-slate-50 rounded-xl ${loading ? "animate-spin" : ""}`}><RefreshCw size={20}/></button>
      </header>

      {aba === 'agenda' && (
        <div className="p-4 space-y-6">
          <div className="flex gap-2">
            <input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} className="flex-1 p-4 rounded-2xl border-none shadow-sm font-bold text-amber-600 outline-none"/>
            <button onClick={async () => {
              if (confirm("Remover reservas amarelas pendentes?")) {
                await supabase.from('agendamentos').delete().eq('cliente_nome', 'RESERVADO');
                carregarDados();
              }
            }} className="bg-white p-4 rounded-2xl shadow-sm text-slate-400"><Trash2 size={20}/></button>
          </div>
          
          {BARBEIROS.map(barbeiro => (
            <div key={barbeiro} className="space-y-3">
              <h3 className="font-black uppercase text-[10px] text-slate-400 tracking-[0.2em] pl-2">Cadeira: {barbeiro}</h3>
              <div className="grid gap-2">
                {ALL_SLOTS.map(hora => {
                  const ag = agendamentos.find(a => a.data === dataFiltro && a.hora === hora && a.profissional === barbeiro);
                  const isF = ag?.cliente_nome === 'RESERVADO';
                  return (
                    <div key={hora} className={`p-4 rounded-3xl flex justify-between items-center shadow-sm border ${isF ? 'bg-amber-50 border-amber-200' : ag ? 'bg-white border-white' : 'bg-slate-50 border-dashed border-slate-300'}`}>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-[10px] text-slate-400 uppercase">{hora}</span>
                        <p className={`font-bold text-sm ${isF ? 'text-amber-600 animate-pulse' : ag ? 'text-zinc-800' : 'text-slate-300'}`}>
                          {isF ? 'RESERVANDO...' : ag ? ag.cliente_nome : 'Livre'}
                        </p>
                      </div>
                      {ag ? (
                        <div className="flex gap-2">
                          {!ag.concluido && !isF && (
                            <button onClick={async () => {
                              const v = prompt("Valor do serviço:");
                              if (v) { await supabase.from('agendamentos').update({ concluido: true, valor_final: parseFloat(v) }).eq('id', ag.id); carregarDados(); }
                            }} className="bg-green-600 text-white p-2 rounded-xl"><CheckCircle size={16}/></button>
                          )}
                          <button onClick={async () => { if (confirm("Excluir?")) { await supabase.from('agendamentos').delete().eq('id', ag.id); carregarDados(); } }} className="bg-red-50 text-red-400 p-2 rounded-xl"><Trash2 size={16}/></button>
                        </div>
                      ) : (
                        <button onClick={async () => {
                          const n = prompt("Nome do cliente:");
                          if (n) { await supabase.from('agendamentos').insert([{ data: dataFiltro, hora, profissional: barbeiro, cliente_nome: n, cliente_whatsapp: '0', servico_nome: 'Manual' }]); carregarDados(); }
                        }} className="text-amber-600"><PlusCircle size={24}/></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 'folgas' && (
        <div className="p-4 space-y-4">
          <h2 className="font-black text-[10px] uppercase text-slate-400 tracking-widest pl-2 font-bold">Bloquear Data Especial</h2>
          <input type="date" onChange={async (e) => {
               if (e.target.value) { await supabase.from('bloqueios').insert([{ data: e.target.value }]); carregarDados(); }
          }} className="w-full p-4 bg-white rounded-2xl border-none font-bold shadow-sm outline-none" />
          <div className="space-y-2 mt-4">
             {bloqueios.map(b => (
               <div key={b.id} className="bg-white p-4 px-6 rounded-2xl flex justify-between items-center shadow-sm font-bold">
                 <span className="text-xs text-slate-600">{b.data.split('-').reverse().join('/')}</span>
                 <button onClick={async () => { await supabase.from('bloqueios').delete().eq('id', b.id); carregarDados(); }}><Trash2 size={16} className="text-red-400"/></button>
               </div>
             ))}
          </div>
        </div>
      )}

      {aba === 'financeiro' && (
        <div className="p-4 space-y-6 animate-in fade-in">
          <div className="bg-zinc-950 text-white p-8 rounded-[2.5rem] shadow-xl border-b-4 border-amber-600">
             <p className="text-[10px] opacity-70 uppercase font-black mb-1 tracking-widest text-amber-500 font-bold">Hoje</p>
             <h2 className="text-4xl font-black italic">R$ {faturamentoHoje.toFixed(2)}</h2>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
             <p className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-widest font-bold">Total Acumulado</p>
             <h2 className="text-3xl font-black text-zinc-900 italic">R$ {faturamentoGeral.toFixed(2)}</h2>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
             <h3 className="font-black text-[10px] uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2 font-bold"><PieChart size={14}/> Por Barbeiro</h3>
             <div className="space-y-6">
                {BARBEIROS.map(prof => {
                  const valor = agendamentos.filter(a => a.profissional === prof && a.concluido).reduce((acc, cur) => acc + (Number(cur.valor_final) || 0), 0);
                  const perc = faturamentoGeral > 0 ? (valor / faturamentoGeral) * 100 : 0;
                  return (
                    <div key={prof} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-black text-zinc-800 uppercase text-sm">{prof}</span>
                        <span className="font-black text-amber-600 italic">R$ {valor.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-600 h-full transition-all duration-1000" style={{ width: `${perc}%` }}></div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* NOVA FUNCIONALIDADE: RESETAR BALANÇO */}
          <div className="pt-6 pb-10">
            <button 
              onClick={async () => {
                const conf1 = confirm("AVISO CRÍTICO: Isto apagará TODOS os agendamentos realizados até agora para zerar o balanço. Deseja continuar?");
                if(conf1) {
                  const conf2 = prompt("Para confirmar a exclusão TOTAL, digite 'ZERAR' (em maiúsculas):");
                  if(conf2 === 'ZERAR') {
                    setLoading(true);
                    await supabase.from('agendamentos').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Apaga tudo
                    await carregarDados();
                    alert("Balanço resetado com sucesso!");
                    setLoading(false);
                  }
                }
              }}
              className="w-full p-6 border-2 border-dashed border-red-200 rounded-[2rem] flex items-center justify-center gap-3 text-red-400 hover:bg-red-50 transition-colors"
            >
              <AlertTriangle size={20} />
              <span className="font-black uppercase text-[10px] tracking-widest">Zerar Balanço Mensal</span>
            </button>
            <p className="text-center text-[9px] text-slate-300 uppercase mt-4 font-bold">Use isto apenas no final do mês após anotar os lucros.</p>
          </div>
        </div>
      )}

      <nav className="fixed bottom-6 left-6 right-6 bg-white border border-slate-200 p-4 flex justify-around rounded-[2.5rem] shadow-2xl z-50">
        <button onClick={() => setAba('agenda')} className={aba === 'agenda' ? 'text-amber-600' : 'text-slate-300'}><Cal size={24}/></button>
        <button onClick={() => setAba('folgas')} className={aba === 'folgas' ? 'text-amber-600' : 'text-slate-300'}><Coffee size={24}/></button>
        <button onClick={() => setAba('financeiro')} className={aba === 'financeiro' ? 'text-amber-600' : 'text-slate-300'}><TrendingUp size={24}/></button>
      </nav>
    </div>
  );
}