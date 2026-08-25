import React from 'react';
import { 
  Dumbbell, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Calculator, 
  Settings, 
  Zap,
  Activity
} from 'lucide-react';

export type TabType = 'workouts' | 'active' | 'analytics' | 'history' | 'calculators' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  hasActiveWorkout: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  hasActiveWorkout,
}) => {
  const tabs = [
    { id: 'workouts' as TabType, label: 'Программы', icon: Dumbbell },
    ...(hasActiveWorkout
      ? [{ id: 'active' as TabType, label: 'Тренировка', icon: Zap, isSpecial: true }]
      : []),
    { id: 'analytics' as TabType, label: 'Прогресс', icon: TrendingUp },
    { id: 'history' as TabType, label: 'История', icon: Calendar },
    { id: 'calculators' as TabType, label: 'Калькуляторы', icon: Calculator },
    { id: 'settings' as TabType, label: 'Настройки', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e15]/95 backdrop-blur-xl border-t border-[#202536] px-2 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="relative -top-3 flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 group-active:scale-95 transition-transform animate-pulse">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <span className="text-[10px] font-black text-emerald-400 mt-1 uppercase tracking-wider">
                  Идет сет!
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
