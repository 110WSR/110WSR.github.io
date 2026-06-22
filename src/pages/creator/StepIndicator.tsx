export default function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-hidden flex-wrap">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className={"w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 " + (index === currentStep ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30" : index < currentStep ? "bg-amber-800/50 text-amber-300" : "bg-stone-700 text-stone-500")}>
            {index < currentStep ? "\u2713" : index + 1}
          </div>
          <span className={"text-xs sm:text-sm hidden sm:block " + (index === currentStep ? "text-amber-300" : "text-stone-500")}>{step}</span>
          {index < steps.length - 1 && <div className={"w-4 sm:w-8 h-0.5 " + (index < currentStep ? "bg-amber-700" : "bg-stone-700")} />}
        </div>
      ))}
    </div>
  );
}
