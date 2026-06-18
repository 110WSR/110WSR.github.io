/** 各职业可选技能列表（基于5e玩家手册） */
const CLASS_SKILLS: Record<string, { skills: string[]; count: number }> = {
  "野蛮人": { skills: ["驯兽", "运动", "威吓", "自然", "察觉", "求生"], count: 2 },
  "吟游诗人": { skills: ["体操", "运动", "欺瞒", "洞悉", "威吓", "调查", "医药", "自然", "察觉", "表演", "游说", "巧手", "隐匿", "求生"], count: 3 },
  "牧师": { skills: ["历史", "洞悉", "医药", "游说", "宗教"], count: 2 },
  "德鲁伊": { skills: ["奥秘", "驯兽", "洞悉", "医药", "自然", "察觉", "宗教", "求生"], count: 2 },
  "战士": { skills: ["体操", "驯兽", "运动", "历史", "洞悉", "威吓", "调查", "察觉", "求生"], count: 2 },
  "武僧": { skills: ["体操", "运动", "历史", "洞悉", "宗教", "隐匿"], count: 2 },
  "圣武士": { skills: ["运动", "洞悉", "威吓", "医药", "游说", "宗教"], count: 2 },
  "游侠": { skills: ["驯兽", "运动", "洞悉", "调查", "自然", "察觉", "隐匿", "求生"], count: 3 },
  "游荡者": { skills: ["体操", "欺瞒", "洞悉", "威吓", "调查", "察觉", "表演", "游说", "巧手", "隐匿"], count: 4 },
  "术士": { skills: ["奥秘", "欺瞒", "洞悉", "威吓", "游说", "宗教"], count: 2 },
  "邪术师": { skills: ["奥秘", "欺瞒", "历史", "威吓", "调查", "自然", "宗教"], count: 2 },
  "法师": { skills: ["奥秘", "历史", "洞悉", "调查", "医药", "宗教"], count: 2 },
  "奇械师": { skills: ["奥秘", "历史", "洞悉", "调查", "医药", "察觉", "巧手"], count: 2 },
  "血猎手": { skills: ["运动", "奥秘", "调查", "察觉", "求生"], count: 2 },
};

/** 所有18项技能列表 */
const ALL_SKILLS = [
  { name: "体操", attr: "敏捷" },
  { name: "驯兽", attr: "感知" },
  { name: "奥秘", attr: "智力" },
  { name: "运动", attr: "力量" },
  { name: "欺瞒", attr: "魅力" },
  { name: "历史", attr: "智力" },
  { name: "洞悉", attr: "感知" },
  { name: "威吓", attr: "魅力" },
  { name: "调查", attr: "智力" },
  { name: "医药", attr: "感知" },
  { name: "自然", attr: "智力" },
  { name: "察觉", attr: "感知" },
  { name: "表演", attr: "魅力" },
  { name: "游说", attr: "魅力" },
  { name: "宗教", attr: "智力" },
  { name: "巧手", attr: "敏捷" },
  { name: "隐匿", attr: "敏捷" },
  { name: "求生", attr: "感知" },
];

export default function SkillSelectionPanel({ className, selectedSkills, onSkillsChange }: {
  className: string; selectedSkills: string[]; onSkillsChange: (skills: string[]) => void;
}) {
  const classInfo = className ? CLASS_SKILLS[className] : null;
  const availableSkills = classInfo ? classInfo.skills : ALL_SKILLS.map(s => s.name);
  const maxCount = classInfo ? classInfo.count : 3;

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      onSkillsChange(selectedSkills.filter((s) => s !== skillName));
    } else if (selectedSkills.length < maxCount) {
      onSkillsChange([...selectedSkills, skillName]);
    }
  };

  return (
    <div className="space-y-4">
      {classInfo && (
        <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700/50">
          <p className="text-stone-400 text-xs leading-relaxed">
            你的职业可选 {classInfo.count} 项技能熟练（已选 {selectedSkills.length}/{maxCount}）
          </p>
        </div>
      )}
      {!className && (
        <p className="text-stone-400 text-sm">请先在基本信息中选择职业</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {ALL_SKILLS.map((skill) => {
          const isAvailable = availableSkills.includes(skill.name);
          const isSelected = selectedSkills.includes(skill.name);
          const isMaxed = !isSelected && selectedSkills.length >= maxCount;
          return (
            <button
              key={skill.name}
              onClick={() => isAvailable && toggleSkill(skill.name)}
              disabled={!isAvailable || (isMaxed)}
              className={"px-3 py-2 rounded-md text-xs transition-all duration-200 text-left flex items-center justify-between " +
                (isSelected
                  ? "bg-amber-700/50 text-amber-200 border border-amber-600/50"
                  : isAvailable
                    ? "bg-stone-800/50 text-stone-400 border border-stone-700/50 hover:border-stone-600/50"
                    : "bg-stone-900/30 text-stone-600 border border-stone-800/50 cursor-not-allowed opacity-50")
              }
            >
              <span>{skill.name}</span>
              <span className="text-[10px] opacity-60">({skill.attr})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
