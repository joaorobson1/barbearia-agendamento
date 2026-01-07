"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, Scissors, CheckCircle2, 
  ArrowLeft, ChevronRight, Skull 
} from 'lucide-react';

const SERVICES = [
  { id: '1', name: 'Corte Tradicional', price: 45 },
  { id: '2', name: 'Barba Completa', price: 35 },
  { id: '3', name: 'Corte + Barba', price: 70 },
];
const BARBEIROS = ["Alan", "Thiago"];
const ALL_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function ClientBooking() {
  const [step, setStep] = useState(0);
  const [bloqueios, setBloqueios] = useState<string[]>([]);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [idReserva, setIdReserva] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState({
    data: new Date().toISOString().split('T')[0],
    profissional: '',
    service: '',
    time: '',
    name: '',
    phone: ''
  });

  const datasDisponiveis = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    const fetchBloqueios = async () => {
      const { data } = await supabase.from('bloqueios').select('data');
      if (data) setBloqueios(data.map(b => b.data));
    };
    fetchBloqueios();
  }, []);

  useEffect(() => {
    if (selection.data && selection.profissional && step === 3) {
      const fetchOcupados = async () => {
        const { data } = await supabase.from('agendamentos')
          .select('hora')
          .eq('data', selection.data)
          .eq('profissional', selection.profissional)
          .neq('cliente_nome', 'RESERVADO');
        if (data) setHorariosOcupados(data.map(h => h.hora));
      };
      fetchOcupados();
    }
  }, [selection.data, selection.profissional, step]);

  const isDataInvalida = (dataStr: string) => {
    const d = new Date(dataStr + "T00:00:00");
    const diaSemana = d.getDay(); 
    return diaSemana === 0 || diaSemana === 1 || bloqueios.includes(dataStr);
  };

  const reservarHorario = async (hora: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('agendamentos').insert([{
        cliente_nome: 'RESERVADO',
        hora: hora,
        data: selection.data,
        profissional: selection.profissional,
        servico_nome: selection.service,
        cliente_whatsapp: '0'
      }]).select();

      if (error) {
        alert("Erro ao selecionar horário.");
      } else if (data && data.length > 0) {
        setIdReserva(data[0].id);
        setSelection(prev => ({ ...prev, time: hora }));
        setStep(4);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-10">
      <header className="bg-zinc-950 text-white pt-10 pb-16 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden border-b-4 border-amber-600 text-center">
        <Skull size={48} className="text-zinc-100 mb-2 mx-auto" />
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">
          Carecas & <span className="text-amber-600">Barbudos</span>
        </h1>
      </header>

      <main className="max-w-md mx-auto px-6 -mt-8 relative z-20">
        {step === 0 && (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in fade-in">
            <h2 className="font-black text-slate-800 uppercase text-center mb-6 text-xs tracking-widest">Selecione o Dia</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {datasDisponiveis.map((dataStr) => {
                const d = new Date(dataStr + "T00:00:00");
                const selecionada = selection.data === dataStr;
                const invalida = isDataInvalida(dataStr);
                return (
                  <button key={dataStr} disabled={invalida} onClick={() => setSelection({...selection, data: dataStr})}
                    className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all 
                      ${selecionada ? 'bg-amber-600 border-amber-600 text-white scale-105' : 
                        invalida ? 'bg-slate-50 border-transparent text-slate-300' : 'bg-white border-slate-100 text-slate-600'}`}>
                    <span className="text-[10px] font-black uppercase">{d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                    <span className="text-lg font-black">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            {!isDataInvalida(selection.data) && (
              <button onClick={() => setStep(1)} className="w-full mt-6 bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                Próximo Passo
              </button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <button onClick={() => setStep(0)} className="text-slate-400 flex items-center gap-1 text-[10px] font-black uppercase"><ArrowLeft size={14}/> Voltar</button>
            <h2 className="font-black text-center text-slate-800 uppercase italic">Escolha o Barbeiro</h2>
            {BARBEIROS.map(b => (
              <button key={b} onClick={() => { setSelection({...selection, profissional: b}); setStep(2); }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center w-full active:scale-95 transition-all">
                <span className="text-xl font-black uppercase text-zinc-800">{b}</span>
                <ChevronRight className="text-amber-500" />
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <button onClick={() => setStep(1)} className="text-slate-400 flex items-center gap-1 text-[10px] font-black uppercase"><ArrowLeft size={14}/> Voltar</button>
            <h2 className="font-black text-center text-slate-800 uppercase italic">O que vamos fazer?</h2>
            {SERVICES.map(s => (
              <button key={s.id} onClick={() => { setSelection({...selection, service: s.name}); setStep(3); }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 w-full flex justify-between items-center active:scale-95 transition-all">
                <span className="font-black text-slate-800 uppercase tracking-tighter">{s.name}</span>
                <span className="text-amber-600 font-black">R$ {s.price}</span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right-4">
             <button onClick={() => setStep(2)} className="text-slate-400 flex items-center gap-1 text-[10px] font-black uppercase mb-4"><ArrowLeft size={14}/> Mudar Serviço</button>
             <h2 className="font-black text-center text-slate-800 uppercase italic mb-6">Horários Disponíveis</h2>
             <div className="grid grid-cols-3 gap-3">
              {ALL_SLOTS.map(s => {
                const ocupado = horariosOcupados.includes(s);
                return (
                  <button key={s} disabled={ocupado || loading} onClick={() => reservarHorario(s)} 
                    className={`p-4 rounded-2xl font-black transition-all border-2 text-sm ${ocupado ? 'bg-slate-100 text-slate-300 border-transparent' : 'bg-white border-slate-100 hover:border-amber-600 active:bg-amber-600 active:text-white'}`}>
                    {loading && selection.time === s ? "..." : s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl space-y-6 animate-in zoom-in">
            <h2 className="font-black text-xl italic uppercase text-center">Finalizar Agendamento</h2>
            <div className="space-y-4">
              <input placeholder="Seu Nome" className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-amber-600 transition-all" onChange={e => setSelection({...selection, name: e.target.value})}/>
              <input placeholder="Seu WhatsApp" type="tel" className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-amber-600 transition-all" onChange={e => setSelection({...selection, phone: e.target.value})}/>
            </div>
            <button disabled={!selection.name || !selection.phone || loading}
              onClick={async () => {
                setLoading(true);
                await supabase.from('agendamentos').update({ cliente_nome: selection.name, cliente_whatsapp: selection.phone }).eq('id', idReserva);
                setStep(5);
                setLoading(false);
              }} className="w-full bg-zinc-900 text-white p-6 rounded-[2rem] font-black uppercase shadow-xl active:scale-95 transition-all">Confirmar Agora</button>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in zoom-in duration-500 max-w-sm mx-auto">
            <div className="bg-white rounded-t-[2rem] p-8 border-b-2 border-dashed border-slate-100 relative shadow-xl text-center">
              <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#f8fafc] rounded-full"></div>
              <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#f8fafc] rounded-full"></div>
              <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-black uppercase">Agendado com Sucesso!</h2>
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-left">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{selection.profissional} • {selection.service}</p>
                <p className="font-black text-zinc-800 uppercase text-sm mt-1">{selection.data.split('-').reverse().join('/')} às {selection.time}</p>
              </div>
            </div>
            <div className="bg-white rounded-b-[2rem] p-8 shadow-xl text-center space-y-4">
              <p className="text-[11px] text-slate-500 font-medium px-2">Para validar sua reserva, envie a confirmação no nosso WhatsApp agora:</p>
              <button 
                onClick={() => {
                  const dataFormatada = selection.data.split('-').reverse().join('/');
                  const msg = encodeURIComponent(`Olá, meu nome é *${selection.name}* e acabei de reservar o horário das *${selection.time}* (dia ${dataFormatada}) com o barbeiro *${selection.profissional}* para o serviço de *${selection.service}*.\n\nPoderia confirmar minha reserva? 💀🔥`);
                  window.open(`https://wa.me/5531999999999?text=${msg}`, '_blank');
                }}
                className="w-full bg-green-600 text-white p-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">Confirmar no WhatsApp</button>
            </div>
          </div>
        )}
      </main>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}