import { GraduationCap, Mic, ClipboardCheck, Lightbulb, TrendingUp } from "lucide-react";
import logoIfce from "../../assets/ifce-logo-branco.png";
import fotoCampus from "../../assets/ifce-campus-pecem.png";

// Diferenciais reais da plataforma (sem métricas inventadas)
const DESTAQUES = [
  { icone: Mic, texto: "Responda em voz alta, como numa entrevista real" },
  { icone: ClipboardCheck, texto: "Nota geral e avaliação de cada resposta" },
  { icone: Lightbulb, texto: "Recomendações práticas para treinar" },
  { icone: TrendingUp, texto: "Histórico de simulações para acompanhar sua evolução" },
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col sm:flex-row bg-paper">
      {/* Seção da Esquerda (Gradiente escuro + Malha quadriculada com efeito de fade) */}
      <div className="sm:w-[42%] bg-gradient-to-br from-ink via-ink to-primary-dark px-6 sm:px-10 pt-10 sm:pt-16 pb-9 sm:pb-16 rounded-b-[2rem] sm:rounded-b-none sm:rounded-r-[2.5rem] shadow-lg shadow-ink/20 flex flex-col justify-between relative overflow-hidden">
        
        {/* Overlay da malha quadriculada com máscara de transparência (Fade) */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            // O mask-image faz a malha aparecer mais no topo/esq e sumir nas áreas mais escuras
            maskImage: 'radial-gradient(circle at 100% 100%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle at 100% 100%, black 20%, transparent 75%)',
          }}
        />

        {/* Conteúdo da esquerda (com z-10 para ficar acima da malha) */}
        <div className="relative z-10">
          {/* Container maior com a logo maior e a badge harmonizadas */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Logo do IFCE com tamanho maior (h-12 / max-w-[180px]) */}
            <img 
              src={logoIfce} 
              alt="Logo IFCE Campus Pecém" 
              className="h-16 sm:h-18 w-auto object-contain max-w-[190px]" 
            />

            {/* Divisor sutil entre os elementos */}
            <div className="h-8 w-px bg-paper/20 hidden sm:block" />

            {/* Badge com capelo e texto proporcional */}
            <div className="inline-flex items-center gap-2 bg-paper/10 text-paper rounded-xl px-3.5 py-2.5">
              <GraduationCap size={20} />
              <span className="font-display font-semibold text-sm">Web Entrevistas</span>
            </div>
          </div>
          <h1 className="mt-6 font-display font-semibold text-2xl sm:text-3xl text-paper leading-snug">
            Simule sua próxima entrevista de emprego.
          </h1>
          <p className="mt-3 text-paper/70 text-sm leading-relaxed max-w-sm">
            Uma iniciativa da coordenação de estágios do IFCE: pratique com
            uma entrevistadora de IA, receba perguntas para o seu cargo alvo
            e um feedback estruturado ao final.
          </p>
          <ul className="hidden lg:block mt-8 space-y-3.5">
            {DESTAQUES.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-start gap-3 text-sm text-paper/85">
                <Icone size={18} className="shrink-0 mt-0.5 text-sage" />
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <p className="hidden sm:block text-paper/40 text-xs mt-10 relative z-10">
          Instituto Federal de Educação, Ciência e Tecnologia do Ceará | IFCE Campus Pecém
        </p>
      </div>

      {/* Seção da Direita (Fundo branco com o padrão de bolinhas) */}
      <div 
        className="flex-1 flex items-center justify-center px-6 py-10 sm:py-16 relative bg-white"
        style={{
          backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.08) 1.2px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      >
        {/* Card branco com sombra suave: foto + texto + botão */}
        <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-xl shadow-ink/10 ring-1 ring-ink/5 animate-slide-up">
          {/* Foto emoldurada (escondida no mobile pra não empurrar o botão de login) */}
          <div className="hidden sm:block mb-6 rounded-2xl border-2 border-primary-dark/80 p-1">
            <img
              src={fotoCampus}
              alt="Fachada do IFCE Campus Pecém"
              decoding="async"
              className="w-full aspect-[2/1] object-cover rounded-xl"
            />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}