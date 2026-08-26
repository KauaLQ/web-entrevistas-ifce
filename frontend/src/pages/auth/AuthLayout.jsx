import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col sm:flex-row bg-paper">
      <div className="sm:w-[42%] bg-gradient-to-br from-ink via-ink to-primary-dark px-6 sm:px-10 pt-10 sm:pt-16 pb-9 sm:pb-16 rounded-b-[2rem] sm:rounded-b-none sm:rounded-r-[2.5rem] shadow-lg shadow-ink/20 flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 bg-paper/10 text-paper rounded-xl px-3 py-2">
            <GraduationCap size={20} />
            <span className="font-display font-semibold">Entrevistas IFCE</span>
          </div>
          <h1 className="mt-6 font-display font-semibold text-2xl sm:text-3xl text-paper leading-snug">
            Simule sua próxima entrevista de emprego.
          </h1>
          <p className="mt-3 text-paper/70 text-sm leading-relaxed max-w-sm">
            Uma iniciativa da coordenação de estágios do IFCE: pratique com
            uma entrevistadora de IA, receba perguntas para o seu cargo alvo
            e um feedback estruturado ao final.
          </p>
        </div>
        <p className="hidden sm:block text-paper/40 text-xs mt-10">
          Instituto Federal de Educação, Ciência e Tecnologia do Ceará | IFCE Campus Pecém
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
