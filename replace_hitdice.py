import re

with open('src/pages/PageFront.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the HitDiceDisplay function
start_marker = 'function HitDiceDisplay({ remainingHitDice: forcedRemaining }: { remainingHitDice?: number }) {'
end_marker = 'function DeathSaveDisplay()'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx >= 0 and end_idx >= 0:
    old_func = content[start_idx:end_idx].rstrip() + '\n\n'
    
    new_func = '''function HitDiceDisplay({ remainingHitDice: forcedRemaining }: { remainingHitDice?: number }) {
  const { character, updateCharacter } = useCharacter();
  const hitDiceText = useMemo(() => {
    if (!character) return "0";
    const classId = character.basicInfo["职业_id"];
    const classEntry = classId ? (classData as any)[classId] : null;
    if (!classEntry) return "0";
    const level = typeof character.level === "number" ? character.level : 1;
    const remaining = forcedRemaining ?? level;
    return \`\${remaining}d\${classEntry.hitpoints[0]}\`;
  }, [character, forcedRemaining]);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = () => {
    if (!character) return;
    setEditValue(hitDiceText);
    setEditing(true);
  };

  const handleCommitEdit = () => {
    setEditing(false);
    const match = editValue.match(/^(\\d+)d(\\d+)$/i);
    if (!match || !character) return;
    const remaining = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const classId = character.basicInfo["职业_id"];
    const classEntry = classId ? (classData as any)[classId] : null;
    if (!classEntry) return;
    updateCharacter({ customHeights: { ...character.customHeights, _hitDiceRemaining: remaining } });
  };

  return (
    <div className="absolute bg-white h-[90px] left-[62px] rounded-[2px] top-[386px] w-[149px]" data-name="hit-dice">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <div className="absolute contents right-[9px] top-[10px]">
          <div className="absolute bg-sheet-content-bg h-[56px] overflow-clip right-[9px] top-[10px] w-[131px]">
            <div className="-translate-x-1/2 -translate-y-1/2 [word-break:break-word] absolute flex flex-col font-serif-regular font-normal h-[56px] justify-center leading-[0] left-[65.5px] text-[24px] text-black text-center top-[28px] w-[131px]" style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {editing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleCommitEdit}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCommitEdit(); if (e.key === "Escape") setEditing(false); }}
                  className="w-full h-full bg-transparent text-center text-[24px] font-serif-regular outline-none border-none p-0 m-0"
                  style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                />
              ) : (
                <p className="leading-[normal] cursor-pointer hover:bg-sheet-hover-bg" onClick={handleStartEdit}>{hitDiceText}</p>
              )}
            </div>
          </div>
          <div className="[word-break:break-word] absolute bottom-[12px] flex flex-col font-serif-medium-cjk font-medium justify-center leading-[0] right-[74.5px] text-[10px] text-black text-center translate-x-1/2 translate-y-1/2 w-[131px]" style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
            <p className="leading-[normal]">生命骰</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-2 border-black border-solid inset-[-1px] pointer-events-none rounded-[3px] shadow-[-4px_0px_0px_0px_black,0px_1px_0px_0px_black,0px_-1px_0px_0px_black]" />
    </div>
  );
}

'''
    
    content = content[:start_idx] + new_func + content[end_idx:]
    
    with open('src/pages/PageFront.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS: HitDiceDisplay function replaced')
else:
