import re, json

with open('5e6.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# ========== 提取所有职业的装备选择 ==========
# 每个职业的装备部分格式: "装备Equipment" 后面跟着列表项
class_equipment = {}

# 查找所有职业的装备部分
# 职业列表
classes = ['野蛮人', '吟游诗人', '牧师', '德鲁伊', '战士', '武僧', '圣武士', '游侠', '游荡者', '术士', '邪术师', '法师']

for cls in classes:
    # 找到该职业的装备部分
    pattern = rf'{cls}.*?装备Equipment(.*?)(?=职业特性Class Features|法术施法|$|Page \d+)'
    m = re.search(pattern, content, re.DOTALL)
    if m:
        equip_text = m.group(1)
        # 提取列表项
        items = re.findall(r'[·•]\s*(.*?)(?=[·•]|$|\n\n)', equip_text)
        class_equipment[cls] = [item.strip() for item in items if item.strip()]
        print(f'{cls}: {len(class_equipment[cls])} 个装备选项')
        for item in class_equipment[cls]:
            print(f'  - {item[:100]}')
    else:
        print(f'{cls}: 未找到装备部分')

print('\n\n')

# ========== 提取技能选择 ==========
for cls in classes:
    pattern = rf'{cls}.*?技能[：:](.*?)(?=装备Equipment|$|\n\n\n)'
    m = re.search(pattern, content, re.DOTALL)
    if m:
        skill_text = m.group(1).strip()
        print(f'{cls} 技能: {skill_text[:200]}')

print('\n\n')

# ========== 提取快速建卡中的法术选择 ==========
for cls in classes:
    pattern = rf'{cls}.*?快速建卡Quick Build.*?最后选择戏法(.*?)(?=。|$|\n)'
    m = re.search(pattern, content, re.DOTALL)
    if m:
        print(f'{cls} 戏法: {m.group(1)[:200]}')